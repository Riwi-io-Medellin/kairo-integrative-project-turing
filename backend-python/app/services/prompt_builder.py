from app.models.plan_request import GeneratePlanRequest

def build_personalized_prompt(request: GeneratePlanRequest) -> str:
    """
<<<<<<< HEAD
    Construye un prompt personalizado basado en los datos del coder
    """
    
    # Analizar cuál es la habilidad más débil
=======
    Constructs a highly detailed prompt for the LLM to generate a custom 
    4-week learning roadmap based on student performance and soft skills.
    """
    
    # Identify the primary soft skill gap to focus the roadmap's non-technical side
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
    skills = {
        "autonomy": request.soft_skills.autonomy,
        "time_management": request.soft_skills.time_management,
        "problem_solving": request.soft_skills.problem_solving,
        "communication": request.soft_skills.communication,
        "teamwork": request.soft_skills.teamwork
    }
    
    weakest_skill = min(skills, key=skills.get)
    weakest_score = skills[weakest_skill]
    
<<<<<<< HEAD
    # Construir el prompt
    prompt = f"""Eres un experto diseñador de currículos educativos para bootcamps de desarrollo de software.

PERFIL DEL ESTUDIANTE:
- Nombre: {request.coder.full_name}
- Estilo de aprendizaje: {request.soft_skills.learning_style}
- Módulo actual: {request.moodle_status.module_number}
- Semana actual: {request.moodle_status.current_week}

EVALUACIÓN DE HABILIDADES BLANDAS (Escala 1-5):
- Autonomía: {request.soft_skills.autonomy}/5
- Gestión del tiempo: {request.soft_skills.time_management}/5
- Resolución de problemas: {request.soft_skills.problem_solving}/5
- Comunicación: {request.soft_skills.communication}/5
- Trabajo en equipo: {request.soft_skills.teamwork}/5

ÁREA MÁS DÉBIL: {weakest_skill.replace('_', ' ').title()} ({weakest_score}/5)

DIFICULTADES TÉCNICAS:
{', '.join(request.moodle_status.struggling_topics) if request.moodle_status.struggling_topics else 'Ninguna reportada'}

INTERESES ADICIONALES:
{', '.join(request.additional_topics) if request.additional_topics else 'Ninguno'}

TAREA:
Crea un plan de aprendizaje personalizado de 4 semanas que:
1. Aborde las debilidades técnicas mencionadas
2. Desarrolle la habilidad blanda más débil a través de ejercicios prácticos
3. Se adapte al estilo de aprendizaje del estudiante ({request.soft_skills.learning_style})
4. Incluya actividades diarias (30-45 min técnicas + 15-20 min habilidad blanda)

CRÍTICO: Debes responder SOLO con JSON válido en este formato exacto (sin texto adicional):
=======
    # Technical blockers formatting
    tech_blockers = ", ".join(request.moodle_status.struggling_topics) if request.moodle_status.struggling_topics else "None reported"
    interests = ", ".join(request.additional_topics) if request.additional_topics else "General Web Development"

    # Construct the Professional Prompt using Delimiters (###) for better LLM parsing
    prompt = f"""
### ROLE
You are a Senior Educational Architect at Riwi, a high-performance tech bootcamp. Your goal is to design a personalized 4-week "Path to Success" for a Coder.

### STUDENT PROFILE
- Coder Name: {request.coder.full_name}
- Learning Style: {request.soft_skills.learning_style}
- Current Module: {request.moodle_status.module_number} (Week {request.moodle_status.current_week})

### ASSESSMENT DATA
- Soft Skill Scores (1-5): {skills}
- Critical Focus Area: {weakest_skill.replace('_', ' ').upper()} (Score: {weakest_score}/5)
- Technical Blockers: {tech_blockers}
- Career Interests: {interests}

### INSTRUCTIONS
1. Create a 4-week roadmap (5 days per week = 20 days total).
2. For each day, provide a Technical Activity (45 min) and a Soft Skill Activity (20 min).
3. The Technical Activities must directly address the 'Technical Blockers'.
4. The Soft Skill Activities must follow a progression to improve the 'Critical Focus Area'.
5. Use a tone that is encouraging, professional, and aligned with the learning style: {request.soft_skills.learning_style}.

### OUTPUT SCHEMA (STRICT JSON ONLY)
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
{{
  "weeks": [
    {{
      "week_number": 1,
<<<<<<< HEAD
      "focus": "Descripción breve del objetivo principal de la semana",
=======
      "focus": "Weekly theme string",
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
      "days": [
        {{
          "day": 1,
          "technical_activity": {{
<<<<<<< HEAD
            "title": "Nombre de la actividad",
            "description": "Pasos detallados a seguir",
            "duration_minutes": 45,
            "difficulty": "beginner",
            "resources": ["recurso1", "recurso2"]
          }},
          "soft_skill_activity": {{
            "title": "Nombre de la actividad",
            "skill": "{weakest_skill}",
            "description": "Ejercicio práctico específico",
            "duration_minutes": 20,
            "reflection_prompt": "¿Qué aprendiste hoy?"
=======
            "title": "String",
            "description": "Actionable steps",
            "duration_minutes": 45,
            "difficulty": "beginner|intermediate|advanced",
            "resources": ["URL or Book Title"]
          }},
          "soft_skill_activity": {{
            "title": "String",
            "skill": "{weakest_skill}",
            "description": "Practical exercise",
            "duration_minutes": 20,
            "reflection_prompt": "Open question for the coder"
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
          }}
        }}
      ]
    }}
  ]
}}

<<<<<<< HEAD
IMPORTANTE: El plan debe tener 4 semanas completas, cada semana con 5 días (lunes a viernes), generando un total de 20 días de actividades.

Genera el plan ahora:"""
=======
### FINAL MANDATE
- Language: Responses must be in Spanish (to match the user's interface).
- No talk: Do not include anything outside the JSON brackets.
- Consistency: Ensure all 20 days are generated.

BEGIN GENERATION:"""
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
    
    return prompt