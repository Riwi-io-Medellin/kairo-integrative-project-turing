from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from groq import Groq
from supabase import create_client
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from io import BytesIO
import os
from datetime import datetime


router = APIRouter(prefix="/reports", tags=["Reportes"])


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("Falta GROQ_API_KEY")
    return Groq(api_key=api_key)


def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Faltan credenciales Supabase")
    return create_client(url, key)


MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Configura Jinja2 para templates
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


@router.post("/generar-informe-pdf")
async def generar_informe_pdf(coder_id: int):
    """
    Genera PDF personalizado con template HTML para un coder individual
    """
    try:
        # 1. Lee datos de Supabase
        supabase = get_supabase_client()
        coder = supabase.table("users") \
            .select("full_name,email").eq("id", coder_id).maybe_single().execute()
        
        skills = supabase.table("soft_skills_assessment") \
            .select("*").eq("coder_id", coder_id).maybe_single().execute()
        
        if not skills.data:
            raise HTTPException(404, "No hay evaluación para este coder")
        
        s = skills.data
        
        # 2. Genera análisis con Groq
        prompt = f"""
        Análisis profesional BREVE (máx 150 palabras) sobre soft skills:
        
        Autonomía: {s['autonomy']}/5
        Gestión del tiempo: {s['time_management']}/5
        Resolución de problemas: {s['problem_solving']}/5
        Comunicación: {s['communication']}/5
        Trabajo en equipo: {s['teamwork']}/5
        Estilo de aprendizaje: {s['learning_style']}
        
        Análisis: Escribe UN párrafo coherente evaluando estas habilidades.
        """
        
        client = get_groq_client()
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250
        )
        analisis = response.choices[0].message.content
        
        # Extrae recomendaciones del análisis
        recomendaciones = [
            f"Fortalecer {s['learning_style']} como estilo de aprendizaje",
            f"Trabajar en autonomía (actual: {s['autonomy']}/5)",
            f"Mejorar gestión del tiempo (actual: {s['time_management']}/5)"
        ]
        
        # 3. Renderiza template HTML con datos
        template = env.get_template("pdf_template.html")
        html_content = template.render(
            nombre=coder.data['full_name'],
            email=coder.data['email'],
            coder_id=coder_id,
            fecha=datetime.now().strftime("%d/%m/%Y"),
            autonomy=skills.data['autonomy'],
            time_management=skills.data['time_management'],
            problem_solving=skills.data['problem_solving'],
            communication=skills.data['communication'],
            teamwork=skills.data['teamwork'],
            learning_style=skills.data['learning_style'],
            modulo=3,
            progreso=50,
            analisis=analisis
        )
        
        # 4. Convierte HTML → PDF con WeasyPrint
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        # 5. Retorna PDF descargable
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=informe_coder_{coder_id}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.post("/generar-informe-clan-pdf")
async def generar_informe_clan_pdf(clan_name: str = "ritche"):
    """
    Análisis IA del CLAN COMPLETO: stats agregadas → Groq → PDF resumen
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Stats agregadas del clan
        clan_coders = supabase.table("users") \
            .select("id, full_name") \
            .eq("clan", clan_name) \
            .execute()
        
        if not clan_coders.data:
            raise HTTPException(404, f"No hay coders en clan {clan_name}")
        
        total_coders = len(clan_coders.data)
        
        # Skills PROMEDIO del clan
        skills_query = supabase.table("soft_skills_assessment") \
            .select("autonomy, time_management, problem_solving, communication, teamwork") \
            .in_("coder_id", [c['id'] for c in clan_coders.data]) \
            .execute()
        
        skills_data = skills_query.data
        if skills_data:
            avg_skills = {
                'autonomy': sum(s['autonomy'] for s in skills_data) / len(skills_data),
                'time_management': sum(s['time_management'] for s in skills_data) / len(skills_data),
                'problem_solving': sum(s['problem_solving'] for s in skills_data) / len(skills_data),
                'communication': sum(s['communication'] for s in skills_data) / len(skills_data),
                'teamwork': sum(s['teamwork'] for s in skills_data) / len(skills_data)
            }
        else:
            avg_skills = {'autonomy': 0, 'time_management': 0, 'problem_solving': 0, 
                         'communication': 0, 'teamwork': 0}
        
        # 2. ANÁLISIS IA del CLAN COMPLETO
        prompt = f"""
        📊 ANÁLISIS ESTRATÉGICO CLAN "{clan_name.upper()}" ({total_coders} coders)
        
        PROMEDIOS SOFT SKILLS:
        • Autonomía: {avg_skills['autonomy']:.1f}/5 ⭐
        • Gestión tiempo: {avg_skills['time_management']:.1f}/5 ⏰ 
        • Resolución problemas: {avg_skills['problem_solving']:.1f}/5 💡
        • Comunicación: {avg_skills['communication']:.1f}/5 💬
        • Trabajo equipo: {avg_skills['teamwork']:.1f}/5 👥
        
        Escribe ANÁLISIS COMPLETO (300 palabras):
        1. Fortalezas del clan
        2. Áreas de mejora prioritarias  
        3. Recomendaciones específicas (entrenamientos, dinámicas)
        4. Estrategia para siguiente módulo
        """
        
        client = get_groq_client()
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        analisis_clan = response.choices[0].message.content
        
        # 3. Template CLAN (lista de nombres + stats + análisis)
        template = env.get_template("pdf_clan_template.html")
        html_content = template.render(
            clan_name=clan_name,
            total_coders=total_coders,
            avg_autonomy=f"{avg_skills['autonomy']:.1f}",
            avg_time=f"{avg_skills['time_management']:.1f}",
            avg_problems=f"{avg_skills['problem_solving']:.1f}",
            avg_comm=f"{avg_skills['communication']:.1f}",
            avg_team=f"{avg_skills['teamwork']:.1f}",
            analisis_completo=analisis_clan,
            fecha=datetime.now().strftime("%d/%m/%Y"),
            coders_nombres=[c['full_name'] for c in clan_coders.data]
        )
        
        # 4. PDF
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=analisis_clan_{clan_name}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error clan: {str(e)}")


@router.get("/health")
async def health():
    return {"reports": "OK", "template": "WeasyPrint"}