from rag.hybrid_retriever import HybridSearch

class Retriever:

    def __init__(self):

        self.hybrid_search = HybridSearch()

    def retrieve_documents(
        self,
        query: str,
        user_id: str,
        idea_id: str,
        top_k: int = 5
    ):

        # -----------------------------------
        # Hybrid Retrieval
        # -----------------------------------

        docs = self.hybrid_search.search(
            query=query,
            user_id=user_id,
            idea_id=idea_id,
            top_k=top_k
        )

        # -----------------------------------
        # Build Citation-Aware Context
        # -----------------------------------

        formatted_chunks = []

        for doc in docs:

            if not isinstance(doc, dict):
                continue

            text = doc.get("text", "")

            if not text:
                continue

            meta = doc.get("metadata", {})

            filename = meta.get(
                "filename",
                "Unknown"
            )

            page_number = meta.get(
                "page_number"
            )

            # -----------------------------------
            # Citation
            # -----------------------------------

            if page_number:

                citation = (
                    f"[Source: {filename}, "
                    f"Page {page_number}]"
                )

            else:

                citation = (
                    f"[Source: {filename}]"
                )

            formatted_chunks.append(
                f"{text}\n{citation}"
            )

        # -----------------------------------
        # Final Context
        # -----------------------------------

        context = "\n\n".join(formatted_chunks)

        return {
            "query": query,
            "context": context,
            "documents": docs
        }