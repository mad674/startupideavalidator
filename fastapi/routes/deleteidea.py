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

@router.post("/delete-idea")
def delete_idea(req: DeleteRequest):
    success = store.delete_idea(req.user_id, req.idea_id)
    if success:
        return {"success": True, "message": f"Idea {req.idea_id} deleted from ChromaDB"}
    return {"success": False, "message": "Idea not found in ChromaDB"}

@router.post("/delete-all-ideas")
def delete_all_ideas(req: DeleteAllRequest):
    results = store.collection.get(where={"user_id": req.user_id})
    # if not results["ids"]:
    #     return {"success": False, "message": "No ideas found for this user"}

    for idea_id in results["ids"]:
        store.delete_idea(req.user_id, idea_id)

    return {"success": True, "message": f"All ideas for user {req.user_id} deleted from ChromaDB"}
