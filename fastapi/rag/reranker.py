from sentence_transformers import CrossEncoder
import os


class Reranker:

    _model = None

    def __init__(self):

        if Reranker._model is None:

            Reranker._model = CrossEncoder(
                os.getenv("RERANKER_MODEL") or "BAAI/bge-reranker-small"
            )

        self.reranker = Reranker._model

    def rerank(
        self,
        query: str,
        documents: list,
        top_k: int = 5
    ):

        # -----------------------------------
        # Empty Check
        # -----------------------------------

        if not documents:
            return []

        # -----------------------------------
        # Prepare Query-Document Pairs
        # -----------------------------------

        pairs = []

        normalized_docs = []

        for doc in documents:

            # Dict document
            if isinstance(doc, dict):

                text = (
                    doc.get("text")
                    or doc.get("page_content")
                    or ""
                )

                if text.strip():

                    pairs.append([query, text])

                    normalized_docs.append(doc)

            # Plain string
            elif isinstance(doc, str):

                if doc.strip():

                    pairs.append([query, doc])

                    normalized_docs.append({
                        "text": doc,
                        "metadata": {}
                    })

        # -----------------------------------
        # Predict Scores
        # -----------------------------------

        scores = self.reranker.predict(pairs)

        # -----------------------------------
        # Attach Scores
        # -----------------------------------

        ranked_results = []

        for doc, score in zip(normalized_docs, scores):

            doc["rerank_score"] = float(score)

            ranked_results.append(doc)

        # -----------------------------------
        # Sort By Score
        # -----------------------------------

        ranked_results.sort(
            key=lambda x: x["rerank_score"],
            reverse=True
        )

        # -----------------------------------
        # Return Top K
        # -----------------------------------

        return ranked_results[:top_k]