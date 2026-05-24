from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

from fastapi.utils.encrypt import Decryptor


decryptor = Decryptor()


class Compressor:
    def __init__(self, api: dict):

        self.llm = ChatOpenAI(
            model=api["model_name"],
            temperature=api.get("temperature", 0),
            openai_api_key=decryptor.decrypt_api_key(api["apikey"]),
            openai_api_base=api["provider_url"],
        )

        self.compressor = LLMChainExtractor.from_llm(self.llm)

    def compress_documents(self, query: str, documents: list):
        """
        Compress retrieved documents based on the user query.

        Args:
            query (str): User query
            documents (list): List of document strings OR Document objects

        Returns:
            list: Compressed document results
        """

        langchain_docs = []

        for idx, doc in enumerate(documents):

            # If already a LangChain Document
            if isinstance(doc, Document):
                langchain_docs.append(doc)

            # If plain string
            elif isinstance(doc, str):
                langchain_docs.append(
                    Document(
                        page_content=doc,
                        metadata={
                            "chunk_id": idx
                        }
                    )
                )

            # If dict format
            elif isinstance(doc, dict):
                langchain_docs.append(
                    Document(
                        page_content=doc.get("page_content", ""),
                        metadata=doc.get("metadata", {})
                    )
                )

        compressed_docs = self.compressor.compress_documents(
            documents=langchain_docs,
            query=query
        )

        results = []

        for doc in compressed_docs:
            results.append({
                "page_content": doc.page_content,
                "metadata": doc.metadata
            })

        return results