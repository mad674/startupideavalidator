from fastapi import APIRouter
from pydantic import BaseModel
from memory.memory_store import MemoryStore

router = APIRouter()
store = MemoryStore()


class DeleteRequest(BaseModel):
    user_id: str
    idea_id: str


class DeleteAllRequest(BaseModel):
    user_id: str


# Delete a single idea
@router.post("/delete-idea")
def delete_single_idea(request: DeleteRequest):
    success = store.delete_idea(request.user_id, request.idea_id)
    if success:
        return {"success": True, "message": f"Idea {request.idea_id} deleted successfully"}
    else:
        return {"success": False, "message": f"Idea {request.idea_id} not found for user {request.user_id}"}


# Delete all ideas for a user
@router.post("/delete-all-ideas")
def delete_all_ideas(req: DeleteAllRequest):
    user_ideas = store.get_ideas(req.user_id) or {}
    
    for idea_id in list(user_ideas.keys()):
        store.delete_idea(req.user_id, idea_id)

    return {"success": True, "message": f"All ideas for user {req.user_id} deleted successfully"}
