from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# from agents.clarifier import clarifier_chain
from agents.scorer import scorer_chain
from agents.suggester import suggester_chain
from agents.validator import validator_chain
from agents.feedback import feedback_chain
from memory.memory_store import MemoryStore

memory = MemoryStore()
router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    message: str


@router.post("/chatbot")
def chatbot_interact(request: ChatRequest):
    try:
        user_id = request.user_id
        user_input = request.message.strip().lower()

        # 🔁 If user asks to recall last idea
        if user_input in ["last", "previous", "what did i submit", "yesterday", "improve my last idea"]:
            last_idea = memory.get_last_idea(user_id)
            if not last_idea:
                return {"response": "❌ No previous ideas found for this user."}

            clarified = last_idea["structured"]
            scores = last_idea["scores"]
            suggestions = suggester_chain.invoke({
                "structured_idea": clarified,
                "scores": scores
            }).content

            return {
                "idea": last_idea["idea"],
                "structured": clarified,
                "scores": scores,
                "suggestions": suggestions,
                "message": "🔁 Re-improved your previous idea."
            }

        # 💬 Feedback-style questions
        if user_input.startswith("how can i") or user_input.startswith("what if"):
            return {"response": feedback_chain.invoke({"feedback": user_input}).content}

        # ✅ Check if it’s a valid startup idea
        validation = validator_chain.invoke({"input": user_input}).content.strip().lower()
        if "yes" not in validation:
            return {
                "response": "❌ That doesn't seem like a startup idea. Please try again with a business or product idea."
            }

        # 🧠 Main processing pipeline
        clarified = clarifier_chain.invoke({"idea": user_input}).content
        scores = scorer_chain.invoke({"structured_idea": clarified}).content
        suggestions = suggester_chain.invoke({
            "structured_idea": clarified,
            "scores": scores
        }).content

        # 💾 Save to memory
        memory.save(user_id, user_input, clarified, scores, suggestions)

        return {
            "idea": user_input,
            "structured": clarified,
            "scores": scores,
            "suggestions": suggestions,
            "message": "✅ Startup idea evaluated successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
