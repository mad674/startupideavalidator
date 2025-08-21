from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory.memory_store import MemoryStore
from agents.feedback import feedback_idea # or use RunnableChain
# from langchain_core.messages import HumanMessage
import json

router = APIRouter()
memory = MemoryStore()

class ImproveRequest(BaseModel):
    user_id: str
    idea_id: str
    scores: dict
    data: dict  # This should match the structure of your stored ideas

@router.post("/feedback")
def getfeedback(req: ImproveRequest):
    try:
        if not req.data or not req.scores:
            return {"success": False, "error": "Missing data or scores"}

        feedback = feedback_idea(req.data, req.scores)
        uf=memory.update_feedback(req.user_id, req.idea_id, feedback)
        if(uf==False):
            return {"success": False, "error": "Error in updating feedback in MemoryStore"}
        return {
            "success": True,
            "feedback": json.loads(feedback),  # Convert feedback
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
        # raise HTTPException(status_code=500, detail=str(e))
