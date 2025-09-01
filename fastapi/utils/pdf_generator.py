# utils/pdf_generator.py
from fpdf import FPDF
from datetime import datetime
import os
import json
import re

def clean_text(text: str) -> str:
    """Remove emojis and non-ASCII characters (fpdf only supports latin-1)."""
    return re.sub(r'[^\x00-\x7F]+', '', str(text))

def generate_pdf(idea: str, structured: dict, scores: dict, suggestions: dict, feedback: dict, user_id: str) -> str:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Title
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt=clean_text("🚀 Startup Idea Evaluation Report"), ln=True, align='C')

    pdf.ln(10)
    pdf.set_font("Arial", size=12)

    # Original Idea
    pdf.multi_cell(0, 10, txt=clean_text(f"📌 Idea Name: {idea}"))

    # Structured
    pdf.ln(5)
    pdf.multi_cell(0, 10, txt=clean_text("🔍 Structured Format:"))
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 8, txt=clean_text(json.dumps(structured, indent=2, ensure_ascii=False)))

    # Scores
    pdf.ln(5)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=clean_text("📊 Scores:"))
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 8, txt=clean_text(json.dumps(scores, indent=2, ensure_ascii=False)))

    # Suggestions
    pdf.ln(5)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=clean_text("💡 Suggestions:"))
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 8, txt=clean_text(json.dumps(suggestions, indent=2, ensure_ascii=False)))

    # Feedback
    pdf.ln(5)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=clean_text("📝 Feedback:"))
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 8, txt=clean_text(json.dumps(feedback, indent=2, ensure_ascii=False)))

    # Save file
    output_dir = "/mnt/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{user_id}_startup_report.pdf")
    pdf.output(output_path)

    return output_path
