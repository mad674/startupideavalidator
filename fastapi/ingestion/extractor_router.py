from ingestion.extractors.pdf_extractor import PDFExtractor
from ingestion.extractors.docx_extractor import DOCXExtractor
from ingestion.extractors.txt_extractor import TXTExtractor


class ExtractorRouter:

    def __init__(self):

        self.pdf_extractor = PDFExtractor()

        self.docx_extractor = DOCXExtractor()

        self.txt_extractor = TXTExtractor()

    def extract_content(
        self,
        path: str,
        mime: str
    ):

        # -----------------------------------
        # PDF
        # -----------------------------------

        if mime == "application/pdf":

            return self.pdf_extractor.extract(path)

        # -----------------------------------
        # DOCX
        # -----------------------------------

        elif (
            "word" in mime
            or "document" in mime
            or mime == (
                "application/vnd.openxmlformats-"
                "officedocument.wordprocessingml.document"
            )
        ):

            return self.docx_extractor.extract(path)

        # -----------------------------------
        # TXT
        # -----------------------------------

        elif mime.startswith("text"):

            return self.txt_extractor.extract(path)

        # -----------------------------------
        # Unsupported
        # -----------------------------------

        raise Exception(
            f"Unsupported file type: {mime}"
        )