# chatbot.py AGENT API , WEBSOCKET API
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from memory.memory_store import MemoryUtils,MemoryDelete,MemoryGet,MemoryUpdate,MemoryStore
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.prompts.chat import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.schema import HumanMessage
# from routes.pdf import PDFRequest, create_pdf
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import ChatMessageHistory
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, json, asyncio, httpx, traceback
from utils.encrypt import Decryptor
from langchain_openai import ChatOpenAI
import requests 

load_dotenv()

router = APIRouter()
# Memory=Memory()
memory_utils=MemoryUtils()
memory_store=MemoryStore()
memory_get=MemoryGet()
memory_update=MemoryUpdate()
memory_delete=MemoryDelete()
decryptor=Decryptor()
# -----------------------------
# Health check endpoint for monitoring
# -----------------------------
@router.get("/health")
async def health():
    """Health check endpoint for monitoring."""
    return {"status": "ok"}

# -----------------------------
# Config / LLM
# -----------------------------
# from llm import llm
SESSION_TIMEOUT_DAYS = 30
STREAM_CHUNK_WORDS = 8
STREAM_CHUNK_DELAY = 0.03

# -----------------------------
# Helpers
# -----------------------------
def chunk_text_by_words(text: str, words_per_chunk: int = STREAM_CHUNK_WORDS):
    """Yield text in chunks of N words for streaming."""
    words = text.split()
    for i in range(0, len(words), words_per_chunk):
        yield " ".join(words[i : i + words_per_chunk])

def fetch_idea_from_db(user_id: str, idea_id: str) -> dict:
    """Retrieve the structured part of the idea from memory/db."""
    try:
        idea = memory_get.get_idea(user_id, idea_id) or {}
        return idea.get("structured", {})  # Always return a dict, never None
    except Exception as e:
        print(f"Error fetching idea: {e}")
        return {}

def format_idea_context(idea: dict) -> str:
    """Format the idea dictionary into readable context string."""
    if not idea:
        return "No startup idea found yet."
    structured = idea.get("structured", {}) or {}
    if not structured:
        return "No details available for this idea."
    lines = [f"**{k}**: {v}" for k, v in structured.items()]
    return "\n".join(lines)

