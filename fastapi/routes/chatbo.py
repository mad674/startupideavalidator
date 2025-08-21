from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from memory.memory_store import MemoryStore
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import HumanMessage, AIMessage
import json, os, asyncio
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
router = APIRouter()
memory = MemoryStore()

llm = ChatOpenAI(
    model="llama3-70b-8192",
    temperature=0.4,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    openai_api_base=os.getenv("OPENAI_API_BASE"),
)

MAX_CHAT_MESSAGES = 50
SESSION_TIMEOUT_DAYS = 30
MAX_CHAT_HISTORY = 30  # Keeps last 30 messages

# -----------------------------
# Helpers
# -----------------------------
def retrieve_idea(user_id: str, idea_id: str):
    return memory.get_idea(user_id, idea_id)

async def backend_update(idea_id: str, data: dict, auth_token: str = ""):
    import httpx
    url = f"{os.getenv('BACKEND_URL')}/idea/updateidea/{idea_id}"
    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["Authorization"] = auth_token
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.put(url, json={"data": data}, headers=headers)
            print(f"Backend response ({resp.status_code}): {resp.text}")
            return resp.status_code == 200
        except Exception as e:
            print("Backend update error:", e)
            return False

def wants_update(message: str):
    triggers = ["new","Change","update","update my idea", "change my idea", "apply this", "save changes", "update idea"]
    return any(word in message.lower() for word in triggers)

def last_pending_confirmation(chat_history):
    return bool(chat_history and chat_history[-1].get("type") == "update_confirmation")

async def update_idea(user_id: str, idea_id: str, updated_fields: dict, auth_token: str = "", chat_entries=None):
    idea = retrieve_idea(user_id, idea_id)
    if not idea:
        return "⚠️ Idea not found."
    
    # Update MemoryStore (Pinecone-backed)
    current_structured = idea.get("structured", {})
    current_structured.update(updated_fields)
    memory.update_idea(user_id, idea_id, current_structured, chat_entries)

    # Update backend
    payload_data = {k: str(v) for k, v in updated_fields.items()}
    success = await backend_update(idea_id, payload_data, auth_token)
    return success # if success else "⚠️ Idea updated locally, backend update failed."

async def summarize_old_messages(messages, llm):
    chat_text = "\n".join([f"{m.type}: {m.content}" for m in messages])
    prompt = f"Summarize the following conversation into a short context:\n\n{chat_text}"
    try:
        summary_resp = await llm.agenerate([[HumanMessage(content=prompt)]])
        return AIMessage(content=summary_resp.generations[0][0].text)
    except Exception as e:
        print("Summarization error:", e)
        return AIMessage(content="[Previous chat summary unavailable]")

async def detect_updates(llm, current_idea, user_message):
    prompt = f"""
your are a startup analyst.
Current idea data:
{json.dumps(current_idea, indent=2)}

User wants to change something: "{user_message}"

Return a JSON object with only the fields that need to be updated.
If nothing should be changed, return an empty JSON: {{}}
"""
    try:
        llm_resp = await llm.agenerate([[HumanMessage(content=prompt)]])
        text = llm_resp.generations[0][0].text.strip()
        updates = json.loads(text)
        return updates
    except Exception as e:
        print("Error detecting updates:", e)
        return {}

def serialize_messages(messages):
    serialized = []
    for m in messages:
        if isinstance(m, HumanMessage):
            serialized.append({"role": "user", "content": m.content})
        elif isinstance(m, AIMessage):
            serialized.append({"role": "agent", "content": m.content})
    return serialized

