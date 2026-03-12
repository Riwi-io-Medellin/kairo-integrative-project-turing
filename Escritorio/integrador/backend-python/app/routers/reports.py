"""
app/routers/reports.py
TL-facing endpoints:
  POST /generate-report         → AI narrative report for a clan (saved to ai_reports)
  GET  /generate-pdf/{clan}     → Returns a downloadable PDF report for the clan

PDF generation uses fpdf2 (pure Python, no system dependencies).
"""
import logging
logger = logging.getLogger("kairo-reports")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING) 

import os
import io
import json
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from supabase import create_client
from fpdf import FPDF

logger = logging.getLogger("kairo-reports")
router = APIRouter(tags=["TL Reports"])

def _get_clients():
    return (
        OpenAI(api_key=os.getenv("OPENAI_API_KEY")),
        create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    )

# Agrega esta función
def _get_supabase():
    return (
        create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
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


def _call_ai(prompt: str) -> dict:
    """Llama a Groq y retorna el JSON parseado."""
    from groq import Groq
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "Eres un analista educativo. Responde solo con JSON valido."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=600,
        temperature=0.6,
    )
    raw = completion.choices[0].message.content
    logger.info(f"Groq raw response: {raw}")  # <-- ver qué devuelve

    # Limpiar si viene con ```json ... ```
    if raw.strip().startswith("```"):
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    if not raw:
        logger.error("Groq returned empty response")
        return {}

    return json.loads(raw)


def _analyze_coder_with_ai(coder: dict, skills: dict, progress: dict) -> dict:
    prompt = f"""
Eres un analista educativo del bootcamp Riwi. Analiza el rendimiento de este coder.

DATOS:
- Nombre: {coder.get('full_name')}
- Promedio: {progress.get('average_score', 'N/A')}/100
- Semana actual: {progress.get('current_week', 'N/A')}
- Autonomia: {skills.get('autonomy', 'N/A')}
- Manejo del tiempo: {skills.get('time_management', 'N/A')}
- Resolucion de problemas: {skills.get('problem_solving', 'N/A')}
- Comunicacion: {skills.get('communication', 'N/A')}
- Trabajo en equipo: {skills.get('teamwork', 'N/A')}
- Estilo de aprendizaje: {skills.get('learning_style', 'N/A')}

Responde SOLO en JSON valido sin tildes ni caracteres especiales:
{{
    "risk_level": "bajo|medio|alto|critico",
    "summary": "resumen del estado actual",
    "strengths": "fortalezas identificadas",
    "risks": "areas de mejora",
    "recommendations": "3 recomendaciones para el TL"
}}
"""
    return _call_ai(prompt)


def _analyze_clan_with_ai(clan_name: str, coders: list, skills_map: dict, progress_map: dict) -> dict:
    scores = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
    avg = sum(scores) / len(scores) if scores else 0
    assessed = sum(1 for c in coders if c["id"] in skills_map)

    coders_summary = []
    for c in coders:
        cid = c["id"]
        ss = skills_map.get(cid, {})
        prog = progress_map.get(cid, {})
        coders_summary.append({
            "name": c["full_name"],
            "average_score": prog.get("average_score", "N/A"),
            "current_week": prog.get("current_week", "N/A"),
            "autonomy": ss.get("autonomy", "N/A"),
            "time_management": ss.get("time_management", "N/A"),
            "problem_solving": ss.get("problem_solving", "N/A"),
            "communication": ss.get("communication", "N/A"),
            "teamwork": ss.get("teamwork", "N/A"),
            "learning_style": ss.get("learning_style", "N/A"),
        })

    prompt = f"""
Eres un analista educativo del bootcamp Riwi. Analiza el rendimiento del clan "{clan_name}" con {len(coders)} coders.

Estadisticas generales:
- Promedio general del clan: {avg:.1f}/100
- Diagnosticos completados: {assessed}/{len(coders)}

Perfiles de coders:
{json.dumps(coders_summary, ensure_ascii=False, indent=2)}

Responde SOLO en JSON valido sin tildes ni caracteres especiales:
{{
    "risk_level": "bajo|medio|alto|critico",
    "summary": "resumen general del clan",
    "strengths": "fortalezas colectivas del clan",
    "risks": "riesgos o areas de preocupacion del clan",
    "recommendations": "recomendaciones para el clan y el instructor"
}}
"""
    return _call_ai(prompt)

