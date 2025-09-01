# routes/pdf.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.pdf_generator import generate_pdf
from fastapi.responses import FileResponse
from memory.memory_store import MemoryStore

router = APIRouter()
memory = MemoryStore()

class PDFRequest(BaseModel):
    idea_id: str
    user_id: str


@router.post("/pdf")
def create_pdf(request: PDFRequest):
    try:
        # print("📩 Received PDF payload:", request)
        idea_data = memory.get_idea(request.user_id, request.idea_id)

        if not idea_data:
            raise HTTPException(status_code=404, detail="Idea not found")

        pdf_path =  generate_pdf(
            idea=idea_data['structured'].get('name', 'Unnamed Idea'),
            structured=idea_data.get('structured', {}),
            scores=idea_data.get('scores', {}),
            suggestions=idea_data.get('suggestions', {}),
            feedback=idea_data.get('feedback', {}),  # fallback if missing
            user_id=request.user_id
        )

        return FileResponse(
            path=pdf_path,
            filename=f"{idea_data['structured'].get('name', 'report')}_report.pdf",
            media_type="application/pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        print("❌ PDF generation failed:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
