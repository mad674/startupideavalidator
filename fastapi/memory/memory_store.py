import os
import json
from datetime import datetime
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
import json 
# ------------------ Load Environment Variables ------------------
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east1-gcp")
INDEX_NAME = "startup"
MAX_METADATA_SIZE = 40000  # 40 KB limit
MAX_CHAT_HISTORY = 50       # Keep last 50 messages
MAX_FIELD_LENGTH = 2000     # 2 KB limit
# ------------------ MemoryStore Class ------------------
def safe_json_load(data, default=None):
    if not data:  # None or empty string
        return default if default is not None else {}
    if isinstance(data, str):
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return default if default is not None else {}
    return data  # already dict or list

class Memory:
    def __init__(self):
        self.client = Pinecone(api_key=PINECONE_API_KEY)
        
        # Create index if it doesn't exist
        if INDEX_NAME not in self.client.list_indexes().names():
            self.client.create_index(
                name=INDEX_NAME,
                dimension=384,
                metric="cosine",
                spec=ServerlessSpec(cloud="gcp", region=PINECONE_ENV)
            )

        self.index = self.client.Index(INDEX_NAME)
        self.store = {}  # In-memory store
        model_path ="all-MiniLM-L6-v2"# os.path.join(os.path.dirname(__file__), "models", "all-MiniLM-L6-v2")
        self.embedder = SentenceTransformer(model_path)
    
class MemoryUtils(Memory):
    def __init__(self):
        super().__init__()    
    # Serialize metadata (dict/list -> JSON)
    def _serialize_metadata(self, meta_dict):
        serialized = {}
        for k, v in meta_dict.items():
            if isinstance(v, (dict, list)):
                serialized[k] = json.dumps(v)
            else:
                serialized[k] = v
        return serialized
    def _truncate_metadata(self, metadata):
    # import json
        MAX_SIZE = 40000  # leave some buffer
        serialized = json.dumps(metadata)
        if len(serialized.encode("utf-8")) > MAX_SIZE:
            # Simple truncation: remove chat history first
            metadata["chat_history"] = []
            serialized = json.dumps(metadata)
            if len(serialized.encode("utf-8")) > MAX_SIZE:
                # truncate other fields if necessary
                metadata["structured"] = {"problem_statement": metadata["structured"].get("problem_statement","")}
        return metadata

    def _update_metadata(self, idea_id, update_fn):
        try:
            result = self.index.fetch(ids=[idea_id])
            if idea_id not in result.vectors:
                return False
            vec = result.vectors[idea_id]
            meta = vec.metadata
            update_fn(meta)
            meta["timestamp"] = datetime.now().isoformat()

            self.index.upsert(
                vectors=[{"id": idea_id, "values": vec.values, "metadata": meta}]
            )
            return True
        except Exception as e:
            print(f"[ERROR] _update_metadata failed: {e}")
            return False

    # Deserialize metadata
    def _deserialize_metadata(self, meta_dict):
        deserialized = {}
        for k, v in meta_dict.items():
            try:
                deserialized[k] = json.loads(v)
            except:
                deserialized[k] = v
        return deserialized

class MemoryStore(Memory):
    def __init__(self):
        super().__init__()
    # ------------------ Store a new idea ------------------
    def store_idea(self, user_id, idea_id, idea_text, idea_name, scores,
               feedbacks=None, suggestions=None, chat_history=None):
        try:
            oldidea = self.get_idea(user_id, idea_id) or {}

            # Skip storing if structured idea hasn't changed
            if json.dumps(oldidea.get("structured", {}), sort_keys=True) == json.dumps(idea_text, sort_keys=True):
                return False
            scores = safe_json_load(scores, default={})
            feedbacks = safe_json_load(feedbacks, default={})
            suggestions = safe_json_load(suggestions, default={})
            # Preserve old data, but ensure safe defaults
            feedbacks = oldidea.get("feedbacks") or {}
            suggestions = oldidea.get("suggestions") or {}
            chat_history = oldidea.get("chat_history") or []

            combined_text = (
                f"Name: {idea_name}\n"
                f"Problem: {idea_text.get('problem_statement','')}\n"
                f"Solution: {idea_text.get('solution','')}\n"
                f"Target Market: {idea_text.get('target_market','')}\n"
                f"Business Model: {idea_text.get('business_model','')}\n"
                f"Team: {idea_text.get('team','')}"
            )
            embedding = self.embedder.encode(combined_text).tolist()

            metadata = self._serialize_metadata({
                "user_id": user_id,
                "name": idea_name,
                "structured": json.dumps(idea_text),
                "scores": json.dumps(scores),
                "feedbacks": json.dumps(feedbacks),
                "suggestions": json.dumps(suggestions),
                "chat_history": json.dumps(chat_history),
                "timestamp": datetime.now().isoformat(),
                "document": combined_text
            })
            metadata = self._truncate_metadata(metadata) or {}

            self.index.upsert(
                vectors=[{"id": idea_id, "values": embedding, "metadata": metadata}]
            )
            return True

        except Exception as e:
            print(f"[ERROR] store_idea failed: {e}")
            return False

