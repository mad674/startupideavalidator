from pypdf import PdfReader


class PDFExtractor:

    def extract(self, path: str):

        reader = PdfReader(path)

        text = ""

        for page in reader.pages:

            extracted = page.extract_text()

            if extracted:
                text += extracted + "\n"

        return {
            "text": text,
            "metadata": {
                "pages": len(reader.pages)
            }
        }