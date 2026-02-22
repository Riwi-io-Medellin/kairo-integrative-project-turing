from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()
print("🔑 Claves cargadas OK")

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
print("✅ Cliente Supabase creado")

# Crea tabla documents (SIN rpc, directo SQL via supabase.sql)
try:
    supabase.rpc("execute_sql", {"query": """
        CREATE TABLE IF NOT EXISTS documents (
            id BIGSERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            title TEXT
        )
    """}).execute()
    print("📋 Tabla 'documents' lista")
except:
    print("⚠️  RPC SQL skip, crea manual")

# Inserta datos prueba
data = supabase.table("documents").insert([
    {"content": "KAIRO: Plataforma de aprendizaje con IA Qwen.", "title": "KAIRO IA"},
    {"content": "Desarrollo web fullstack con Supabase y Python.", "title": "Dev Stack"}
]).execute()

print("➕ Datos insertados:", data)

# LECTURA FINAL (lo importante)
results = supabase.table("documents").select("*").ilike("content", "%KAIRO%").limit(3).execute()
print("🎯 LECTURA OK:", len(results.data))
print("Datos encontrados:", results.data)
