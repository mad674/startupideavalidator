import mimetypes


class MimeDetector:

    def detect(self, path: str):

        mime_type, _ = mimetypes.guess_type(path)

        if not mime_type:
            raise Exception(
                "Could not detect file type."
            )

        return mime_type