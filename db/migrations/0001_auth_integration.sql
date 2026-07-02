-- Liga core.profiles ao auth.users do Supabase e cria o profile
-- automaticamente a cada novo cadastro (mesmo padrão do app Flutter legado,
-- só que aqui todo usuário autenticado enxerga os mesmos dados da empresa).

ALTER TABLE "core"."profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
--> statement-breakpoint

-- O primeiro usuário a se cadastrar vira admin automaticamente; os demais
-- entram como operador (um admin promove depois em /settings).
CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  INSERT INTO core.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
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