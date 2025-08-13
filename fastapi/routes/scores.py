from fastapi import APIRouter, Request
from pydantic import BaseModel
# from agents.clarifier import clarify_idea
from agents.scorer import score_idea
# from agents.suggester import suggest_improvements
# from agents.validator import validate_idea
from memory.memory_store import MemoryStore
import json
router = APIRouter()
memory = MemoryStore()

class ValidateRequest(BaseModel):
    user_id:str
    idea_id:str
    data:dict

@router.post("/getscore")
def getscore(req: ValidateRequest):
    # data={
    #     "name": request.name if request.name else "No Idea Provided",
    #     "problem_statement": request.problem_statement if request.problem_statement else "No Problem Statement Provided",
    #     "solution": request.solution if request.solution else "No Solution Provided",
    #     "target_market": request.target_market if request.target_market else "No Target Market Provided",
    #     "business_model": request.business_model if request.business_model else "No Business Model Provided",
    #     "team": request.team   if request.team else "No Team Provided",
    # }
    scores = score_idea(req.data)
    # suggestions = suggest_improvements(data, scores)
    res=memory.store_idea(
        req.user_id,
        req.idea_id,
        req.data,
        req.data["name"],
        scores,
        # suggestions
    )
    if(res==False):
        return {
            "success": False,
            "response": "Error in storing idea , idea already exists!"
        }
    return {
        "success": True,
        # "response": "✅ That looks like a startup idea!",
        # "res":validate_idea(data),
        # "idea_id": idea_id,
        # "structured": data,
        "scores": json.loads(scores),
        # "suggestions": json.loads(suggestions)
    }