class MemoryGet(Memory):
    def __init__(self):
        super().__init__()
    # ------------------ Get all ideas for a user ------------------
    def get_all_ideas(self, user_id):
        try:
            dummy_vector = [0.0] * 384
            result = self.index.query(
                vector=dummy_vector,
                top_k=1000,
                include_metadata=True
            )
            ideas = []
            for match in result.matches:
                meta = match.metadata or {}  # ✅ Ensure it's a dict
                meta = self._deserialize_metadata(meta)
                if meta.get("user_id") != user_id:
                    continue
                ideas.append({
                    "idea_id": match.id,
                    "idea": meta.get("document", ""),
                    "structured": meta.get("structured", {}),
                    "scores": meta.get("scores", {}),
                    "feedbacks": meta.get("feedbacks", []),
                    "suggestions": meta.get("suggestions", []),
                    "chat_history": meta.get("chat_history", []),
                    "timestamp": meta.get("timestamp", "")
                })
            return sorted(ideas, key=lambda x: x["timestamp"], reverse=True)
        except Exception as e:
            print(f"[ERROR] get_all_ideas failed: {e}")
            return []

    def get_idea(self, user_id, idea_id):
        try:
            # First try local store
            if user_id in self.store and idea_id in self.store[user_id]:
                return self.store[user_id][idea_id]

            # Otherwise fetch from Pinecone
            res = self.index.fetch(ids=[idea_id])   # ✅ correct usage
            vector = res.vectors.get(idea_id, None) # ✅ FetchResponse.vectors is a dict
            if not vector:
                return None

            metadata = vector.metadata

            # ✅ Always parse JSON safely
            def parse_json_safe(val, default):
                if isinstance(val, str):
                    try:
                        return json.loads(val)
                    except Exception:
                        return default
                return val if val is not None else default

            structured   = parse_json_safe(metadata.get("structured"), {})
            chat_history = parse_json_safe(metadata.get("chat_history"), [])
            scores       = parse_json_safe(metadata.get("scores"), {})
            feedbacks    = parse_json_safe(metadata.get("feedbacks"), {})
            suggestions  = parse_json_safe(metadata.get("suggestions"), {})

            idea = {
                "idea_id": idea_id,
                "user_id": user_id,
                "structured": structured,
                "chat_history": chat_history,   # ✅ Always a list now
                "scores": scores,
                "feedbacks": feedbacks,
                "suggestions": suggestions,
                "timestamp": metadata.get("timestamp", ""),
                "embedding": vector.values
            }

            # Cache locally for faster access later
            if user_id not in self.store:
                self.store[user_id] = {}
            self.store[user_id][idea_id] = idea

            return idea

        except Exception as e:
            print(f"[ERROR] get_idea failed: {e}")
            return None

    def get_ideas(self, user_id):
        """
        Return all ideas for a user as a dict {idea_id: idea_data}.
        Fetches from local cache first, otherwise from the index.
        """
        # Return from local cache if available
        if user_id in self.store:
            return self.store[user_id]

        # Fetch all vectors for this user from the index
        try:
            # Chroma/Pinecone: use a metadata filter
            res = self.index.query(
                filter={"user_id": user_id},
                include_metadata=True,
                include_values=False  # don't fetch embeddings if not needed
            )

            ideas = {}
            for vector in res['matches']:  # Chroma returns matches
                idea_id = vector['id']
                metadata = vector['metadata']

                # Parse structured fields safely
                idea = {
                    "idea_id": idea_id,
                    "user_id": user_id,
                    "structured": metadata.get("structured", {}),
                    "chat_history": metadata.get("chat_history", []),
                    "scores": metadata.get("scores", {}),
                    "feedbacks": metadata.get("feedbacks", []),
                    "suggestions": metadata.get("suggestions", []),
                    "timestamp": metadata.get("timestamp", ""),
                    "embedding": None  # optional, fetch separately if needed
                }

                # Cache locally
                if user_id not in self.store:
                    self.store[user_id] = {}
                self.store[user_id][idea_id] = idea

                ideas[idea_id] = idea

            return ideas
        except Exception as e:
            print(f"[ERROR] get_ideas failed: {e}")
            return {}