# -----------------------------
# WebSocket Endpoint
# -----------------------------
@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    persistent_memories = {}
    memory_activity = {}

    async def cleanup_inactive_memories():
        while True:
            now = datetime.utcnow()
            to_delete = [key for key, val in memory_activity.items()
                         if now - val["last_active"] > timedelta(days=SESSION_TIMEOUT_DAYS)]
            for key in to_delete:
                persistent_memories.pop(key, None)
                memory_activity.pop(key, None)
            await asyncio.sleep(60)

    cleanup_task = asyncio.create_task(cleanup_inactive_memories())

    try:
        while True:
            data = await websocket.receive_json()
            user_id, idea_id, message = data.get("user_id"), data.get("idea_id"), data.get("message")
            auth_token = data.get("auth_token", "")
            backend_status = "pending"

            if not all([user_id, idea_id, message]):
                await websocket.send_json({"error": "user_id, idea_id, and message are required"})
                continue

            idea = retrieve_idea(user_id, idea_id)
            if not idea:
                await websocket.send_json({"error": "Idea not found"})
                continue

            chat_history = idea.get("chat_history", []) or []
            memory_key = f"{user_id}_{idea_id}"

            # Initialize memory_activity entry
            if memory_key not in memory_activity:
                memory_activity[memory_key] = {"last_active": datetime.utcnow(), "pending_update": {}}
            else:
                memory_activity[memory_key]["last_active"] = datetime.utcnow()

            # Initialize agent_memory
            if memory_key not in persistent_memories:
                agent_memory = ConversationBufferWindowMemory(k=MAX_CHAT_HISTORY, return_messages=True)
                for msg in chat_history:
                    if msg["role"] == "user":
                        agent_memory.chat_memory.add_user_message(msg["content"])
                    elif msg["role"] == "agent":
                        agent_memory.chat_memory.add_ai_message(msg["content"])
                persistent_memories[memory_key] = agent_memory
            else:
                agent_memory = persistent_memories[memory_key]

            response, entry_type = "", "normal"

            # ---------------------- Update flow ----------------------
            if wants_update(message) and not memory_activity[memory_key]["pending_update"]:
                suggested_update = await detect_updates(llm, idea["structured"], user_message=message)
                if not suggested_update:
                    response = "I don’t see any changes needed for your idea."
                    entry_type = "normal"
                else:
                    # Store pending update for confirmation
                    memory_activity[memory_key]["pending_update"] = suggested_update
                    response = (
                        f"I’ve suggested improvements:\n{json.dumps(suggested_update, indent=2)}\n"
                        "Do you want me to apply these changes?"
                    )
                    entry_type = "update_confirmation"

            elif memory_activity[memory_key]["pending_update"]:
                if message.strip().lower() in ["yes", "yep", "sure", "please"]:
                    pending_update = memory_activity[memory_key].get("pending_update", {})
                    if not pending_update:
                        response = "No updates detected."
                        entry_type = "normal"
                    else:
                        chat_entries = [{"role": "user", "content": message, "type": "normal", "timestamp": datetime.utcnow().isoformat()}]
                        success = await update_idea(user_id, idea_id, pending_update, auth_token, chat_entries)
                        backend_status = "success" if success else "failed"
                        response = f"✅ Idea updated successfully via backend.\nUpdated fields:\n{json.dumps(pending_update, indent=2)}"
                        entry_type = "update_result"
                        memory_activity[memory_key]["pending_update"] = {}
                else:
                    response = "Okay, I won’t update the idea. Let's continue discussing it."
                    entry_type = "normal"
                    memory_activity[memory_key]["pending_update"] = {}
                    
            # ---------------------- Normal conversation ----------------------
            else:
                recent_messages = agent_memory.chat_memory.messages[-MAX_CHAT_MESSAGES:]
                agent_prompt = f"""
You are a helpful startup coach.
User is asking: "{message}"

Here is their current idea (JSON):
{json.dumps(idea['structured'], indent=2)}

Here is recent chat history:
{json.dumps(serialize_messages(recent_messages), indent=2)}

Reply naturally. Do NOT call any tools unless explicitly asked to update.
"""
                try:
                    llm_response = await llm.agenerate([[HumanMessage(content=agent_prompt)]])
                    response = llm_response.generations[0][0].text
                except Exception as e:
                    print("LLM error:", e)
                    response = "❌ LLM error occurred."
                entry_type = "normal"

            timestamp = datetime.utcnow().isoformat()
            agent_memory.chat_memory.add_user_message(message)
            agent_memory.chat_memory.add_ai_message(response)

            if len(agent_memory.chat_memory.messages) > MAX_CHAT_MESSAGES:
                excess = len(agent_memory.chat_memory.messages) - MAX_CHAT_MESSAGES
                old_messages = agent_memory.chat_memory.messages[:excess]
                summary_msg = await summarize_old_messages(old_messages, llm)
                agent_memory.chat_memory.messages = [summary_msg] + agent_memory.chat_memory.messages[excess:]

            memory.update_idea(
                user_id=user_id,
                idea_id=idea_id,
                append_chat=[
                    {"role": "user", "content": message, "type": entry_type, "timestamp": timestamp},
                    {"role": "agent", "content": response, "type": entry_type, "timestamp": timestamp}
                ]
            )

            await websocket.send_json({"response": response, "type": entry_type, "backend_status": backend_status})

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("WebSocket error:", e)
        await websocket.send_json({"error": str(e)})
    finally:
        cleanup_task.cancel()
