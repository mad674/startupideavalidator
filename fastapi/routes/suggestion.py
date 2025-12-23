from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from memory.memory_store import MemoryUpdate
from agents.suggester import SuggesterAgent
import json

router = APIRouter()
Memory_Update = MemoryUpdate()


class SuggestionRequest(BaseModel):
    user_id: str
    idea_id: str
    data: dict  
    scores: dict
    api: dict

@router.post("/suggestions")
def getsuggestions(request: SuggestionRequest):
    try:
        Suggester_agent = SuggesterAgent(request.api)
        if not request.data or not request.api or not request.scores:
            return {"success": False, "error": "Missing data or scores"}
        suggestions=Suggester_agent.suggest_improvements(request.data, request.scores)
        us=Memory_Update.update_suggestions(request.user_id, request.idea_id, suggestions)
        # print("suggestions result:", suggestions)
        if(us==False):
            return {"success": False, "error": "Error in updating suggestions in MemoryStore"}
        return {
            "success": True,
            "suggestions": json.loads(suggestions) # Convert suggestions
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
        # raise HTTPException(status_code=500, detail=str(e))
