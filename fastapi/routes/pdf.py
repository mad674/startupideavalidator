# routes/pdf.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.pdf_generator import generate_pdf
from fastapi.responses import FileResponse
from memory.memory_store import MemoryStore
import requests
import json
import os

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
        # print(idea_data)
        if not idea_data:
            raise HTTPException(status_code=404, detail="Idea not found")
        try:
            response = requests.get(os.getenv("BACKEND_URL")+"/idea/getexpertchats/"+request.idea_id)
            # Check if the request was success
            if response.status_code == 200:
                data = response.json()  # Parse JSON response
                # print("Response data:", data)
            else:
                print(f"Error {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            print("Request failed:", e)

        pdf_path =  generate_pdf(
            idea=idea_data['structured'].get('name', 'Unnamed Idea'),
            structured=idea_data.get('structured', {}),
            scores=idea_data.get('scores', {}),
            suggestions=idea_data.get('suggestions', {}),
            feedback=idea_data.get('feedbacks', {}),  # fallback if missing
            chats=data.get('expertchats', []),
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