@router.post("/generate-report")
async def generate_report(req: ReportRequest):
    """
    Called by Node.js: POST /generate-report
    Generates an AI analytical report for a clan and saves to ai_reports.
    """
    openai_client, supabase = _get_clients()

    try:
        prompt = f"""
You are an educational data analyst for Riwi coding bootcamp.
Write a professional report for the Team Leader of clan '{req.clan}'.

DATA:
- Total coders: {req.total_coders}
- Average score: {req.average_score:.1f}/100
- High/critical risk coders: {req.high_risk_count}
- Top struggling topics: {', '.join(req.top_struggling_topics) if req.top_struggling_topics else 'None reported'}
- Soft skills averages: {json.dumps(req.soft_skills_summary) if req.soft_skills_summary else 'Not available'}

Write 3 sections:
1. Current state summary (what is going well, what is not)
2. Main risks and concerns (be specific)
3. Concrete recommendations for the TL (3-5 action items)

Return ONLY valid JSON:
{{
    "report_title": "Clan {req.clan} — Performance Report",
    "generated_date": "{datetime.now().strftime('%B %d, %Y')}",
    "risk_level": "low|medium|high|critical",
    "summary": "paragraph about current state",
    "risks": "paragraph about risks",
    "recommendations": "paragraph about what the TL should do",
    "action_items": ["item 1", "item 2", "item 3"]
}}
"""

        completion = openai_client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an educational analyst. Respond only with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=900,
            temperature=0.6,
        )

        report = json.loads(completion.choices[0].message.content)

        # Save to ai_reports
        supabase.table("ai_reports").insert({
            "target_type":    "clan",
            "target_id":      req.tl_id,
            "summary_text":   report.get("summary", ""),
            "risk_level":     report.get("risk_level", "medium"),
            "recommendations": report.get("recommendations", ""),
            "clan_id":        req.clan,
            "viewed_by_tl":   False,
        }).execute()

        # Log generation
        supabase.table("ai_generation_log").insert({
            "agent_type":    "report_generator",
            "input_payload": {"clan": req.clan, "total_coders": req.total_coders},
            "output_payload": report,
            "model_name":    "gpt-4o-mini",
            "success":       True,
        }).execute()

        return {"success": True, "report": report}

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════
# PDF GENERATION
# ════════════════════════════════════════

@router.post("/generar-informe-pdf")
async def generate_clan_pdf(coder_id: int):
    supabase = _get_supabase()
    try:
        # 1. Fetch coder
        coders_result = supabase.table("users") \
            .select("id, full_name, email, first_login") \
            .eq("id", coder_id) \
            .eq("role", "coder") \
            .execute()

        coders = coders_result.data or []
        if not coders:
            raise HTTPException(status_code=404, detail=f"No coders found with ID '{coder_id}'")

        # 2. Fetch soft skills
        coder_ids = [c["id"] for c in coders]
        skills_result = supabase.table("soft_skills_assessment") \
            .select("coder_id, autonomy, time_management, problem_solving, communication, teamwork, learning_style") \
            .in_("coder_id", coder_ids) \
            .execute()
        skills_map = {s["coder_id"]: s for s in (skills_result.data or [])}

        # 3. Fetch moodle progress
        progress_result = supabase.table("moodle_progress") \
            .select("coder_id, average_score, current_week") \
            .in_("coder_id", coder_ids) \
            .execute()
        progress_map = {p["coder_id"]: p for p in (progress_result.data or [])}

        # 4. Genera análisis IA
        coder = coders[0]
        skills = skills_map.get(coder["id"], {})
        progress = progress_map.get(coder["id"], {})
        ai_analysis = _analyze_coder_with_ai(coder, skills, progress)

        # 5. Build PDF
        coder_name = coder["full_name"]
        pdf_bytes = _build_pdf(coder_name, coders, skills_map, progress_map, ai_analysis)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=ID_{coder_id}_report.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
def _safe_str(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(i) for i in value)
    return str(value) if value else "N/A"

