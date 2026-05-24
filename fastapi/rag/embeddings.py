from sentence_transformers import SentenceTransformer
import os


class Embeddings:

    def __init__(self):

        model_path = (
            os.getenv("EMBEDDER_MODEL_PATH")
            or "all-MiniLM-L6-v2"
        )

        self.embedder = SentenceTransformer(model_path)

    def create_embedding(self, text: str):

        embedding = self.embedder.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embedding.tolist()

    def create_embeddings(self, texts: list):

        embeddings = self.embedder.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embeddings.tolist()