class MemoryUpdate(Memory):
    def __init__(self):
        super().__init__()
    # ------------------ Update feedback ------------------
    def update_feedback(self, user_id, idea_id, feedback):
        try:
            result = self.index.fetch(ids=[idea_id])
            if idea_id not in result.vectors:
                return False
            vec = result.vectors[idea_id]
            meta = vec.metadata

            meta["feedbacks"] = json.dumps(feedback)
            meta["timestamp"] = datetime.now().isoformat()

            self.index.upsert(
                vectors=[{"id": idea_id, "values": vec.values, "metadata": meta}]
            )
            return True
        except Exception as e:
            print(f"[ERROR] update_feedback failed: {e}")
            return False
    # ------------------ Update suggestions ------------------
    def update_suggestions(self, user_id, idea_id, suggestions):
        try:
            result = self.index.fetch(ids=[idea_id])
            if idea_id not in result.vectors:
                return False
            vec = result.vectors[idea_id]
            meta = vec.metadata

            meta["suggestions"] = json.dumps(suggestions)
            meta["timestamp"] = datetime.now().isoformat()

            self.index.upsert(
                vectors=[{"id": idea_id, "values": vec.values, "metadata": meta}]
            )
            return True
        except Exception as e:
            print(f"[ERROR] update_suggestions failed: {e}")
            return False
        # ------------------ Update scores ------------------
    def update_scores(self, user_id, idea_id, scores):
        return self._update_metadata(
            idea_id,
            lambda m: m.update({"scores": json.dumps(scores)})
        )

    def update_idea(self, user_id, idea_id, updated_fields=None, append_chat=None):
        
        try:
            # Fetch idea (from local cache or Pinecone)
            idea = self.get_idea(user_id, idea_id)
            if idea is None:
                return False

            # ✅ Merge structured fields safely
            structured = idea.get("structured", {})
            if isinstance(structured, str):
                structured = json.loads(structured)
            if updated_fields is not None:
                structured.update(updated_fields)  # merge instead of replace

            # ✅ Ensure chat_history is a list
            chat_history = idea.get("chat_history", [])
            if isinstance(chat_history, str):
                chat_history = json.loads(chat_history)

            # ✅ Append new chat messages
            if append_chat is not None:
                chat_history.extend(append_chat)
                chat_history = chat_history[-MAX_CHAT_HISTORY:]  # keep recent N

            # ✅ Rebuild updated idea
            combined_text = (
                f"Name: {structured.get('name','')}\n"
                f"Problem: {structured.get('problem_statement','')}\n"
                f"Solution: {structured.get('solution','')}\n"
                f"Target Market: {structured.get('target_market','')}\n"
                f"Business Model: {structured.get('business_model','')}\n"
                f"Team: {structured.get('team','')}\n"
                f"Chat History: {' '.join([msg.get('content','') for msg in chat_history])}"
            )

            embedding = self.embedder.encode(combined_text).tolist()

            updated_idea = {
                "idea_id": idea_id,
                "user_id": user_id,
                "structured": structured,
                "chat_history": chat_history,
                "scores": idea.get("scores", {}),
                "feedbacks": idea.get("feedbacks", {}),
                "suggestions": idea.get("suggestions", {}),
                "timestamp": datetime.now().isoformat(),
                "embedding": embedding
            }

            # ✅ Update local store
            if user_id not in self.store:
                self.store[user_id] = {}
            self.store[user_id][idea_id] = updated_idea

            # ✅ Serialize metadata for Pinecone
            metadata = {
                "user_id": user_id,
                "structured": json.dumps(structured),
                "chat_history": json.dumps(chat_history),
                "scores": json.dumps(updated_idea["scores"]),
                "feedbacks": json.dumps(updated_idea["feedbacks"]),
                "suggestions": json.dumps(updated_idea["suggestions"]),
                "timestamp": updated_idea["timestamp"],
                "document": combined_text
            }

            metadata = self._truncate_metadata(metadata) or {}

            # ✅ Push to Pinecone
            self.index.upsert([
                {
                    "id": idea_id,
                    "values": embedding,
                    "metadata": metadata
                }
            ])

            return True
        except Exception as e:
            print(f"[ERROR] update_idea failed: {e}")
            return False

class MemoryDelete(Memory):
    def __init__(self):
        super().__init__()
    # ------------------ Delete an idea ------------------
    def delete_idea(self, user_id, idea_id):
        try:
            self.index.delete(ids=[idea_id])
            if user_id in self.store and idea_id in self.store[user_id]:
                del self.store[user_id][idea_id]
                if not self.store[user_id]:
                    del self.store[user_id]

            return True
        except Exception as e:
            print(f"[ERROR] delete_idea failed: {e}")
            return False

        try:
            self.index.delete(ids=[idea_id])
            if user_id in self.store and idea_id in self.store[user_id]:
                del self.store[user_id][idea_id]
                if not self.store[user_id]:
                    del self.store[user_id]

            return True
        except Exception as e:
            print(f"[ERROR] delete_idea failed: {e}")
            return False