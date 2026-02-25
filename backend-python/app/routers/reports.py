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
    Genera PDF personalizado con template HTML
    """
    try:
        # 1. Lee datos de Supabase
        supabase = get_supabase_client()
        coder = supabase.table("users")\
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
        
        # Extrae recomendaciones del análisis (o genera nuevas)
        recomendaciones = [
            f"Fortalecer {s['learning_style']} como estilo de aprendizaje",
            f"Trabajar en autonomía (actual: {s['autonomy']}/5)",
            f"Mejorar gestión del tiempo (actual: {s['time_management']}/5)"
        ]
        
        # 3. Renderiza template HTML con datos
        # coder = supabase.table("users").select("name, email").eq("id", coder_id).maybe_single().execute()
        # Dentro de generar_informe_pdf()
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
        analisis=analisis  # De Groq
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

@router.get("/health")
async def health():
    return {"reports": "OK", "template": "WeasyPrint"}
