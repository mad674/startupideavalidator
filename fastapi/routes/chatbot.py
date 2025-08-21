# chatbot.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from memory.memory_store import MemoryStore
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.prompts.chat import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.memory import ConversationBufferMemory, ChatMessageHistory
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, json, asyncio, httpx, traceback

load_dotenv()

router = APIRouter()
memory = MemoryStore()

# -----------------------------
# Config / LLM
# -----------------------------
llm = ChatOpenAI(
    model=os.getenv("LLM_MODEL", "llama3-70b-8192"),
    temperature=0.4,
    streaming=False,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    openai_api_base=os.getenv("OPENAI_API_BASE"),
)

SESSION_TIMEOUT_DAYS = 30
STREAM_CHUNK_WORDS = 8
STREAM_CHUNK_DELAY = 0.03

# -----------------------------
# Helpers
# -----------------------------
def chunk_text_by_words(text: str, words_per_chunk: int = STREAM_CHUNK_WORDS):
    words = text.split()
    for i in range(0, len(words), words_per_chunk):
        yield " ".join(words[i : i + words_per_chunk])

def fetch_idea_from_db(user_id: str, idea_id: str) -> dict:
    """Retrieve the structured part of the idea from memory/db."""
    idea = memory.get_idea(user_id, idea_id) or {}
    return idea.get("structured", {})  # Always return a dict, never None

def format_idea_context(idea: dict) -> str:
    """Format the idea dictionary into readable context string."""
    if not idea:
        return "No startup idea found yet."
    structured = idea.get("structured", {}) or {}
    lines = [f"**{k}**: {v}" for k, v in structured.items()]
    return "\n".join(lines)

# -----------------------------
# Tools implementations
# -----------------------------
def _impl_retrieve_idea(user_id: str, idea_id: str) -> str:
    idea = memory.get_idea(user_id, idea_id)
    return json.dumps(idea or {}, indent=2, ensure_ascii=False)

def _impl_summarize_history(user_id: str, idea_id: str) -> str:
    idea = memory.get_idea(user_id, idea_id)
    history = idea.get("chat_history", []) if idea else []
    if not history:
        return "No chat history yet."
    lines = []
    for msg in history[-20:]:
        role = msg.get("role", "agent")
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "Recent conversation:\n" + "\n".join(lines)

def _impl_update_idea(user_id: str, idea_id: str, updated_fields: dict, auth_token: str = "") -> str:
    idea = memory.get_idea(user_id, idea_id)
    if not idea:
        return "⚠️ Idea not found."
    current_structured = idea.get("structured", {}) or {}
    current_structured.update(updated_fields)
    memory.update_idea(user_id=user_id, idea_id=idea_id, new_structured=current_structured)

    backend_url = os.getenv("BACKEND_URL")
    if backend_url:
        url = f"{backend_url}/idea/updateidea/{idea_id}"
        headers = {"Content-Type": "application/json"}
        if auth_token:
            headers["Authorization"] = auth_token
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.put(url, json={"data": updated_fields}, headers=headers)
                if resp.status_code == 200:
                    return f"✅ Updated both locally and backend. Fields: {json.dumps(updated_fields)}"
                else:
                    return f"⚠️ Updated locally, backend failed: {resp.text}"
        except Exception as e:
            return f"⚠️ Updated locally, backend error: {e}"
    return f"✅ Updated locally. Fields: {json.dumps(updated_fields)}"

# -----------------------------
# Tools factory
# -----------------------------
def build_tools_with_context(user_id: str, idea_id: str, auth_token: str):
    def retrieve_idea_tool(_: str = "") -> str:
        return _impl_retrieve_idea(user_id, idea_id)
    def summarize_history_tool(_: str = "") -> str:
        return _impl_summarize_history(user_id, idea_id)
    def update_idea_tool(updated_fields_json: str) -> str:
        try:
            fields = json.loads(updated_fields_json)
            if not isinstance(fields, dict):
                return "❌ update_idea expects a JSON object string."
        except Exception:
            return "❌ Provide valid JSON to update_idea."
        return _impl_update_idea(user_id, idea_id, fields, auth_token)

    return [
        Tool(name="retrieve_idea", description="Get the current startup idea.", func=retrieve_idea_tool),
        Tool(name="summarize_history", description="Summarize recent chat history.", func=summarize_history_tool),
        Tool(name="update_idea", description="Update idea fields after user confirmation.", func=update_idea_tool),
    ]

