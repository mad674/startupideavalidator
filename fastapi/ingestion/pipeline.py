from ingestion.detector import MimeDetector
from ingestion.extractor_router import ExtractorRouter
from ingestion.chunker import Chunker

from rag.embeddings import Embeddings
from rag.qdrant_store import QdrantStore
from rag.bm25_store import BM25Store


class DocumentProcessor:

    def __init__(self):

        # -----------------------------------
        # Ingestion Services
        # -----------------------------------

        self.mime_detector = MimeDetector()

        self.extractor_router = ExtractorRouter()

        self.chunker = Chunker()

        # -----------------------------------
        # RAG Services
        # -----------------------------------

        self.embedder = Embeddings()

        self.qdrant_store = QdrantStore()

        self.bm25_store = BM25Store()

    def process_document(
        self,
        path: str,
        metadata: dict
    ):

        # -----------------------------------
        # Detect MIME Type
        # -----------------------------------

        mime = self.mime_detector.detect(path)

        # -----------------------------------
        # Extract Content
        # -----------------------------------

        extracted = self.extractor_router.extract_content(
            path=path,
            mime=mime
        )

        # Handle extractor response
        if isinstance(extracted, dict):

            text = extracted.get("text", "")

            extractor_metadata = extracted.get(
                "metadata",
                {}
            )

        else:

            text = extracted

            extractor_metadata = {}

        # -----------------------------------
        # Validate Text
        # -----------------------------------

        if not text.strip():

            raise Exception(
                "No extractable text found in document."
            )

        # -----------------------------------
        # Chunk Text
        # -----------------------------------

        chunks = self.chunker.chunk_text(text)

        # -----------------------------------
        # Generate Embeddings (Batch)
        # -----------------------------------

        embeddings = self.embedder.create_embeddings(
            chunks
        )

        # -----------------------------------
        # Merge Metadata
        # -----------------------------------

        final_metadata = {
            **metadata,
            **extractor_metadata,
            "mime_type": mime,
            "total_chunks": len(chunks)
        }

        # -----------------------------------
        # Store in Qdrant
        # -----------------------------------

        self.qdrant_store.store_chunks(
            chunks=chunks,
            embeddings=embeddings,
            metadata=final_metadata
        )

        # -----------------------------------
        # Store in BM25
        # -----------------------------------

        self.bm25_store.add_documents(
            chunks=chunks,
            metadata=final_metadata
        )

        # -----------------------------------
        # Response
        # -----------------------------------

        return {
            "status": "success",
            "mime_type": mime,
            "chunks": len(chunks),
            "metadata": final_metadata
        }