def _build_pdf(coder_name: str, coders: list, skills_map: dict, progress_map: dict, ai_analysis: dict = {}) -> bytes:
    """Builds the clan PDF using fpdf2."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Header ──────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_fill_color(109, 40, 217)   # Kairo purple
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 14, f"  Coder {coder_name} - Performance Report", fill=True, ln=True)

    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"  Generated by Kairo AI · {datetime.now().strftime('%B %d, %Y')}", ln=True)
    pdf.ln(6)

    # ── Summary stats ───────────────────────────────────────────
    scores   = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
    avg      = sum(scores) / len(scores) if scores else 0
    assessed = sum(1 for c in coders if c["id"] in skills_map)

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 8, "Overview", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"Total coders: {len(coders)}", ln=True)
    pdf.cell(0, 7, f"Average score: {avg:.1f}/100", ln=True)
    pdf.cell(0, 7, f"Diagnostics completed: {assessed}/{len(coders)}", ln=True)
    pdf.ln(6)

    # ── Per-coder section ───────────────────────────────────────
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Coder Profiles", ln=True)
    pdf.ln(2)

    for coder in coders:
        cid      = coder["id"]
        ss       = skills_map.get(cid, {})
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
                f"Soft skills - Autonomy: {ss.get('autonomy','?')}  "
                f"Time Mgmt: {ss.get('time_management','?')}  "
                f"Problem Solving: {ss.get('problem_solving','?')}  "
                f"Communication: {ss.get('communication','?')}  "
                f"Teamwork: {ss.get('teamwork','?')}",
                ln=True
            )
            pdf.cell(0, 6, f"Learning style: {ss.get('learning_style', 'N/A')}", ln=True)
        else:
            pdf.set_text_color(200, 50, 50)
            pdf.cell(0, 6, "Diagnostic not completed.", ln=True)
            pdf.set_text_color(60, 60, 60)

        pdf.ln(4)
        pdf.set_draw_color(220, 220, 220)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)

    if ai_analysis:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_fill_color(109, 40, 217)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 12, "  Analisis IA - Kairo", fill=True, ln=True)
        pdf.ln(4)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 30, 30)
        risk = ai_analysis.get('risk_level', 'N/A').upper()
        pdf.cell(0, 8, f"Nivel de riesgo: {risk}", ln=True)
        pdf.ln(3)

        for label, key in [
            ("Resumen", "summary"),
            ("Fortalezas", "strengths"),
            ("Riesgos", "risks"),
            ("Recomendaciones", "recommendations")
        ]:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(109, 40, 217)
            pdf.cell(0, 7, label, ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 6, _safe_str(ai_analysis.get(key)))
            pdf.ln(3)

@router.post("/generar-informe-clan-pdf")
async def generate_clan_pdf_by_clan(clan_name: str):
    supabase = _get_supabase()
    try:
        # 1. Fetch coders del clan
        coders_result = supabase.table("users") \
            .select("id, full_name, email, first_login, clan") \
            .eq("clan", clan_name) \
            .eq("role", "coder") \
            .execute()

        coders = coders_result.data or []
        if not coders:
            raise HTTPException(status_code=404, detail=f"No coders found in clan '{clan_name}'")

        # 2. Fetch soft skills
        coder_ids = [c["id"] for c in coders]
        skills_result = supabase.table("soft_skills_assessment") \
            .select("coder_id, autonomy, time_management, problem_solving, communication, teamwork, learning_style") \
            .in_("coder_id", coder_ids) \
            .execute()
        skills_map = {s["coder_id"]: s for s in (skills_result.data or [])}

        # 3. Fetch moodle progress
        progress_result = supabase.table("moodle_progress") \
            .select("coder_id, average_score, current_week") \
            .in_("coder_id", coder_ids) \
            .execute()
        progress_map = {p["coder_id"]: p for p in (progress_result.data or [])}

        # 4. Genera análisis IA por clan (toma muestra representativa)
        ai_analysis = _analyze_clan_with_ai(clan_name, coders, skills_map, progress_map)

        # 5. Build PDF
        pdf_bytes = _build_clan_pdf(clan_name, coders, skills_map, progress_map, ai_analysis)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Clan_{clan_name}_report.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clan PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _analyze_clan_with_ai(clan_name: str, coders: list, skills_map: dict, progress_map: dict) -> dict:
    """Genera análisis IA del clan completo."""
    scores = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
    avg = sum(scores) / len(scores) if scores else 0
    assessed = sum(1 for c in coders if c["id"] in skills_map)

    coders_summary = []
    for c in coders:
        cid = c["id"]
        ss = skills_map.get(cid, {})
        prog = progress_map.get(cid, {})
        coders_summary.append({
            "name": c["full_name"],
            "average_score": prog.get("average_score", "N/A"),
            "current_week": prog.get("current_week", "N/A"),
            "autonomy": ss.get("autonomy", "N/A"),
            "time_management": ss.get("time_management", "N/A"),
            "problem_solving": ss.get("problem_solving", "N/A"),
            "communication": ss.get("communication", "N/A"),
            "teamwork": ss.get("teamwork", "N/A"),
            "learning_style": ss.get("learning_style", "N/A"),
        })

    prompt = f"""
