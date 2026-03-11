# Endpoints Supabase - Guía Práctica

## ¿Cómo funcionan los endpoints en Supabase?

Con las **tablas + RLS + Políticas** que hemos creado, Supabase **automáticamente genera endpoints REST**. No necesitas escribir backend.

---

## Endpoints Generados por Tabla

### 1. **USERS** (Usuarios)
```
GET    /rest/v1/users           ← Leer usuarios
POST   /rest/v1/users           ← Crear usuario
PUT    /rest/v1/users           ← Actualizar usuario
DELETE /rest/v1/users           ← Eliminar usuario
```

**Ejemplo en Frontend:**
```javascript
// Leer usuario actual
const { data: user } = await supabase
  .from('users')
  .select('*')
  .single();

// Actualizar tu email
const { data } = await supabase
  .from('users')
  .update({ email: 'newemail@riwi.io' })
  .eq('id', userId)
  .select();
```

---

### 2. **SOFT_SKILLS_ASSESSMENT** (Evaluación de habilidades)
```
GET    /rest/v1/soft_skills_assessment
POST   /rest/v1/soft_skills_assessment
UPDATE /rest/v1/soft_skills_assessment
```

**Ejemplo:**
```javascript
// El coder ve su evaluación
const { data: assessment } = await supabase
  .from('soft_skills_assessment')
  .select('*')
  .eq('coder_id', currentUserId)
  .single();

// El TL ve evaluaciones de sus coders
const { data: assessments } = await supabase
  .from('soft_skills_assessment')
  .select('*');
```

---

### 3. **MODULES** (Módulos de aprendizaje)
```
GET /rest/v1/modules           ← Todos pueden leer
POST /rest/v1/modules          ← Solo TL puede crear
```

**Ejemplo:**
```javascript
// Obtener todos los módulos (público)
const { data: modules } = await supabase
  .from('modules')
  .select('*');

// Un TL crea un nuevo módulo
const { data } = await supabase
  .from('modules')
  .insert({
    name: 'React Avanzado',
    description: 'Conceptos avanzados de React',
    total_weeks: 4
  })
  .select();
```

---

### 4. **WEEKS** (Semanas del módulo)
```
GET /rest/v1/weeks
POST /rest/v1/weeks (solo TL)
```

**Ejemplo:**
```javascript
// Obtener semanas del módulo 1
const { data: weeks } = await supabase
  .from('weeks')
  .select('*')
  .eq('module_id', 1);
```

---

### 5. **MOODLE_PROGRESS** (Progreso académico)
```
GET /rest/v1/moodle_progress
POST /rest/v1/moodle_progress (create)
PUT /rest/v1/moodle_progress (update)
```

**Ejemplo:**
```javascript
// El coder ve su progreso
const { data: progress } = await supabase
  .from('moodle_progress')
  .select('*')
  .eq('coder_id', currentUserId)
  .eq('module_id', moduleId)
  .single();

// El TL ve progreso de todos sus coders
const { data: allProgress } = await supabase
  .from('moodle_progress')
  .select('*');

// Actualizar puntuación promedio
const { data } = await supabase
  .from('moodle_progress')
  .update({ average_score: 85.5 })
  .eq('id', progressId)
  .select();
```

---

### 6. **TOPICS** (Temas)
```
GET /rest/v1/topics
```

**Ejemplo:**
```javascript
const { data: topics } = await supabase
  .from('topics')
  .select('*')
  .eq('module_id', 1);
```

---

### 7. **CODER_STRUGGLING_TOPICS** (Temas con dificultad)
```
GET    /rest/v1/coder_struggling_topics
POST   /rest/v1/coder_struggling_topics
DELETE /rest/v1/coder_struggling_topics
```

**Ejemplo:**
```javascript
// Agregar un tema con dificultad
const { data } = await supabase
  .from('coder_struggling_topics')
  .insert({
    coder_id: currentUserId,
    topic_id: 5
  });

// Leer temas con dificultad del coder
const { data: struggles } = await supabase
  .from('coder_struggling_topics')
  .select(`
    *,
    topic:topics(name, category)
  `)
  .eq('coder_id', currentUserId);
```

---

### 8. **COMPLEMENTARY_PLANS** (Planes personalizados)
```
GET  /rest/v1/complementary_plans
POST /rest/v1/complementary_plans (solo TL)
PUT  /rest/v1/complementary_plans (solo TL)
```

**Ejemplo:**
```javascript
// El coder ve sus planes activos
const { data: plans } = await supabase
  .from('complementary_plans')
  .select('*')
  .eq('coder_id', currentUserId)
  .eq('is_active', true);

// El TL crea un plan para un coder
const { data } = await supabase
  .from('complementary_plans')
  .insert({
    coder_id: selectedCoderId,
    module_id: 4,
    week_number: 2,
    plan_content: 'Contenido del plan personalizado...',
    is_active: true
  })
  .select();
```