# -----------------------------
# Tools implementations
# -----------------------------
def _impl_retrieve_idea(user_id: str, idea_id: str) -> str:
    """Return the full idea as JSON string."""
    try:
        idea = memory_get.get_idea(user_id, idea_id)
        if not idea:
            return "{}"

        # Pick only the required keys safely
        keys = ["structured", "scores", "suggestions", "feedbacks", "chat_history", "timestamp"]
        filtered_idea = {k: idea.get(k) for k in keys}

        # Keep only last 5 chat messages
        if "chat_history" in filtered_idea and filtered_idea["chat_history"]:
            filtered_idea["chat_history"] = filtered_idea["chat_history"][-5:]

        return json.dumps(filtered_idea, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error retrieving idea: {e}"

def _impl_summarize_history(user_id: str, idea_id: str) -> str:
    """Summarize the last 20 chat messages for the idea."""
    try:
        idea = memory_get.get_idea(user_id, idea_id)
        history = idea.get("chat_history", []) if idea else []
        if not history:
            return "No chat history yet."
        lines = []
        for msg in history[-20:]:
            role = msg.get("role", "agent")
            content = msg.get("content", "")
            lines.append(f"{role}: {content}")
        return "Recent conversation:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error summarizing history: {e}"

def _impl_update_idea(user_id: str, idea_id: str, updated_fields: dict, auth_token: str = "") -> str:
    """Update the idea locally and in backend, with error handling."""
    try:
        idea = memory_get.get_idea(user_id, idea_id)
        if not idea:
            return "⚠️ Idea not found."
        current_structured = idea.get("structured", {}) or {}
        current_structured.update(updated_fields)
        memory_update.update_idea(user_id=user_id, idea_id=idea_id, updated_fields=current_structured)

        backend_url = os.getenv("BACKEND_URL")
        if backend_url:
            url = f"{backend_url}/idea/updateidea/{idea_id}"
            headers = {"Content-Type": "application/json"}
            if auth_token:
                headers["Authorization"] = auth_token
            try:
                with httpx.Client(timeout=30) as client:
                    resp = client.put(url, json={"data": updated_fields}, headers=headers)
                    if resp.status_code == 200:
                        return f"✅ Updated both locally and backend. Fields: {json.dumps(updated_fields)}"
                    else:
                        return f"⚠️ Updated locally, backend failed: {resp.message}"
            except Exception as e:
                # return f"⚠️ Updated locally, backend error: {e}"
                return f"✅ Updated locally. Fields: {json.dumps(updated_fields)}"
        return f"✅ Updated locally. Fields: {json.dumps(updated_fields)}"
    except Exception as e:
        return f"Error updating idea: {e}"

def _impl_gather_info(query: str) -> str:
    url = "https://serpapi.com/search.json"
    params = {
        "q": query,
        "api_key": os.getenv("SERP_API_KEY"),
        "num": 3,  # top 3 results
    }
    response = requests.get(url, params=params).json()
    answers = []
    for result in response.get("organic_results", []):
        snippet = result.get("snippet")
        link = result.get("link")
        if snippet:
            answers.append(f"{snippet} (Source: {link})")
    return "\n\n".join(answers) if answers else "No relevant info found."

# -----------------------------
# Tools factory
# -----------------------------
from pydantic import BaseModel
from typing import Optional,Union

class UpdateIdeaInput(BaseModel):
    name: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    team: Optional[str] = None
    business_model: Optional[str] = None
class GatherInfoInput(BaseModel):
    query: str



def build_tools_with_context(llm,user_id: str, idea_id: str, auth_token: str):
    
    def retrieve_idea_tool(_dummy: Optional[str] = None) -> str:
        return _impl_retrieve_idea(user_id, idea_id)

    def summarize_history_tool(_dummy: Optional[str] = None) -> str:
        return _impl_summarize_history(user_id, idea_id)
        
    def update_idea_tool(input: UpdateIdeaInput) -> str:
        """
        Update idea fields. Assumes `input` is always a Pydantic model.
        """
        try:
            # Only include fields that are not None
            updated_fields = {k: v for k, v in input.dict().items() if v is not None}

            if not updated_fields:
                return "No valid fields to update."

            # Call your implementation to update the idea
            return _impl_update_idea(user_id, idea_id, updated_fields, auth_token)

        except Exception as e:
            return f"Error updating idea: {e}"

    def gather_info(input: Union[GatherInfoInput, str]) -> str:
        query = input.query if hasattr(input, "query") else input
        if not query:
            return "Query is required."
        raw_results = _impl_gather_info(query)
        if not raw_results:
            return "No relevant info found."

        prompt = f"Summarize this information clearly for the user:\n{raw_results}"

        # Use invoke with a list of messages
        summary = llm.invoke([HumanMessage(content=prompt)])
        return summary.content
    return [
        Tool(
            name="retrieve_idea", 
            description="Get the current startup idea.", 
            func=retrieve_idea_tool,
            args_schema=None,
            return_direct=True
        ),
        Tool(
            name="summarize_history", 
            description="Summarize recent chat history.", 
            func=summarize_history_tool,
            args_schema=None,
            return_direct=True
        ),
        Tool(
            name="update_idea",
            description="Update idea fields after user confirmation. input should be a Pydantic model.",
            func=update_idea_tool,
            args_schema=UpdateIdeaInput
        ),
        Tool(
            name="gather_info",
            description="Gather relevant information from the web.",
            func=gather_info,
            args_schema=GatherInfoInput
        )
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
       "target_market": "Early-stage professionals"
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
- When calling update_idea, always pass fields as plain strings (not arrays). If there are multiple values, combine them into a single comma-separated string
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
def build_agent_executor(llm,user_id: str, idea_id: str, auth_token: str) -> AgentExecutor:
    """Builds and returns an AgentExecutor for the user/idea context."""
    try:
        tools = build_tools_with_context(llm,user_id, idea_id, auth_token)
        idea_structured = fetch_idea_from_db(user_id, idea_id)
        idea_context = format_idea_context({"structured": idea_structured})

        system_prompt_safe = SYSTEM_PROMPT.replace("{", "{{").replace("}", "}}")
        system_prompt_safe = system_prompt_safe.replace("{{idea_context}}", "{idea_context}")
        system_prompt_safe = system_prompt_safe.replace('{{ name", "problem_statement", "solution", "target_market", "team", "business_model" }}', '{ name", "problem_statement", "solution", "target_market", "team", "business_model" }')
        system_prompt_with_context = system_prompt_safe.format(idea_context=idea_context)

        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt_with_context),
            MessagesPlaceholder("chat_history"),
            HumanMessagePromptTemplate.from_template("{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])

        history = ChatMessageHistory()
        agent_memory = ConversationBufferMemory(
            chat_memory=history,
            memory_key="chat_history",
            return_messages=True,
            output_key="output"
        )

        agent = create_openai_functions_agent(
            llm=llm,
            tools=tools,
            prompt=prompt,
        )

        return AgentExecutor(agent=agent, tools=tools, memory=agent_memory, verbose=True)
    except Exception as e:
        print(f"Error building agent executor: {e}")
        raise

# -----------------------------
# WebSocket endpoint
# -----------------------------
# OpenAI → https://api.openai.com/v1

# Groq → https://api.groq.com/openai/v1

# Together AI → https://api.together.xyz/v1

# Fireworks AI → https://api.fireworks.ai/inference/v1

# Mistral → https://api.mistral.ai/v1

# Anyscale Endpoints → https://api.endpoints.anyscale.com/v1
@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    persistent_agents: dict[str, AgentExecutor] = {}
    memory_activity = {}
    pending_updates: dict[str, dict] = {}  # key: user_idea, value: update dict

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
            api = data.get("api")
            # print(api_key_data, enc_key)
            # api = decrypt_api_key(enc_key or os.getenv("OPENAI_API_KEY"))
            if not all([user_id, idea_id, message, api]):
                await websocket.send_json({"error": "user_id, idea_id,api_key and message required"})
                continue
            llm = ChatOpenAI(
                model=api["model_name"], 
                temperature=api["temperature"],
                openai_api_key=decryptor.decrypt_api_key(api["apikey"] or os.getenv("OPENAI_API_KEY")),
                openai_api_base=api["provider_url"],
            )
            key = f"{user_id}_{idea_id}"
            if key not in persistent_agents:
                persistent_agents[key] = build_agent_executor(llm,user_id, idea_id, auth_token)
            agent_executor = persistent_agents[key]
            memory_activity[key] = {"last_active": datetime.utcnow()}

            # Confirmation/update flow
            if message.strip().lower() in ["yes", "y", "confirm", "okay", "ok"] and key in pending_updates:
                # Apply pending update
                update_fields = pending_updates.pop(key)
                # Call update tool directly
                # UpdateIdeaInput is already defined above; no import needed
                # Use the update tool from agent_executor.tools
                update_tool = None
                for t in agent_executor.tools:
                    if t.name == "update_idea":
                        update_tool = t
                        break
                if update_tool:
                    try:
                        # Use pydantic model for validation
                        update_input = UpdateIdeaInput(**update_fields)
                        update_result = update_tool.func(update_input)
                        final_response = str(update_result)
                    except Exception as e:
                        final_response = f"❌ Update error: {e}"
                else:
                    final_response = "❌ Update tool not found."
                # Streaming
                for chunk in chunk_text_by_words(final_response, STREAM_CHUNK_WORDS):
                    await websocket.send_json({"response": chunk, "type": "stream"})
                    await asyncio.sleep(STREAM_CHUNK_DELAY)
                await websocket.send_json({"response": final_response, "type": "final"})
                # Save to memory
                memory_update.update_idea(
                    user_id=user_id,
                    idea_id=idea_id,
                    append_chat=[
                        {"role": "user", "content": message, "timestamp": datetime.utcnow().isoformat()},
                        {"role": "agent", "content": final_response, "timestamp": datetime.utcnow().isoformat()},
                    ],
                )
                continue

            # Otherwise, normal agent flow
            try:
                result = await agent_executor.ainvoke({"input": message})
                if isinstance(result, dict) and "output" in result:
                    final_response = result["output"].strip()
                else:
                    final_response = str(result).strip()
                print("---- Agent raw result ----")
                print(result)
                print("---- Final response ----")
                print(result.get("output", ""))

                # Detect if agent is asking for confirmation and output contains JSON update
                import re, json
                json_match = re.search(r'```json\s*({[\s\S]*?})\s*```', final_response)
                if json_match:
                    try:
                        update_dict = json.loads(json_match.group(1))
                        pending_updates[key] = update_dict
                    except Exception:
                        pass
                else:
                    # Fallback: try to extract field and value from confirmation message
                    # Example: "I understood that you want to update the **team** to 'new designer'. Should I go ahead and update this?"
                    # Improved regex: capture up to period, question mark, or end of string
                    field_match = re.search(r'update the \*\*(\w+)\*\* to ["\']?([^"\'\n\r\?\.]+)', final_response)
                    if field_match:
                        field = field_match.group(1)
                        value = field_match.group(2).strip()
                        if field in ["name", "problem_statement", "solution", "target_market", "team", "business_model"]:
                            pending_updates[key] = {field: value}
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
            memory_update.update_idea(
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