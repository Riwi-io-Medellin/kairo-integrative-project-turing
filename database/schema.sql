-- ============================================
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- BASE DE DATOS SIMPLIFICADA
-- Proyecto: Ruta Formativa Personalizada con IA
-- Motor: PostgreSQL 12+
-- Versión: 2.1 - MÍNIMA Y EFECTIVA (CORREGIDA)
-- Fecha: Febrero 2026
-- ============================================

--  EJECUTAR PRIMERO EN LÍNEA DE COMANDOS O COMO SCRIPT SEPARADO:
-- dropdb ruta_formativa_ia;
-- createdb ruta_formativa_ia;
-- Luego ejecuta este archivo con: psql ruta_formativa_ia -f tables_pi_postgresql.sql

-- Crear tipos ENUM
<<<<<<< HEAD
=======
=======
-- RIWI LEARNING PLATFORM - DATABASE SCHEMA
-- Motor: PostgreSQL 14+ (Supabase)
-- Versión: 3.0 - CONSOLIDADA Y COMPLETA
-- Fecha: Febrero 2026
-- ============================================

-- Limpiar base de datos
DROP TABLE IF EXISTS ai_generation_log CASCADE;
DROP TABLE IF EXISTS ai_reports CASCADE;
DROP TABLE IF EXISTS risk_flags CASCADE;
DROP TABLE IF EXISTS evidence_submissions CASCADE;
DROP TABLE IF EXISTS tl_feedback CASCADE;
DROP TABLE IF EXISTS activity_progress CASCADE;
DROP TABLE IF EXISTS plan_activities CASCADE;
DROP TABLE IF EXISTS complementary_plans CASCADE;
DROP TABLE IF EXISTS coder_struggling_topics CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS moodle_progress CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS soft_skills_assessment CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Limpiar ENUMs
DROP TYPE IF EXISTS ai_agent_enum CASCADE;
DROP TYPE IF EXISTS report_target_enum CASCADE;
DROP TYPE IF EXISTS risk_level_enum CASCADE;
DROP TYPE IF EXISTS feedback_type_enum CASCADE;
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS learning_style_enum CASCADE;
DROP TYPE IF EXISTS role_enum CASCADE;

-- ============================================
-- CREAR ENUMS
-- ============================================

>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
CREATE TYPE role_enum AS ENUM ('coder', 'tl');
CREATE TYPE learning_style_enum AS ENUM ('visual', 'auditory', 'kinesthetic');
CREATE TYPE activity_type_enum AS ENUM ('guided', 'semi_guided', 'autonomous');
CREATE TYPE feedback_type_enum AS ENUM ('weekly', 'activity', 'general');

-- ============================================
-- 1. USERS (Usuarios)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

<<<<<<< HEAD
=======
<<<<<<< HEAD
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
=======
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Usuarios del sistema (coders y team leaders)';
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6

>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
-- 2. SOFT_SKILLS_ASSESSMENT (Diagnóstico)
-- ============================================
CREATE TABLE soft_skills_assessment (
    id SERIAL PRIMARY KEY,
    coder_id INT NOT NULL UNIQUE,
    autonomy INT NOT NULL CHECK (autonomy BETWEEN 1 AND 5),
    time_management INT NOT NULL CHECK (time_management BETWEEN 1 AND 5),
    problem_solving INT NOT NULL CHECK (problem_solving BETWEEN 1 AND 5),
    communication INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    teamwork INT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
    learning_style learning_style_enum NOT NULL,
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE
);

<<<<<<< HEAD
=======
<<<<<<< HEAD
ALTER TABLE soft_skills_assessment ENABLE ROW LEVEL SECURITY;
=======
CREATE INDEX idx_soft_skills_coder ON soft_skills_assessment(coder_id);

COMMENT ON TABLE soft_skills_assessment IS 'Evaluación de habilidades blandas de los coders';
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6

>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
-- 3. MODULES (Módulos)
-- ============================================
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_weeks INT NOT NULL
);

