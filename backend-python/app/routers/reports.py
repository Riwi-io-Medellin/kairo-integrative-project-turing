"""
app/routers/reports.py
BUG FIX #7: OpenAI → Groq (llama-3.3-70b-versatile)
PDF generation uses fpdf2 (pure Python, no system dependencies).
"""

import os
import io
import json
import logging
from datetime import datetime
from pydoc import text
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from supabase import create_client
from fpdf import FPDF

logger = logging.getLogger("kairo-reports")
router = APIRouter(tags=["TL Reports"])

def _get_clients():
    return (
        Groq(api_key=os.getenv("GROQ_API_KEY")),
        create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    )

# ════════════════════════════════════════
# AI REPORT GENERATION
# ════════════════════════════════════════

class ReportRequest(BaseModel):
    clan:                  str
    tl_id:                 int
    total_coders:          int
    average_score:         float
    high_risk_count:       int
    top_struggling_topics: list[str] = []
    soft_skills_summary:   dict = {}

@router.post("generar-informe-clan-pdf")
async def generate_clan_report_pdf(clan_name: str):
    groq_client, supabase = _get_clients()

    try:
        # 1. Obtener coders del clan
        coders_result = supabase.table("users") \
            .select("id, full_name, email") \
            .eq("clan", clan_name) \
            .eq("role", "coder") \
            .execute()

        coders = coders_result.data or []
        if not coders:
            raise HTTPException(status_code=404, detail=f"No coders found in clan '{clan_name}'")

        coder_ids = [c["id"] for c in coders]

        # 2. Obtener soft skills
        skills_result = supabase.table("soft_skills_assessment") \
            .select("coder_id, autonomy, time_management, problem_solving, communication, teamwork, learning_style") \
            .in_("coder_id", coder_ids) \
            .execute()
        skills_map = {s["coder_id"]: s for s in (skills_result.data or [])}

        # 3. Obtener progreso
        progress_result = supabase.table("moodle_progress") \
            .select("coder_id, average_score, current_week") \
            .in_("coder_id", coder_ids) \
            .execute()
        progress_map = {p["coder_id"]: p for p in (progress_result.data or [])}

        # 4. Calcular métricas para el prompt
        scores = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
        avg_score = sum(scores) / len(scores) if scores else 0
        high_risk = sum(1 for s in scores if s < 50)

        soft_skills_avg = {}
        skill_keys = ["autonomy", "time_management", "problem_solving", "communication", "teamwork"]
        for key in skill_keys:
            vals = [skills_map[cid][key] for cid in skills_map if skills_map[cid].get(key) is not None]
            if vals:
                soft_skills_avg[key] = round(sum(vals) / len(vals), 1)

        struggling_topics = []  # Puedes conectar otra tabla aquí si tienes los temas

        # 5. Llamar a Groq
        prompt = f"""
You are an educational data analyst for Riwi coding bootcamp.
Write a professional report for the Team Leader of clan '{clan_name}'.

DATA:
- Total coders: {len(coders)}
- Average score: {avg_score:.1f}/100
- High/critical risk coders (score < 50): {high_risk}
- Soft skills averages: {json.dumps(soft_skills_avg) if soft_skills_avg else 'Not available'}

Write 3 sections:
1. Current state summary
2. Main risks and concerns
3. Concrete recommendations (3-5 action items)

Return ONLY valid JSON with no markdown, no backticks:
{{
    "report_title": "Clan {clan_name} - Performance Report",
    "generated_date": "{datetime.now().strftime('%B %d, %Y')}",
    "risk_level": "low|medium|high|critical",
    "summary": "paragraph about current state",
    "risks": "paragraph about risks",
    "recommendations": "paragraph about what the TL should do",
    "action_items": ["item 1", "item 2", "item 3"]
}}
"""
        completion = groq_client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
            messages=[
                {"role": "system", "content": "You are an educational analyst. Respond only with valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,
            temperature=0.6,
        )

        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        report = json.loads(raw)

        # 6. Generar PDF con el análisis + datos
        pdf_bytes = _build_pdf_with_ai(clan_name, coders, skills_map, progress_map, report)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=informe_clan_{clan_name}.pdf"}
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
def _sanitize(text: str) -> str:
    return (str(text)
        .replace("\u2014", "-").replace("\u2013", "-")
        .replace("\u201c", '"').replace("\u201d", '"')
        .replace("\u2018", "'").replace("\u2019", "'")
    )


def _build_pdf_with_ai(clan: str, coders: list, skills_map: dict, progress_map: dict, report: dict) -> bytes:
    
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_fill_color(109, 40, 217)
    pdf.set_text_color(255, 255, 255)
    # ✅ Después
    def _sanitize(text: str) -> str:
        return (str(text)
        .replace("\u2014", "-").replace("\u2013", "-")
        .replace("\u201c", '"').replace("\u201d", '"')
        .replace("\u2018", "'").replace("\u2019", "'")
    )

    title = _sanitize(report.get('report_title', f'Clan {clan.upper()}'))
    pdf.cell(0, 14, f"  {title}", fill=True, ln=True)
    pdf.cell(0, 14, f"  {report.get('report_title', f'Clan {clan.upper()}')}", fill=True, ln=True)

    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"  Generated by Kairo AI · {report.get('generated_date', '')}", ln=True)

    # Risk badge
    risk = report.get("risk_level", "medium")
    risk_colors = {"low": (34,197,94), "medium": (234,179,8), "high": (249,115,22), "critical": (239,68,68)}
    r, g, b = risk_colors.get(risk, (100,100,100))
    pdf.set_fill_color(r, g, b)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(40, 8, f"  Risk: {risk.upper()}  ", fill=True, ln=True)
    pdf.ln(4)

    # AI Analysis sections
    sections = [
        ("Current State", report.get("summary", "")),
        ("Risks & Concerns", report.get("risks", "")),
        ("Recommendations", report.get("recommendations", "")),
    ]

    for title, content in sections:
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(109, 40, 217)
        pdf.cell(0, 9, title, ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(40, 40, 40)
        pdf.multi_cell(0, 6, _sanitize(content))
        pdf.ln(3)

    # Action items
    action_items = report.get("action_items", [])
    if action_items:
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(109, 40, 217)
        pdf.cell(0, 9, "Action Items", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(40, 40, 40)
        for i, item in enumerate(action_items, 1):
            pdf.cell(0, 7, f"  {i}. {_sanitize(item)}", ln=True)
        pdf.ln(4)

    # Divider
    pdf.set_draw_color(180, 180, 180)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(6)

    # Coder profiles
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 9, "Coder Profiles", ln=True)
    pdf.ln(2)

    scores = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
    avg = sum(scores) / len(scores) if scores else 0
    assessed = sum(1 for c in coders if c["id"] in skills_map)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 7, f"Total coders: {len(coders)}  |  Avg score: {avg:.1f}/100  |  Diagnostics: {assessed}/{len(coders)}", ln=True)
    pdf.ln(4)

    for coder in coders:
        cid = coder["id"]
        ss = skills_map.get(cid, {})
        progress = progress_map.get(cid, {})

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(109, 40, 217)
        pdf.cell(0, 8, coder["full_name"], ln=True)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(0, 6, f"Email: {coder['email']}", ln=True)
        pdf.cell(0, 6, f"Avg score: {progress.get('average_score', 'N/A')}  |  Week: {progress.get('current_week', 'N/A')}", ln=True)

        if ss:
            pdf.cell(0, 6,
                f"Autonomy: {ss.get('autonomy','?')}  Time Mgmt: {ss.get('time_management','?')}  "
                f"Problem Solving: {ss.get('problem_solving','?')}  Communication: {ss.get('communication','?')}  "
                f"Teamwork: {ss.get('teamwork','?')}",
                ln=True
            )
            pdf.cell(0, 6, f"Learning style: {ss.get('learning_style', 'N/A')}", ln=True)
        else:
            pdf.set_text_color(200, 50, 50)
            pdf.cell(0, 6, "Diagnostic not completed.", ln=True)
            pdf.set_text_color(60, 60, 60)

        pdf.ln(3)
        pdf.set_draw_color(220, 220, 220)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)

    return bytes(pdf.output())