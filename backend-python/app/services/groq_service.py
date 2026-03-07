import os
import json
<<<<<<< HEAD
from typing import Dict
=======
import logging
from typing import Dict, Any, Optional
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
from dotenv import load_dotenv
from groq import Groq
from app.models.plan_request import GeneratePlanRequest
from app.services.prompt_builder import build_personalized_prompt

<<<<<<< HEAD
load_dotenv()

# Configuración de Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "qwen-2.5-32b-instruct")

async def generate_plan_with_groq(request: GeneratePlanRequest) -> Dict:
    """
    Genera un plan personalizado usando Groq con Qwen2.5-32B
    
    Args:
        request: Datos completos del coder
    
    Returns:
        Dict con el plan de 4 semanas
    """
    
    try:
        # 1. Construir el prompt
        prompt = build_personalized_prompt(request)
        
        # 2. Llamar a Groq
=======
# Configure logging to track service behavior and errors
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# MODEL SELECTION: Upgrading to Llama 3.3 70B for superior reasoning and JSON compliance
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")

async def generate_plan_with_groq(request: GeneratePlanRequest) -> Dict[str, Any]:
    """
    Orchestrates the personalized learning path generation process using Llama 3.3 70B.
    """
    try:
        # 1. Build the high-context prompt
        prompt = build_personalized_prompt(request)
        
        # 2. Execute inference with Llama-specific optimizations
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
        chat_completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
<<<<<<< HEAD
                    "content": "Eres un experto diseñador de currículos educativos. Respondes SOLO con JSON válido, sin texto adicional."
=======
                    "content": (
                        "You are a Senior Educational Architect at Riwi. "
                        "Your mission is to generate a detailed 4-week learning roadmap. "
                        "STRICT RULES:\n"
                        "- Output ONLY a valid JSON object.\n"
                        "- No conversational filler, no markdown code blocks (```json), no <think> tags.\n"
                        "- Ensure technical activities strictly address the student's weaknesses."
                    )
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
<<<<<<< HEAD
            temperature=0.7,
            max_tokens=4000,
            top_p=0.9,
        )
        
        # 3. Extraer respuesta
        generated_text = chat_completion.choices[0].message.content
        
        # 4. Parsear JSON de la respuesta
        plan = extract_json_from_text(generated_text)
        
        if not plan:
            # Si la IA no devolvió JSON válido, usar plan por defecto
            print("⚠️ IA no generó JSON válido, usando plan por defecto")
            return get_default_plan(request)
        
        return plan
        
    except Exception as e:
        print(f"❌ Error en Groq: {str(e)}")
        # Retornar plan por defecto en caso de error
        return get_default_plan(request)


def extract_json_from_text(text: str) -> Dict:
    """
    Extrae JSON válido de la respuesta de la IA
    
    A veces la IA devuelve texto + JSON, esta función lo limpia
    """
    try:
        # Intentar parsear directamente
        return json.loads(text)
    except:
        # Buscar JSON en el texto
        start = text.find('{')
        end = text.rfind('}') + 1
        
        if start != -1 and end != 0:
            try:
                json_str = text[start:end]
                return json.loads(json_str)
            except:
                pass
    
    return None


def get_default_plan(request: GeneratePlanRequest) -> Dict:
    """
    Plan de respaldo si la IA falla
    """
    weakest_skill = min(
        [
            ("autonomy", request.soft_skills.autonomy),
            ("time_management", request.soft_skills.time_management),
            ("problem_solving", request.soft_skills.problem_solving),
        ],
        key=lambda x: x[1]
    )[0]
    
    return {
        "weeks": [
            {
                "week_number": 1,
                "focus": "Fundamentos y nivelación",
                "days": [
                    {
                        "day": 1,
                        "technical_activity": {
                            "title": "Repaso de conceptos básicos",
                            "description": f"Revisar los temas: {', '.join(request.moodle_status.struggling_topics[:3]) if request.moodle_status.struggling_topics else 'fundamentos de programación'}",
                            "duration_minutes": 45,
                            "difficulty": "beginner",
                            "resources": ["Documentación oficial", "Tutoriales interactivos"]
                        },
                        "soft_skill_activity": {
                            "title": "Planificación diaria",
                            "skill": weakest_skill,
                            "description": "Crear un cronograma de estudio para la semana",
                            "duration_minutes": 20,
                            "reflection_prompt": "¿Qué obstáculos identificaste al planificar?"
                        }
                    }
                ]
            }
        ]
=======
            temperature=0.3, # Slightly higher than 0.2 to allow better pedagogical connections but keep it stable
            max_tokens=6000, # Increased for 70B models to ensure the 20-day JSON isn't cut off
            top_p=0.9,
            response_format={"type": "json_object"} # Native JSON enforcement
        )
        
        raw_content = chat_completion.choices[0].message.content
        
        # 3. Validation logic
        plan = extract_and_validate_json(raw_content)
        
        if not plan:
            logger.warning(f"Llama 70B failed JSON validation for user {request.coder_id}. Using fallback.")
            return get_default_plan(request)
            
        logger.info(f"Roadmap successfully generated using Llama 3.3 70B for user {request.coder_id}")
        return plan
        
    except Exception as e:
        logger.error(f"Critical failure in Groq Service (Llama 70B): {str(e)}")
        return get_default_plan(request)

def extract_and_validate_json(text: str) -> Optional[Dict[str, Any]]:
    """Parses raw LLM output into a Python dictionary, cleaning common noise."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != 0:
                return json.loads(text[start:end])
        except Exception:
            return None
    return None

def get_default_plan(request: GeneratePlanRequest) -> Dict[str, Any]:
    """Safety net based on the weakest identified soft skill."""
    skill_map = {
        "autonomy": request.soft_skills.autonomy,
        "time_management": request.soft_skills.time_management,
        "problem_solving": request.soft_skills.problem_solving
    }
    main_weakness = min(skill_map, key=skill_map.get)

    return {
        "status": "fallback",
        "weeks": [{
            "week_number": 1,
            "focus": "Core Technical Debt Review",
            "days": [{
                "day": 1,
                "technical_activity": {
                    "title": "Foundational Concepts Reinforcement",
                    "description": "Reviewing recent blockers and documentation.",
                    "duration_minutes": 60,
                    "resources": ["Internal Knowledge Base"]
                },
                "soft_skill_activity": {
                    "title": "Time Management Reflection",
                    "skill": main_weakness,
                    "description": "Self-assessment of learning speed.",
                    "duration_minutes": 30
                }
            }]
        }]
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
    }