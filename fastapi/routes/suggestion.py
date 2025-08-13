from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from memory.memory_store import MemoryStore
from agents.suggester import suggest_improvements
import json

router = APIRouter()
memory = MemoryStore()

class SuggestionRequest(BaseModel):
    user_id: str
    idea_id: str
    data: dict  
    scores: dict

@router.post("/suggestions")
def getsuggestions(request: SuggestionRequest):
    try:
        if not request.data or not request.scores:
            return {"success": False, "error": "Missing data or scores"}
        suggestions=suggest_improvements(request.data, request.scores)
        memory.update_suggestions(request.user_id, request.idea_id, suggestions)
        return {
            "success": True,
            "suggestions": json.loads(suggestions) # Convert suggestions
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
        # raise HTTPException(status_code=500, detail=str(e))
