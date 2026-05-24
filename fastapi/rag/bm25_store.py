from rank_bm25 import BM25Okapi


class BM25Store:
    def __init__(self):
        self.documents = []
        self.document_metadata=[]
        self.bm25 = None
    def add_documents(self,chunks, metadata):
        for chunk in chunks:
            self.documents.append(chunk)
            self.document_metadata.append(metadata)
        tokenized = [doc.split() for doc in self.documents]
        self.bm25 = BM25Okapi(tokenized)

    def search(self,query, top_k=5):
        if self.bm25 is None:
            return []
        results = self.bm25.get_top_n(
            query.split(),
            self.documents,
            n=top_k
        )

        return results