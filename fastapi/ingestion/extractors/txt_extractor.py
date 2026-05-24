class TXTExtractor:

    def extract(self, path: str):

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            text = f.read()

        return {
            "text": text,
            "metadata": {
                "source_type": "txt"
            }
        }