from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
import os
import shutil

from ingestion.pipeline import DocumentProcessor

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

process_document = DocumentProcessor()

# 50MB limit
MAX_FILE_SIZE = 50 * 1024 * 1024

@router.post("/upload")
async def upload_file(
    user_id: str,
    idea_id: str,
    file: UploadFile = File(...)
):

    file_id = str(uuid.uuid4())

    path = f"{UPLOAD_DIR}/{file_id}_{file.filename}"

    try:

        # -----------------------------------
        # Validate file size
        # -----------------------------------

        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:

            raise HTTPException(
                status_code=400,
                detail="File exceeds 50MB limit"
            )

        # -----------------------------------
        # Save temp file
        # -----------------------------------

        with open(path, "wb") as f:
            f.write(contents)

        # -----------------------------------
        # Metadata
        # -----------------------------------

        metadata = {
            "user_id": user_id,
            "idea_id": idea_id,
            "file_id": file_id,
            "filename": file.filename
        }

        # -----------------------------------
        # Process document
        # -----------------------------------

        result = process_document.process_document(
            path,
            metadata
        )

        return {
            "status": "success",
            "chunks": result.get("chunks", 0)
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        # -----------------------------------
        # Always cleanup temp file
        # -----------------------------------

        if os.path.exists(path):
            os.remove(path)