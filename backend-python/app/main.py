from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from supabase import create_client
from fastapi.middleware.cors import CORSMiddleware
import os

load_dotenv()
app = FastAPI(title="Learning-Platform AI")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite TODO en dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Message(BaseModel):
    message: str

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.post("/api/chat")
async def chat_ai(message: Message):
    response = client.chat.completions.create(
        model="qwen/qwen3-32b",
        messages=[{"role": "user", "content": message.message}],
        temperature=0.7
    )
    return {"response": response.choices[0].message.content}

@app.get("/docs")
async def docs():
    return {"docs": "Ve a http://localhost:8000/redoc o /docs"}



supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
class ChatRequest(BaseModel):
    message: str

@app.post("/chat-db")
async def chat_with_db(request: ChatRequest):
    message = request.message
    print(f"🔍 Buscando: '{message}'")
    
    # Búsqueda exacta/más resultados
    results = supabase.table("documents").select("*").ilike("content", f"%{message}%").limit(5).execute()
    
    if not results.data:
        return {"answer": f"No encontré '{message}' en documents. Agrega datos con INSERT.", "sources": []}
    
    # Muestra resultados DIRECTOS
    sources_text = "\n".join([f"📄 {r['title']}: {r['content'][:200]}..." for r in results.data])
    
    prompt = f"""Usuario busca en base de datos "documents": "{message}"

RESULTADOS ENCONTRADOS:
{sources_text}

Responde:
1. Cita EXACTAMENTE los textos relevantes
2. Si no exacto, di "No encontré coincidencia precisa"
3. Lista fuentes con títulos"""

    # Tu Qwen/Groq...
    response = client.chat.completions.create(
        model="qwen/qwen3-32b",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "answer": response.choices[0].message.content,
        "sources": results.data,  # Para debug
        "found": len(results.data)
    }

@app.get("/test-supabase")
def test_db():
    response = supabase.table("users").select("*").execute()  # ← Cambia "tu_tabla"
    if response.data:
        return {"tablas": response.data, "count": len(response.data)}
    return {"error": response.error, "data": []}

