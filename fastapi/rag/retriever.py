# retriever.py

from rag.embeddings import Embeddings
from rag.qdrant_store import QdrantStore


class Retriever:

    def __init__(self):

        self.embedder = Embeddings()

        self.qdrant_store = QdrantStore()

    # -----------------------------------
    # Retrieve Documents
    # -----------------------------------

    def retrieve_documents(
        self,
        query: str,
        limit: int = 5,
        user_id: str = None
    ):

        # Create query embedding
        embedding = self.embedder.create_embedding(query)

        # Search Qdrant
        results = self.qdrant_store.search(
            query_vector=embedding,
            limit=limit,
            user_id=user_id
        )

        # Format results
        documents = []

        for result in results:

            payload = result.get("payload", {})

            documents.append({
                "text": payload.get("text", ""),
                "metadata": payload,
                "score": result.get("score", 0)
            })

        return documents