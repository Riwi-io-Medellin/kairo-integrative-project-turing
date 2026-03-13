-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Proyecto: Ruta Formativa Personalizada con IA
-- Estas políticas definen quién puede acceder a qué datos
-- ============================================

-- ============================================
-- 1. USERS - Control de acceso a usuarios
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (id = auth.uid()::int);

-- Los Team Leaders pueden ver todos los usuarios (coders)
CREATE POLICY "users_select_tl"
ON users FOR SELECT
USING (
  auth.jwt()->>'role' = 'tl' 
  OR id = auth.uid()::int
);

-- Los usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (id = auth.uid()::int)
WITH CHECK (id = auth.uid()::int);

-- ============================================
-- 2. SOFT_SKILLS_ASSESSMENT - Evaluación de habilidades
-- ============================================

-- Los coders ven su propia evaluación
CREATE POLICY "soft_skills_select_own"
ON soft_skills_assessment FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven evaluaciones de todos los coders
CREATE POLICY "soft_skills_select_tl"
ON soft_skills_assessment FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Solo se pueden insertar/actualizar datos propios
CREATE POLICY "soft_skills_manage_own"
ON soft_skills_assessment FOR INSERT
WITH CHECK (coder_id = auth.uid()::int);

CREATE POLICY "soft_skills_update_own"
ON soft_skills_assessment FOR UPDATE
USING (coder_id = auth.uid()::int)
WITH CHECK (coder_id = auth.uid()::int);

-- ============================================
-- 3. MODULES - Módulos (lectura pública)
-- ============================================

-- Todos pueden leer módulos
CREATE POLICY "modules_select_all"
ON modules FOR SELECT
USING (true);

-- Solo TL pueden crear/modificar módulos
CREATE POLICY "modules_create_tl"
ON modules FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'tl');

CREATE POLICY "modules_update_tl"
ON modules FOR UPDATE
USING (auth.jwt()->>'role' = 'tl');

-- ============================================
-- 4. WEEKS - Semanas (lectura pública)
-- ============================================

-- Todos pueden leer semanas
CREATE POLICY "weeks_select_all"
ON weeks FOR SELECT
USING (true);

-- Solo TL pueden crear/modificar semanas
CREATE POLICY "weeks_create_tl"
ON weeks FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'tl');

CREATE POLICY "weeks_update_tl"
ON weeks FOR UPDATE
USING (auth.jwt()->>'role' = 'tl');

-- ============================================
-- 5. MOODLE_PROGRESS - Progreso académico
-- ============================================

-- Los coders ven su propio progreso
CREATE POLICY "moodle_progress_select_own"
ON moodle_progress FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven progreso de todos los coders
CREATE POLICY "moodle_progress_select_tl"
ON moodle_progress FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Los coders pueden actualizar su progreso
CREATE POLICY "moodle_progress_update_own"
ON moodle_progress FOR UPDATE
USING (coder_id = auth.uid()::int)
WITH CHECK (coder_id = auth.uid()::int);

CREATE POLICY "moodle_progress_insert_own"
ON moodle_progress FOR INSERT
WITH CHECK (coder_id = auth.uid()::int);

-- ============================================
-- 6. TOPICS - Temas (lectura pública)
-- ============================================

-- Todos pueden leer temas
CREATE POLICY "topics_select_all"
ON topics FOR SELECT
USING (true);

-- Solo TL pueden crear/modificar temas
CREATE POLICY "topics_create_tl"
ON topics FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'tl');

CREATE POLICY "topics_update_tl"
ON topics FOR UPDATE
USING (auth.jwt()->>'role' = 'tl');

-- ============================================
-- 7. CODER_STRUGGLING_TOPICS - Temas en los que lucha
-- ============================================

-- Los coders ven sus temas problemáticos
CREATE POLICY "struggling_topics_select_own"
ON coder_struggling_topics FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven temas problemáticos de todos
CREATE POLICY "struggling_topics_select_tl"
ON coder_struggling_topics FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Los coders pueden actualizar sus temas
CREATE POLICY "struggling_topics_manage_own"
ON coder_struggling_topics FOR INSERT
WITH CHECK (coder_id = auth.uid()::int);

CREATE POLICY "struggling_topics_delete_own"
ON coder_struggling_topics FOR DELETE
USING (coder_id = auth.uid()::int);

-- ============================================
-- 8. COMPLEMENTARY_PLANS - Planes personalizados
-- ============================================

-- Los coders ven sus propios planes
CREATE POLICY "complementary_plans_select_own"
ON complementary_plans FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven planes de todos los coders
CREATE POLICY "complementary_plans_select_tl"
ON complementary_plans FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Solo el TL puede crear planes
CREATE POLICY "complementary_plans_insert_tl"
ON complementary_plans FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'tl');

-- El TL puede actualizar planes
CREATE POLICY "complementary_plans_update_tl"
ON complementary_plans FOR UPDATE
USING (auth.jwt()->>'role' = 'tl');

-- ============================================
-- 9. PLAN_ACTIVITIES - Actividades del plan
-- ============================================

-- Los coders ven actividades de sus planes
CREATE POLICY "plan_activities_select_own"
ON plan_activities FOR SELECT
USING (
  plan_id IN (
    SELECT id FROM complementary_plans WHERE coder_id = auth.uid()::int
  )
);

-- Los TL ven todas las actividades
CREATE POLICY "plan_activities_select_tl"
ON plan_activities FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Solo TL puede crear/modificar actividades
CREATE POLICY "plan_activities_insert_tl"
ON plan_activities FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'tl');

CREATE POLICY "plan_activities_update_tl"
ON plan_activities FOR UPDATE
USING (auth.jwt()->>'role' = 'tl');

-- ============================================
-- 10. ACTIVITY_PROGRESS - Progreso de actividades
-- ============================================

-- Los coders ven su propio progreso en actividades
CREATE POLICY "activity_progress_select_own"
ON activity_progress FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven progreso de todos
CREATE POLICY "activity_progress_select_tl"
ON activity_progress FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Los coders pueden actualizar su progreso
CREATE POLICY "activity_progress_update_own"
ON activity_progress FOR UPDATE
USING (coder_id = auth.uid()::int)
WITH CHECK (coder_id = auth.uid()::int);

CREATE POLICY "activity_progress_insert_own"
ON activity_progress FOR INSERT
WITH CHECK (coder_id = auth.uid()::int);

-- ============================================
-- 11. TL_FEEDBACK - Retroalimentación
-- ============================================

-- Los coders ven feedback que reciben
CREATE POLICY "tl_feedback_select_own"
ON tl_feedback FOR SELECT
USING (coder_id = auth.uid()::int);

-- Los TL ven todos los feedback
CREATE POLICY "tl_feedback_select_tl"
ON tl_feedback FOR SELECT
USING (auth.jwt()->>'role' = 'tl');

-- Solo los TL pueden crear feedback
CREATE POLICY "tl_feedback_insert_tl"
ON tl_feedback FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'tl' 
  AND tl_id = auth.uid()::int
);

-- Los TL pueden actualizar su feedback
CREATE POLICY "tl_feedback_update_tl"
ON tl_feedback FOR UPDATE
USING (tl_id = auth.uid()::int)
WITH CHECK (tl_id = auth.uid()::int);

-- ============================================
-- Confirmación
-- ============================================
SELECT 'Todas las políticas de RLS han sido configuradas' AS status;
