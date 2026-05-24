# qdrant_store.py

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)

import uuid
import os


class QdrantStore:

    COLLECTION_NAME = "documents"

    def __init__(self):

        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL").strip(),
            api_key=os.getenv("QDRANT_API_KEY").strip()
        )

        # all-MiniLM-L6-v2 => 384 dimensions
        self.vector_size = 384

    # -----------------------------------
    # Initialize Collection
    # -----------------------------------

    def init_collection(self):
        collections = self.client.get_collections().collections

        existing = [
            collection.name
            for collection in collections
        ]

        if self.COLLECTION_NAME not in existing:

            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE
                )
            )

            # -----------------------------------
            # Payload Indexes
            # -----------------------------------

            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="user_id",
                field_schema="keyword"
            )

            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="idea_id",
                field_schema="keyword"
            )

            self.client.create_payload_index(
                collection_name=self.COLLECTION_NAME,
                field_name="file_id",
                field_schema="keyword"
            )

            print(f"Collection '{self.COLLECTION_NAME}' created.")

        else:

            print(f"Collection '{self.COLLECTION_NAME}' already exists.")
    # -----------------------------------
    # Store Chunks
    # -----------------------------------

    def store_chunks(
        self,
        chunks: list,
        embeddings: list,
        metadata: dict
    ):

        points = []

        for index, (chunk, embedding) in enumerate(
            zip(chunks, embeddings)
        ):

            payload = {
                "text": chunk,
                "chunk_index": index,
                "chunk_id": str(uuid.uuid4()),
                **metadata
            }

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload=payload
                )
            )

        self.client.upsert(
            collection_name=self.COLLECTION_NAME,
            points=points
        )

        return {
            "status": "success",
            "stored_chunks": len(points)
        }

    # -----------------------------------
    # Search Documents
    # -----------------------------------

    def search(
        self,
        query_vector: list,
        limit: int = 5,
        user_id: str = None,
        idea_id: str = None
    ):

        query_filter = None

        if user_id:

            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    ),
                    FieldCondition(
                        key="idea_id",
                        match=MatchValue(value=idea_id)
                    )
                ]
            )

        results = self.client.query_points(
            collection_name=self.COLLECTION_NAME,
            query=query_vector,
            limit=limit,
            query_filter=query_filter
        )

        points = results.points if hasattr(results, "points") else results

        formatted_results = []

        for result in points:

            formatted_results.append({
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            })

        return formatted_results