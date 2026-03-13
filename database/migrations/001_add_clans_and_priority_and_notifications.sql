-- ============================================
-- MIGRATION: Agregar soporte para Clanes, Prioridades de Cards y Notificaciones
-- Fecha: Marzo 2026
-- Propósito: Habilitar las 6 Cards y el sistema de clanes
-- NOTA: Esta migración es idempotente (segura de correr múltiples veces).
-- ============================================

-- ============================================
-- 1. USERS: Agregar clan_id para diferenciar clanes (Turing, Tesla, McCarthy)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS clan_id VARCHAR(50);

-- Crear índice para búsquedas rápidas por clan (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_clan_id'
  ) THEN
    CREATE INDEX idx_users_clan_id ON users(clan_id);
  END IF;
END$$;

COMMENT ON COLUMN users.clan_id IS 'Identifica el clan del coder: Turing, Tesla, McCarthy. Permite al TL filtrar coders por clan.';

-- ============================================
-- 2. COMPLEMENTARY_PLANS: Crear ENUM para niveles de prioridad y agregar columna
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level_enum') THEN
    CREATE TYPE priority_level_enum AS ENUM ('low', 'medium', 'high');
  END IF;
END$$;

ALTER TABLE complementary_plans ADD COLUMN IF NOT EXISTS priority_level priority_level_enum DEFAULT 'medium';

-- Crear índice para consultas de prioridad (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'complementary_plans' AND indexname = 'idx_complementary_plans_priority'
  ) THEN
    CREATE INDEX idx_complementary_plans_priority ON complementary_plans(priority_level);
  END IF;
END$$;

COMMENT ON COLUMN complementary_plans.priority_level IS 'Nivel de prioridad de la card (high, medium, low). Usado para mostrar 2 High, 2 Medium, 2 Low en las 6 Cards.';

-- ============================================
-- 3. TL_FEEDBACK: Agregar is_read para el sistema de notificaciones
-- ============================================
ALTER TABLE tl_feedback ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Crear índices para búsquedas de notificaciones no leídas (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'tl_feedback' AND indexname = 'idx_tl_feedback_is_read'
  ) THEN
    CREATE INDEX idx_tl_feedback_is_read ON tl_feedback(is_read);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'tl_feedback' AND indexname = 'idx_tl_feedback_coder_unread'
  ) THEN
    CREATE INDEX idx_tl_feedback_coder_unread ON tl_feedback(coder_id, is_read);
  END IF;
END$$;

COMMENT ON COLUMN tl_feedback.is_read IS 'Indica si el feedback ha sido leído por el coder. false = punto rojo en la campana de notificaciones.';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
