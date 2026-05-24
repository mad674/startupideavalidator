from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
load_dotenv()
import os

class Chunker:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=int(os.getenv("CHUNK_SIZE")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP"))
        )

    def chunk_text(self,text):
        return self.splitter.split_text(text)

    def chunk_documents(self,documents):
        return self.splitter.split_documents(documents)