Eres Kairo, un asistente de análisis educativo. Analiza el rendimiento del clan "{clan_name}" con {len(coders)} coders.

Estadísticas generales:
- Promedio general del clan: {avg:.1f}/100
- Diagnósticos completados: {assessed}/{len(coders)}

Perfiles de coders:
{json.dumps(coders_summary, ensure_ascii=False, indent=2)}

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{{
  "risk_level": "low|medium|high",
  "summary": "Resumen general del clan",
  "strengths": "Fortalezas colectivas del clan",
  "risks": "Riesgos o áreas de preocupación del clan",
  "recommendations": "Recomendaciones para el clan y el instructor"
}}
"""
    # Reutiliza tu cliente de IA (ajusta según el tuyo)
    return _call_ai(prompt)


def _build_clan_pdf(clan_name: str, coders: list, skills_map: dict, progress_map: dict, ai_analysis: dict = {}) -> bytes:
    """Builds the clan PDF using fpdf2."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    scores = [progress_map.get(c["id"], {}).get("average_score", 0) for c in coders]
    avg = sum(scores) / len(scores) if scores else 0
    assessed = sum(1 for c in coders if c["id"] in skills_map)
    at_risk = sum(1 for c in coders if progress_map.get(c["id"], {}).get("average_score", 100) < 60)

    # ── Header ──────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_fill_color(109, 40, 217)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 14, f"  Clan {clan_name} - Performance Report", fill=True, ln=True)

    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"  Generated by Kairo AI · {datetime.now().strftime('%B %d, %Y')}", ln=True)
    pdf.ln(6)

    # ── Summary stats ───────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 8, "Overview del Clan", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"Total coders: {len(coders)}", ln=True)
    pdf.cell(0, 7, f"Promedio general: {avg:.1f}/100", ln=True)
    pdf.cell(0, 7, f"Diagnósticos completados: {assessed}/{len(coders)}", ln=True)
    pdf.cell(0, 7, f"Coders en riesgo (score < 60): {at_risk}", ln=True)
    pdf.ln(6)

    # ── Per-coder section ───────────────────────────────────────
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Perfiles de Coders", ln=True)
    pdf.ln(2)

    for coder in coders:
        cid = coder["id"]
        ss = skills_map.get(cid, {})
        progress = progress_map.get(cid, {})
        score = progress.get("average_score", None)
        is_at_risk = score is not None and score < 60

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(200, 50, 50) if is_at_risk else pdf.set_text_color(109, 40, 217)
        name_label = f"{coder['full_name']}  ⚠ EN RIESGO" if is_at_risk else coder["full_name"]
        pdf.cell(0, 8, name_label, ln=True)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(0, 6, f"Email: {coder['email']}", ln=True)
        pdf.cell(0, 6, f"Score: {score if score is not None else 'N/A'}  |  Semana: {progress.get('current_week', 'N/A')}", ln=True)

        if ss:
            pdf.cell(0, 6,
                f"Soft skills - Autonomía: {ss.get('autonomy','?')}  "
                f"Gestión tiempo: {ss.get('time_management','?')}  "
                f"Resolución: {ss.get('problem_solving','?')}  "
                f"Comunicación: {ss.get('communication','?')}  "
                f"Trabajo en equipo: {ss.get('teamwork','?')}",
                ln=True
            )
            pdf.cell(0, 6, f"Estilo de aprendizaje: {ss.get('learning_style', 'N/A')}", ln=True)
        else:
            pdf.set_text_color(200, 50, 50)
            pdf.cell(0, 6, "Diagnóstico no completado.", ln=True)
            pdf.set_text_color(60, 60, 60)

        pdf.ln(4)
        pdf.set_draw_color(220, 220, 220)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)

    # ── AI Analysis page ────────────────────────────────────────
    if ai_analysis:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_fill_color(109, 40, 217)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 12, "  Análisis IA del Clan - Kairo", fill=True, ln=True)
        pdf.ln(4)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 30, 30)
        risk = ai_analysis.get('risk_level', 'N/A').upper()
        pdf.cell(0, 8, f"Nivel de riesgo del clan: {risk}", ln=True)
        pdf.ln(3)

        for label, key in [
            ("Resumen", "summary"),
            ("Fortalezas", "strengths"),
            ("Riesgos", "risks"),
            ("Recomendaciones", "recommendations")
        ]:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(109, 40, 217)
            pdf.cell(0, 7, label, ln=True)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 6, _safe_str(ai_analysis.get(key)))
            pdf.ln(3)

    return bytes(pdf.output())  # ← return al final
