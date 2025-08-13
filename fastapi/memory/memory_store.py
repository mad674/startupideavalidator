import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from datetime import datetime
import json

class MemoryStore:
    def __init__(self):
        self.client = chromadb.Client(Settings(anonymized_telemetry=False))
        self.collection = self.client.get_or_create_collection("startup_ideas")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def store_idea(self, user_id, idea_id, idea_text, idea_name, scores):
        """
        Stores a new idea in the vector DB.
        idea_text = dict with problem_statement, solution, target_market, business_model
        """
        # print("\n[DEBUG][store_idea]")
        # print(f"User ID: {user_id}")
        # print(f"Idea ID: {idea_id}")
        # # print(f"Data Keys: {list(data.keys())}")
        # print(f"Scores: {scores}")
        try:
            combined_text = (
                f"Name: {idea_name}\n"
                f"Problem: {idea_text['problem_statement']}\n"
                f"Solution: {idea_text['solution']}\n"
                f"Target Market: {idea_text['target_market']}\n"
                f"Business Model: {idea_text['business_model']}\n"
                f"Team: {idea_text['team']}"
            )

            # Avoid duplicates for the same user
            results = self.collection.get(where={"user_id": user_id}, include=["documents", "metadatas"])
            if not results["metadatas"]:   # ✅ Prevent index error
                pass  # no existing ideas, continue to add

            else:
                doc = results["metadatas"][-1]
                if doc['name'] == idea_name and json.loads(doc['structured']) == idea_text:
                    return False  # already exists
            embedding = self.embedder.encode(combined_text).tolist()

            self.collection.add(
                ids=[idea_id],
                embeddings=[embedding],
                documents=[combined_text],
                metadatas=[{
                    "user_id": user_id,
                    "name": idea_name,
                    "scores": scores,
                    "structured": json.dumps(idea_text),       # ✅ store full structured data
                    "feedback": "",               # ✅ initialize empty feedback
                    "suggestions": "",            # ✅ initialize empty suggestions
                    "timestamp": datetime.now().isoformat()
                }]
            )
            return True
        except Exception as e:
            print("Error in store_idea:", e)
            return False

    def get_last_idea(self, user_id):
        results = self.collection.get(where={"user_id": user_id}, limit=1)
        if results["documents"]:
            meta = results["metadatas"][0]
            return {
                "idea": results["documents"][0],
                "structured": json.loads(meta.get("structured", {})),
                "scores": meta.get("scores", ""),
                "feedback": meta.get("feedback", ""),
                "suggestions": meta.get("suggestions", ""),
            }
        return None

    def get_all_ideas(self, user_id):
        results = self.collection.get(where={"user_id": user_id})
        ideas = []
        for doc, meta, idea_id in zip(results["documents"], results["metadatas"], results["ids"]):
            ideas.append({
                "idea_id": idea_id,
                "idea": doc,
                "structured": json.loads(meta.get("structured", {})),
                "scores": meta.get("scores", ""),
                "feedback": meta.get("feedback", ""),
                "suggestions": meta.get("suggestions", ""),
                "timestamp": meta["timestamp"]
            })
        return sorted(ideas, key=lambda x: x["timestamp"], reverse=True)

    def search_similar_idea(self, user_id, query, top_k=1):
        embedding = self.embedder.encode(query)
        results = self.collection.query(
            query_embeddings=[embedding.tolist()],
            n_results=top_k,
            where={"user_id": user_id}
        )
        if results and results["documents"]:
            return results["documents"][0][0]
        return None

    def delete_idea(self, user_id, idea_id):
        results = self.collection.get(ids=[idea_id], where={"user_id": user_id})
        if results["documents"]:
            self.collection.delete(ids=[idea_id])
            return True
        return False

    def update_idea(self, user_id, idea_id, new_data):
        results = self.collection.get(ids=[idea_id], where={"user_id": user_id})
        if results["documents"]:
            existing_doc = results["documents"][0]
            existing_meta = results["metadatas"][0]

            updated_doc = existing_doc + "\n" + new_data
            updated_embedding = self.embedder.encode(updated_doc).tolist()

            self.collection.update(
                ids=[idea_id],
                embeddings=[updated_embedding],
                documents=[updated_doc],
                metadatas=[{
                    **existing_meta,
                    "timestamp": datetime.now().isoformat()
                }]
            )
            return True
        return False

    
    def update_suggestions(self, user_id, idea_id, new_suggestions):
        # Normalize new suggestions
        if isinstance(new_suggestions, list):
            new_suggestions = "\n".join([str(x) for x in new_suggestions])
        else:
            new_suggestions = str(new_suggestions)

        results = self.collection.get(ids=[idea_id], where={"user_id": user_id})

        # ✅ Check if we got valid results
        if not results or not results.get("documents") or len(results["documents"]) == 0:
            return False  # Idea not found in DB

        existing_meta = results["metadatas"][0] or {}
        old_suggestions = str(existing_meta.get("suggestions", ""))

        updated_suggestions = (old_suggestions + "\n" + new_suggestions).strip()

        self.collection.update(
            ids=[idea_id],
            embeddings=[results.get("embeddings", [None])[0]],
            documents=[results["documents"][0]],
            metadatas=[{
                **existing_meta,
                "suggestions": updated_suggestions,
                "timestamp": datetime.now().isoformat()
            }]
        )
        return True

    def update_feedback(self, user_id, idea_id, new_feedback):
        """
        Update or append feedback for a specific idea.
        new_feedback: list of paragraph strings or structured dicts
        """
        if isinstance(new_feedback, list):
            new_feedback = "\n".join([str(x) for x in new_feedback])
        else:
            new_feedback = str(new_feedback)
        results = self.collection.get(ids=[idea_id], where={"user_id": user_id})
        
        if not results or not results.get("documents") or len(results["documents"]) == 0:
            return False  # Idea not found in DB

        existing_meta = results["metadatas"][0] or {}
        old_feedback = str(existing_meta.get("feedback", ""))
        updated_feedback = (old_feedback + "\n" + new_feedback).strip()
        self.collection.update(
            ids=[idea_id],
            embeddings=[results["embeddings"][0]],
            documents=[results["documents"][0]],
            metadatas=[{
                **existing_meta,
                "feedback": updated_feedback,
                "timestamp": datetime.now().isoformat()
            }]
        )
        return True
    # return False

