-- ============================================================
-- REFERÊNCIA — schema do app Flutter legado (schema "public")
-- ============================================================
-- Cópia congelada de 3d_printer_order/supabase/schema.sql, só para consulta
-- ao escrever o script de migração public.* -> core/crm/catalog/sales.* no
-- futuro. NÃO rodar este arquivo aqui — o schema "public" já existe no
-- Supabase e não é gerenciado pelo Drizzle deste projeto.
--
-- Mapeamento aproximado para o schema novo:
--   public.clients          -> crm.clients
--   public.printers         -> catalog.printers
--   public.filaments        -> catalog.filaments (id vira o UUID de link do .3mf)
--   public.consumables      -> catalog.consumables
--   public.quotes           -> sales.quotes (filament_items/consumable_items/
--                              plate_items em JSONB viram linhas em
--                              sales.quote_filament_items/quote_consumable_items/
--                              quote_plate_items)
--   public.settings         -> core.settings (era por usuário; vira 1 linha
--                              única da empresa — decidir de qual usuário herdar)
--   public.profiles         -> core.profiles (mesmo id de auth.users)
-- ============================================================

-- ============================================================
-- F&E 3D — Schema Supabase (original)
-- Cole este arquivo no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/tvslqymmwfiwprimtmqf/sql
-- ============================================================

-- ── profiles (espelho do auth.users) ─────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'Operador',
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cria o perfil automaticamente ao registrar novo usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'Operador')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ── clients ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── printers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS printers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  diameter_mm        DOUBLE PRECISION NOT NULL DEFAULT 1.75,
  price              DOUBLE PRECISION NOT NULL DEFAULT 0,
  depreciation_hours DOUBLE PRECISION NOT NULL DEFAULT 5000,
  service_cost       DOUBLE PRECISION NOT NULL DEFAULT 0,
  energy_kwh         DOUBLE PRECISION NOT NULL DEFAULT 0.12,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── filaments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS filaments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  diameter_mm DOUBLE PRECISION NOT NULL DEFAULT 1.75,
  price       DOUBLE PRECISION NOT NULL DEFAULT 0,
  weight_kg   DOUBLE PRECISION NOT NULL DEFAULT 1,
  density     DOUBLE PRECISION NOT NULL DEFAULT 1.24,
  nozzle_temp DOUBLE PRECISION NOT NULL DEFAULT 210,
  bed_temp    DOUBLE PRECISION NOT NULL DEFAULT 60,
  length_m    DOUBLE PRECISION NOT NULL DEFAULT 330,
  color       TEXT,
  remaining_weight_g DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Caso a tabela já exista de uma versão anterior do schema:
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS remaining_weight_g DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ── settings (uma linha por usuário) ─────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_cost_per_kwh   DOUBLE PRECISION NOT NULL DEFAULT 0.9,
  labor_cost_per_hour   DOUBLE PRECISION NOT NULL DEFAULT 30,
  failure_rate_percent  DOUBLE PRECISION NOT NULL DEFAULT 15,
  currency              TEXT NOT NULL DEFAULT 'R$'
);

-- ── consumables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  unit_price   DOUBLE PRECISION NOT NULL DEFAULT 0,
  quantity     DOUBLE PRECISION NOT NULL DEFAULT 0,
  description  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── quotes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id            UUID,
  client_name          TEXT,
  assigned_user_name   TEXT,
  printer_id           UUID NOT NULL,
  printer_name         TEXT NOT NULL,
  filament_id          UUID NOT NULL,
  filament_name        TEXT NOT NULL,
  description          TEXT NOT NULL,
  weight_g             DOUBLE PRECISION NOT NULL DEFAULT 0,
  print_time_h         DOUBLE PRECISION NOT NULL DEFAULT 0,
  prep_time_min        DOUBLE PRECISION NOT NULL DEFAULT 0,
  slicing_time_min     DOUBLE PRECISION NOT NULL DEFAULT 0,
  material_change_min  DOUBLE PRECISION NOT NULL DEFAULT 0,
  transfer_start_min   DOUBLE PRECISION NOT NULL DEFAULT 0,
  removal_min          DOUBLE PRECISION NOT NULL DEFAULT 0,
  support_removal_min  DOUBLE PRECISION NOT NULL DEFAULT 0,
  additional_work_min  DOUBLE PRECISION NOT NULL DEFAULT 0,
  consumables          DOUBLE PRECISION NOT NULL DEFAULT 0,
  markup_percent       DOUBLE PRECISION NOT NULL DEFAULT 100,
  real_price           DOUBLE PRECISION NOT NULL DEFAULT 0,
  quantity             INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'draft',
  filament_items       JSONB,
  consumable_items     JSONB,
  plate_items          JSONB,
  thumbnail            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Caso a tabela já exista de uma versão anterior do schema:
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS plate_items JSONB;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE filaments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumables ENABLE ROW LEVEL SECURITY;

-- profiles: todos autenticados veem todos os perfis, editam só o seu
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- clients
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- printers
CREATE POLICY "printers_select" ON printers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "printers_insert" ON printers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "printers_update" ON printers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "printers_delete" ON printers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- filaments
CREATE POLICY "filaments_select" ON filaments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "filaments_insert" ON filaments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "filaments_update" ON filaments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "filaments_delete" ON filaments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- settings
CREATE POLICY "settings_select" ON settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_insert" ON settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update" ON settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_delete" ON settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- quotes
CREATE POLICY "quotes_select" ON quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "quotes_insert" ON quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quotes_update" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "quotes_delete" ON quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- consumables
CREATE POLICY "consumables_select" ON consumables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "consumables_insert" ON consumables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consumables_update" ON consumables FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "consumables_delete" ON consumables FOR DELETE TO authenticated USING (auth.uid() = user_id);