# -----------------------------
# System Prompt
# -----------------------------
SYSTEM_PROMPT = """
You are a **Startup Coach Agent** that helps founders refine and validate their startup ideas.

---

### Context
The current startup idea is:
{idea_context}

---

### Core Behavior

1. **Intent Detection**
   - Always analyze the user’s message.
   - If the message suggests adding, changing, or refining any of these fields → classify as **UPDATE intent**:
     - name
     - problem_statement
     - solution
     - target_market
     - team
     - business_model
   - Otherwise, classify as **CHAT intent**.

2. **On UPDATE intent**
   - Identify only the fields that changed.
   - Ask the user for confirmation before applying the update. Example:
     "I understood that you want to update the **target_market** to 'Early-stage professionals'. Should I go ahead and update this?"
   - If the user confirms → prepare the tool call as:
     ```json
     {{
       "update_fields": {{ "changed_field": "new_value" }}
     }}
     ```
   - Never include unchanged fields.
   - After backend confirmation:
     - If success → confirm naturally in plain language.
     - If failure → politely explain that the update did not go through.

3. **On CHAT intent**
   - Respond conversationally as a supportive startup coach.
   - Use available context when relevant.
   - Provide concise, actionable advice or encouragement.

4. **Fallback Handling**
   - If no startup idea exists → ask the user to share one before continuing.
   - If the message is unclear → ask a clarifying follow-up question.

---

### Rules & Constraints
- Allowed fields for update: {{ "name", "problem_statement", "solution", "target_market", "team", "business_model" }}
- Never hallucinate new fields or return empty responses.
- Always explicitly choose between **UPDATE** and **CHAT**.
- For CHAT → output must be plain text only.
- For UPDATE → output must strictly follow the JSON format shown above.
- Always require explicit user confirmation before calling the update tool.

---

### Goal
Be reliable, structured, and human-like in coaching while maintaining software-friendly outputs for updates.
"""

# -----------------------------
# Agent setup
# -----------------------------
def build_agent_executor(user_id: str, idea_id: str, auth_token: str) -> AgentExecutor:
    # Build tools
    tools = build_tools_with_context(user_id, idea_id, auth_token)

    # Get idea context from DB
    idea_structured = fetch_idea_from_db(user_id, idea_id)
    idea_context = format_idea_context({"structured": idea_structured})

    # Use SYSTEM_PROMPT safely, only formatting {idea_context}
    system_prompt_safe = SYSTEM_PROMPT.replace("{", "{{").replace("}", "}}")
    system_prompt_safe = system_prompt_safe.replace("{{idea_context}}", "{idea_context}")
    system_prompt_safe = system_prompt_safe.replace('{{ name", "problem_statement", "solution", "target_market", "team", "business_model" }}', '{ name", "problem_statement", "solution", "target_market", "team", "business_model" }')
    system_prompt_with_context = system_prompt_safe.format(idea_context=idea_context)

    # Build prompt
    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt_with_context),
        MessagesPlaceholder("chat_history"),
        HumanMessagePromptTemplate.from_template("{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    # Agent memory
    history = ChatMessageHistory()
    agent_memory = ConversationBufferMemory(
        chat_memory=history,
        memory_key="chat_history",
        return_messages=True,
        output_key="output"
    )

    # Create agent
    agent = create_openai_functions_agent(
        llm=llm,
        tools=tools,
        prompt=prompt,
    )

    return AgentExecutor(agent=agent, tools=tools, memory=agent_memory, verbose=True)

# -----------------------------
# WebSocket endpoint
# -----------------------------

@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    persistent_agents: dict[str, AgentExecutor] = {}
    memory_activity = {}

    async def cleanup_inactive():
        while True:
            now = datetime.utcnow()
            stale = [k for k, v in memory_activity.items()
                     if now - v["last_active"] > timedelta(days=SESSION_TIMEOUT_DAYS)]
            for k in stale:
                persistent_agents.pop(k, None)
                memory_activity.pop(k, None)
            await asyncio.sleep(60)

    cleanup_task = asyncio.create_task(cleanup_inactive())

    try:
        while True:
            data = await websocket.receive_json()
            user_id = data.get("user_id")
            idea_id = data.get("idea_id")
            message = data.get("message")
            auth_token = data.get("auth_token", "")

            if not all([user_id, idea_id, message]):
                await websocket.send_json({"error": "user_id, idea_id, and message required"})
                continue

            key = f"{user_id}_{idea_id}"
            if key not in persistent_agents:
                persistent_agents[key] = build_agent_executor(user_id, idea_id, auth_token)
            agent_executor = persistent_agents[key]
            memory_activity[key] = {"last_active": datetime.utcnow()}

            try:
                result = await agent_executor.ainvoke({"input": message})
                final_response = result.get("output", "").strip() if isinstance(result, dict) else str(result)
                if not final_response:
                    final_response = "⚠️ I couldn’t generate a reply. Please try again."
            except Exception as e:
                traceback.print_exc()
                final_response = f"❌ Agent error: {e}"

            # Streaming
            for chunk in chunk_text_by_words(final_response, STREAM_CHUNK_WORDS):
                await websocket.send_json({"response": chunk, "type": "stream"})
                await asyncio.sleep(STREAM_CHUNK_DELAY)
            await websocket.send_json({"response": final_response, "type": "final"})

            # Save to memory
            memory.update_idea(
                user_id=user_id,
                idea_id=idea_id,
                append_chat=[
                    {"role": "user", "content": message, "timestamp": datetime.utcnow().isoformat()},
                    {"role": "agent", "content": final_response, "timestamp": datetime.utcnow().isoformat()},
                ],
            )

    except WebSocketDisconnect:
        print("❌ Client disconnected")
    finally:
        cleanup_task.cancel()
