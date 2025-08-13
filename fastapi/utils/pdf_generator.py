from fpdf import FPDF
import os
from datetime import datetime

def generate_pdf(idea: str, structured: str, scores: str, suggestions: str, user_id: str) -> str:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt="Startup Idea Evaluation Report", ln=True, align='C')

    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"User: {user_id}", ln=True)
    pdf.cell(200, 10, txt=f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)

    pdf.ln(10)
    pdf.multi_cell(0, 10, txt=f"📌 Original Idea:\n{idea}")
    pdf.ln(5)
    pdf.multi_cell(0, 10, txt=f"🔍 Structured Format:\n{structured}")
    pdf.ln(5)
    pdf.multi_cell(0, 10, txt=f"📊 Scores:\n{scores}")
    pdf.ln(5)
    pdf.multi_cell(0, 10, txt=f"💡 Suggestions:\n{suggestions}")

    output_path = f"/mnt/data/{user_id}_startup_report.pdf"
    pdf.output(output_path)
    return output_path