<<<<<<< HEAD
=======
<<<<<<< HEAD
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
-- 4. WEEKS (Semanas) 
-- ============================================
CREATE TABLE weeks (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL,
    week_number INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE (module_id, week_number),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. MOODLE_PROGRESS (Progreso académico)
<<<<<<< HEAD
=======
=======
COMMENT ON TABLE modules IS 'Módulos académicos del bootcamp';

-- ============================================
-- 4. MOODLE_PROGRESS
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE moodle_progress (
    id SERIAL PRIMARY KEY,
    coder_id INT NOT NULL,
    module_id INT NOT NULL,
    current_week INT NOT NULL,
    average_score DECIMAL(5,2) DEFAULT 0,
    struggling_topics TEXT[] DEFAULT '{}', -- ⬅️ AGREGADO
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (coder_id, module_id),
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

<<<<<<< HEAD
CREATE INDEX idx_score ON moodle_progress(average_score);

-- ============================================
-- 6. TOPICS (Temas)
=======
<<<<<<< HEAD
ALTER TABLE moodle_progress ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_score ON moodle_progress(average_score);

-- ============================================
-- 6. TOPICS (Temas)
=======
CREATE INDEX idx_moodle_coder ON moodle_progress(coder_id);
CREATE INDEX idx_moodle_score ON moodle_progress(average_score);

COMMENT ON TABLE moodle_progress IS 'Progreso académico de los coders (simulación Moodle)';

-- ============================================
-- 5. TOPICS
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    module_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

<<<<<<< HEAD
CREATE INDEX idx_category ON topics(category);
=======
<<<<<<< HEAD
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_category ON topics(category);
=======
CREATE INDEX idx_topics_module ON topics(module_id);
CREATE INDEX idx_topics_category ON topics(category);

COMMENT ON TABLE topics IS 'Temas específicos dentro de cada módulo';
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965

-- ============================================
-- 7. CODER_STRUGGLING_TOPICS (Relación N:M)
-- ============================================
CREATE TABLE coder_struggling_topics (
    id SERIAL PRIMARY KEY,
    coder_id INT NOT NULL,
    topic_id INT NOT NULL,
    UNIQUE (coder_id, topic_id),
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

<<<<<<< HEAD
-- ============================================
-- 8. COMPLEMENTARY_PLANS (Planes personalizados)
=======
<<<<<<< HEAD
ALTER TABLE coder_struggling_topics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. COMPLEMENTARY_PLANS (Planes personalizados)
=======
CREATE INDEX idx_struggling_coder ON coder_struggling_topics(coder_id);

COMMENT ON TABLE coder_struggling_topics IS 'Temas con los que los coders tienen dificultades';

-- ============================================
-- 7. COMPLEMENTARY_PLANS (Planes generados por IA)
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE complementary_plans (
    id SERIAL PRIMARY KEY,
    coder_id INT NOT NULL,
    module_id INT NOT NULL,
<<<<<<< HEAD
    week_number INT NOT NULL, 
    plan_content TEXT NOT NULL,
=======
<<<<<<< HEAD
    week_number INT NOT NULL, 
    plan_content TEXT NOT NULL,
=======
    plan_content JSONB NOT NULL,  -- ✅ JSON generado por la IA
    soft_skills_snapshot JSONB,   -- ✅ Snapshot de soft skills al momento de generar
    moodle_status_snapshot JSONB, -- ✅ Snapshot de estado Moodle
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

<<<<<<< HEAD
CREATE INDEX idx_active ON complementary_plans(is_active);

-- ============================================
-- 9. PLAN_ACTIVITIES (Actividades)
=======
<<<<<<< HEAD
ALTER TABLE complementary_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_active ON complementary_plans(is_active);

-- ============================================
-- 9. PLAN_ACTIVITIES (Actividades)
=======
CREATE INDEX idx_plans_coder ON complementary_plans(coder_id);
CREATE INDEX idx_plans_active ON complementary_plans(is_active);

COMMENT ON TABLE complementary_plans IS 'Planes de estudio personalizados generados por IA';

-- ============================================
-- 8. PLAN_ACTIVITIES
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE plan_activities (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    day_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_time_minutes INT,
    activity_type activity_type_enum,
<<<<<<< HEAD
    order_index INT NOT NULL, 
=======
<<<<<<< HEAD
    order_index INT NOT NULL, 
    FOREIGN KEY (plan_id) REFERENCES complementary_plans(id) ON DELETE CASCADE
);

ALTER TABLE plan_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_plan ON plan_activities(plan_id);

-- ============================================
-- 10. ACTIVITY_PROGRESS (Progreso de actividades)
=======
    skill_focus VARCHAR(100),  -- ✅ Para actividades de soft skills
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
    FOREIGN KEY (plan_id) REFERENCES complementary_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_plan ON plan_activities(plan_id);

-- ============================================
<<<<<<< HEAD
-- 10. ACTIVITY_PROGRESS (Progreso de actividades)
=======
-- 9. ACTIVITY_PROGRESS
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE activity_progress (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL,
    coder_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    reflection_text TEXT,
    time_spent_minutes INT,
    completed_at TIMESTAMP NULL,
    UNIQUE (activity_id, coder_id),
    FOREIGN KEY (activity_id) REFERENCES plan_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE
);

<<<<<<< HEAD
CREATE INDEX idx_completed ON activity_progress(completed);

-- ============================================
-- 11. TL_FEEDBACK (Retroalimentación)
=======
<<<<<<< HEAD
ALTER TABLE activity_progress ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_completed ON activity_progress(completed);

-- ============================================
-- 11. TL_FEEDBACK (Retroalimentación)
=======
CREATE INDEX idx_progress_activity ON activity_progress(activity_id);
CREATE INDEX idx_progress_coder ON activity_progress(coder_id);
CREATE INDEX idx_progress_completed ON activity_progress(completed);

COMMENT ON TABLE activity_progress IS 'Seguimiento del progreso de actividades por coder';

-- ============================================
-- 10. EVIDENCE_SUBMISSIONS (✅ NUEVO)
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
-- ============================================
CREATE TABLE tl_feedback (
    id SERIAL PRIMARY KEY,
    coder_id INT NOT NULL,
    tl_id INT NOT NULL,
    feedback_text TEXT NOT NULL,
    feedback_type feedback_type_enum,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coder_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tl_id) REFERENCES users(id) ON DELETE CASCADE
);

<<<<<<< HEAD
CREATE INDEX idx_coder ON tl_feedback(coder_id);
CREATE INDEX idx_tl ON tl_feedback(tl_id);
=======
<<<<<<< HEAD
ALTER TABLE tl_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_coder ON tl_feedback(coder_id);
CREATE INDEX idx_tl ON tl_feedback(tl_id);
=======
CREATE INDEX idx_feedback_coder ON tl_feedback(coder_id);
CREATE INDEX idx_feedback_tl ON tl_feedback(tl_id);

COMMENT ON TABLE tl_feedback IS 'Retroalimentación de Team Leaders a coders';
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965

-- ============================================
-- VISTAS
-- ============================================

CREATE VIEW v_coder_dashboard AS
SELECT 
    u.id,
    u.email,
    ssa.autonomy,
    ssa.learning_style,
    m.name AS module_name,
    mp.average_score,
    COUNT(DISTINCT pa.id) AS total_activities,
    SUM(CASE WHEN ap.completed = TRUE THEN 1 ELSE 0 END) AS completed_activities
FROM users u
LEFT JOIN soft_skills_assessment ssa ON u.id = ssa.coder_id
LEFT JOIN moodle_progress mp ON u.id = mp.coder_id
LEFT JOIN modules m ON mp.module_id = m.id
LEFT JOIN complementary_plans cp ON u.id = cp.coder_id AND cp.is_active = TRUE
LEFT JOIN plan_activities pa ON cp.id = pa.plan_id
LEFT JOIN activity_progress ap ON pa.id = ap.activity_id AND ap.coder_id = u.id
WHERE u.role = 'coder'
GROUP BY u.id, u.email, ssa.autonomy, ssa.learning_style, m.name, mp.average_score;

CREATE VIEW v_coder_risk_analysis AS
SELECT 
    u.id,
    u.email,
    ssa.autonomy,
    mp.average_score,
    CASE 
        WHEN ssa.autonomy <= 2 AND mp.average_score < 70 THEN 'HIGH_RISK'
        WHEN ssa.autonomy <= 2 OR mp.average_score < 70 THEN 'MEDIUM_RISK'
        ELSE 'LOW_RISK'
    END AS risk_level
FROM users u
LEFT JOIN soft_skills_assessment ssa ON u.id = ssa.coder_id
LEFT JOIN moodle_progress mp ON u.id = mp.coder_id
WHERE u.role = 'coder'
ORDER BY risk_level DESC, mp.average_score ASC;

-- ============================================
-- Confirmación
-- ============================================
<<<<<<< HEAD
SELECT ' Base de datos (esquema) configurada correctamente' AS status;
SELECT COUNT(*) AS number_of_tables FROM information_schema.tables 
=======
<<<<<<< HEAD
SELECT ' Base de datos (esquema) configurada correctamente' AS status;
SELECT COUNT(*) AS number_of_tables FROM information_schema.tables 
=======

SELECT '✅ Schema consolidado creado correctamente' AS status;
SELECT COUNT(*) AS total_tables 
FROM information_schema.tables 
>>>>>>> f01f3b0882bfbaca9cd0e1a605973cf0aa353fa6
>>>>>>> b228e6cee3a901865302bd0a6ccf1d6853b09965
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';