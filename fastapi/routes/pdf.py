from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.pdf_generator import generate_pdf
from fastapi.responses import FileResponse

router = APIRouter()

class PDFRequest(BaseModel):
    idea: str
    structured: dict
    scores: dict
    suggestions: dict
    user_id: str
    feedback:dict

@router.post("/pdf")
def create_pdf(request: PDFRequest):
    try:
        pdf_path = generate_pdf(
            idea=request.idea,
            structured=request.structured,
            scores=request.scores,
            suggestions=request.suggestions,
            feedback=request.feedback,
            user_id=request.user_id
        )
        return FileResponse(path=pdf_path, filename=pdf_path.split("/")[-1], media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
