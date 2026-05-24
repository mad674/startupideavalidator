# hybrid_search.py

from rag.embeddings import Embeddings
from rag.qdrant_store import QdrantStore
from rag.bm25_store import BM25Store
from rag.reranker import Reranker


class HybridSearch:

    def __init__(self):

        # Initialize services
        self.embedder = Embeddings()

        self.qdrant_store = QdrantStore()

        self.bm25_store = BM25Store()

        self.reranker = Reranker()

    # -----------------------------------
    # Hybrid Search
    # -----------------------------------

    def search(
        self,
        query: str,
        user_id: str = None,
        idea_id: str = None,
        top_k: int = 5
    ):

        # -----------------------------------
        # Generate Query Embedding
        # -----------------------------------

        query_embedding = self.embedder.create_embedding(query)

        # -----------------------------------
        # Semantic Search (Qdrant)
        # -----------------------------------

        semantic_results = self.qdrant_store.search(
            query_vector=query_embedding,
            limit=top_k,
            user_id=user_id,
            idea_id=idea_id
        )

        semantic_chunks = []

        for result in semantic_results:

            payload = result.get("payload", {})

            text = payload.get("text", "")

            if text:

                semantic_chunks.append({
                    "text": text,
                    "metadata": payload,
                    "score": result.get("score", 0),
                    "source": "semantic"
                })

        # -----------------------------------
        # BM25 Search
        # -----------------------------------

        bm25_results = self.bm25_store.search(
            query=query,
            top_k=top_k
        )

        bm25_chunks = []

        for chunk in bm25_results:

            # If BM25 returns dict
            if isinstance(chunk, dict):

                bm25_chunks.append({
                    "text": chunk.get("text", ""),
                    "metadata": chunk.get("metadata", {}),
                    "score": chunk.get("score", 0),
                    "source": "bm25"
                })

            # If BM25 returns plain text
            else:

                bm25_chunks.append({
                    "text": str(chunk),
                    "metadata": {},
                    "score": 0,
                    "source": "bm25"
                })

        # -----------------------------------
        # Merge Results
        # -----------------------------------

        combined = semantic_chunks + bm25_chunks

        # -----------------------------------
        # Remove Duplicates
        # -----------------------------------

        seen = set()

        unique_chunks = []

        for chunk in combined:

            text = chunk["text"]

            if text and text not in seen:

                seen.add(text)

                unique_chunks.append(chunk)

        # -----------------------------------
        # Prepare for Reranking
        # -----------------------------------

        documents = [
            chunk["text"]
            for chunk in unique_chunks
        ]

        # -----------------------------------
        # Reranking
        # -----------------------------------

        reranked_docs = self.reranker.rerank(
            query=query,
            documents=documents,
            top_k=top_k
        )

        # -----------------------------------
        # Final Results
        # -----------------------------------

        final_results = []

        for doc in reranked_docs:

            # Handle dict reranker output
            if isinstance(doc, dict):

                doc_text = doc.get("text", "")

            else:

                doc_text = str(doc)

            for chunk in unique_chunks:

                if chunk["text"] == doc_text:

                    final_results.append(chunk)

                    break

        return final_results