from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
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
    api:dict



@router.post("/getscore")
def getscore(req: ValidateRequest):
    try:
        # Compute score
        scores = score_idea(req.api, req.data)
        # Store in memory (returns False if duplicate)
        res = memory.store_idea(
            req.user_id,
            req.idea_id,
            req.data,
            req.data["name"],
            scores,
        )

        if not res:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "response": "Error in storing idea, idea already exists!"
                }
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "scores": json.loads(scores)
            }
        )

    except Exception as e:
        # Catch **all exceptions** and return JSON
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

