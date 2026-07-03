-- Liga core.profiles ao auth.users do Supabase e cria o profile
-- automaticamente a cada novo cadastro (mesmo padrão do app Flutter legado,
-- só que aqui todo usuário autenticado enxerga os mesmos dados da empresa).

ALTER TABLE "core"."profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
--> statement-breakpoint

-- O primeiro usuário a se cadastrar vira admin automaticamente; os demais
-- entram como operador (um admin promove depois em /settings). O e-mail é
-- espelhado de auth.users para não depender da service_role key na UI.
CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  INSERT INTO core.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    CASE WHEN EXISTS (SELECT 1 FROM core.profiles) THEN 'operador' ELSE 'admin' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created_core_profile ON auth.users;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created_core_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();
--> statement-breakpoint

-- Garante que sempre exista exatamente uma linha de configurações.
INSERT INTO "core"."settings" DEFAULT VALUES;
--> statement-breakpoint

-- Backfill: usuários que já existiam em auth.users ANTES desta migration
-- (ex.: contas criadas pelo app Flutter legado no mesmo projeto Supabase)
-- nunca disparam o trigger acima, então ficariam sem linha em core.profiles.
-- O mais antigo vira admin (só se core.profiles ainda estiver vazio), os
-- demais entram como operador — mesma regra do trigger.
WITH ordered AS (
  SELECT u.id, u.raw_user_meta_data, u.email, u.created_at,
         ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM core.profiles p WHERE p.id = u.id)
)
INSERT INTO core.profiles (id, name, email, role)
SELECT
  o.id,
  COALESCE(o.raw_user_meta_data->>'name', ''),
  COALESCE(o.email, ''),
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM core.profiles) AND o.rn = 1 THEN 'admin'
    ELSE 'operador'
  END
FROM ordered o
ON CONFLICT (id) DO NOTHING;