---

### 9. **PLAN_ACTIVITIES** (Actividades del plan)
```
GET  /rest/v1/plan_activities
POST /rest/v1/plan_activities (solo TL)
```

**Ejemplo:**
```javascript
// Obtener actividades de un plan
const { data: activities } = await supabase
  .from('plan_activities')
  .select('*')
  .eq('plan_id', planId)
  .order('day_number', { ascending: true });

// TL crea una actividad
const { data } = await supabase
  .from('plan_activities')
  .insert({
    plan_id: planId,
    day_number: 1,
    title: 'Introducción a Async/Await',
    description: 'Aprender concepto de programación asincrónica',
    estimated_time_minutes: 60,
    activity_type: 'guided',
    order_index: 1
  })
  .select();
```

---

### 10. **ACTIVITY_PROGRESS** (Progreso de actividades)
```
GET  /rest/v1/activity_progress
POST /rest/v1/activity_progress
PUT  /rest/v1/activity_progress
```

**Ejemplo:**
```javascript
// Marcar actividad como completada
const { data } = await supabase
  .from('activity_progress')
  .update({
    completed: true,
    completed_at: new Date(),
    reflection_text: 'Aprendí sobre async/await',
    time_spent_minutes: 45
  })
  .eq('activity_id', activityId)
  .eq('coder_id', currentUserId)
  .select();

// Ver progreso del coder
const { data: progress } = await supabase
  .from('activity_progress')
  .select('*')
  .eq('coder_id', currentUserId);
```

---

### 11. **TL_FEEDBACK** (Retroalimentación)
```
GET  /rest/v1/tl_feedback
POST /rest/v1/tl_feedback (solo TL)
PUT  /rest/v1/tl_feedback (solo TL)
```

**Ejemplo:**
```javascript
// El coder ve feedback que recibe
const { data: feedback } = await supabase
  .from('tl_feedback')
  .select(`
    *,
    tl_user:tl_id(email)
  `)
  .eq('coder_id', currentUserId)
  .order('created_at', { ascending: false });

// El TL envía feedback
const { data } = await supabase
  .from('tl_feedback')
  .insert({
    coder_id: selectedCoderId,
    tl_id: currentUserId,
    feedback_text: '¡Excelente trabajo en esta semana!',
    feedback_type: 'weekly'
  })
  .select();
```

---

## Consultas Avanzadas

### Joins (relaciones entre tablas)
```javascript
// Obtener módulo CON sus semanas
const { data } = await supabase
  .from('modules')
  .select(`
    *,
    weeks(*)
  `)
  .eq('id', 1);

// Obtener plan CON actividades Y progreso
const { data } = await supabase
  .from('complementary_plans')
  .select(`
    *,
    plan_activities(
      *,
      activity_progress(*)
    )
  `)
  .eq('id', planId);
```

### Filtros
```javascript
// Mayor que
.gt('average_score', 70)

// Menor que
.lt('average_score', 50)

// Igual a
.eq('is_active', true)

// En rango
.gte('average_score', 70)
.lte('average_score', 100)

// IN (múltiples valores)
.in('module_id', [1, 2, 3])

// Búsqueda de texto
.like('name', '%Python%')

// Orden
.order('created_at', { ascending: false })

// Límite
.limit(10)

// Offset (para paginación)
.range(0, 9)
```

---

## Estructura de Respuesta

**Éxito:**
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*');

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Datos:', data);
}
```

**Respuesta típica:**
```json
{
  "id": 1,
  "email": "coder.juan@riwi.io",
  "role": "coder",
  "created_at": "2026-02-20T10:30:00Z"
}
```

---

## Pasos para usar en tu aplicación

### 1. Instalar cliente Supabase en Frontend
```bash
npm install @supabase/supabase-js
```

### 2. Inicializar cliente
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu-public-key'
);
```

### 3. Usar en tus componentes
```javascript
// En un componente React
useEffect(() => {
  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*');
    
    if (error) console.error(error);
    else setModules(data);
  };
  
  fetchModules();
}, []);
```

---

## Lo que NO tienes que hacer

✗ ~~Crear rutas manualmente (GET /api/modules, POST /api/users, etc.)~~  
✗ ~~Escribir controladores~~ ✗ ~~Crear servicios REST~~

---

## Lo que YA hiciste

✓ Crear tablas ✓ Habilitar RLS
✓ Crear políticas de seguridad

**¿Eso es todo!** Supabase hace el resto. 🚀

---

**Próximos pasos:**
1. Subir `schema.sql` + `rls_policies.sql` a Supabase
2. Los endpoints están listos automáticamente
3. Usa el cliente de Supabase en tu frontend
