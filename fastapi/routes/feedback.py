#feedback api
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from memory.memory_store import MemoryUpdate
from chains.feedback import FeedbackAgent# or use RunnableChain
# from langchain_core.messages import HumanMessage
import json

router = APIRouter()
Memory_Update=MemoryUpdate()



class ImproveRequest(BaseModel):
    user_id: str
    idea_id: str
    scores: dict
    data: dict 
    api: dict  # This should match the structure of your stored ideas

@router.post("/feedback")
def getfeedback(req: ImproveRequest):
    try:
        Feedback_Agent=FeedbackAgent(req.api)
        if not req.data or not req.scores:
            return {"success": False, "error": "Missing data or scores"}

        feedback = Feedback_Agent.feedback_idea(req.data, req.scores)
        uf=Memory_Update.update_feedback(req.user_id, req.idea_id, feedback)
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
