from groq import Groq
from supabase import create_client
import os
from fastapi import APIRouter
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

router = APIRouter()
load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/chat-ia-db")
async def chat_ia_db(request: ChatRequest):
    user_message = request.message
    
    # 1. Schema de tus tablas KAIRO (ajusta nombres reales)
    schema = """
    Tablas KAIRO Supabase:
    - users(id, name, email, created_at)
    - tasks(id, title, status, user_id)
    - buses(route, status, driver_name)
    """
    
    # 2. Groq genera SQL dinámico
    prompt_sql = f"""
    Eres SQL expert de KAIRO. Convierte esta pregunta a SQL válido para Supabase:
    Schema: {schema}
    
    Pregunta: "{user_message}"
    
    Responde SOLO el SQL, sin explicación:
    SELECT * FROM ...
    """
    
    sql_response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt_sql}],
        model="llama3.1-70b-versatile"
    )
    sql_query = sql_response.choices[0].message.content.strip()
    
    # 3. Ejecuta SQL dinámico (¡cuidado producción!)
    try:
        result = supabase.rpc("execute_sql", {"query": sql_query}).execute()
        data = result.data or []
    except Exception as e:
        data = f"Error SQL: {str(e)}"
    
    # 4. Groq explica resultados
    prompt_final = f"""
    Pregunta: {user_message}
    SQL ejecutado: {sql_query}
    Datos Supabase: {str(data)[:1500]}
    
    Resume en español claro y natural.
    """
    
    final_response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt_final}],
        model="llama3.1-70b-versatile"
    )
    
    return {
        "pregunta": user_message,
        "sql_generado": sql_query,
        "datos_raw": data,
        "respuesta_ia": final_response.choices[0].message.content
    }
