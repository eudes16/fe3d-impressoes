# F&E 3D — gestão de impressão 3D

Next.js + Tailwind + shadcn/ui + Supabase (Auth/Storage) + Drizzle ORM.

Substitui gradualmente o app Flutter legado (`3d_printer_order`), usando o
mesmo projeto Supabase mas em schemas novos (`core`, `crm`, `catalog`,
`sales`) — o schema `public` do Flutter fica intocado.

## Configuração

```bash
cp .env.local.example .env.local
```

Preencha `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — mesmas do
  projeto Supabase do app Flutter (Project Settings → API).
- `DATABASE_URL` — connection string direta do Postgres (Project Settings →
  Database → Connection string → URI). Necessária só no servidor, para o
  Drizzle rodar as migrations e as queries.
- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role.
  Necessária para criar membros da equipe (Configurações → Equipe); não tem
  prefixo `NEXT_PUBLIC_` porque só é usada no servidor.

## Banco de dados

```bash
npm run db:generate   # gera SQL a partir de db/schema/*.ts
npm run db:push       # aplica no Postgres do Supabase (schemas core/crm/catalog/sales)
npm run db:studio     # abre o Drizzle Studio
```

A migration `db/migrations/0001_auth_integration.sql` liga `core.profiles` a
`auth.users` e cria o trigger que gera um profile automaticamente a cada
cadastro (primeiro usuário vira admin, os demais entram como operador).

Não há mais cadastro público — um admin logado cria o acesso de cada membro
da equipe em Configurações → Equipe (usa a Admin API do Supabase com a
`SUPABASE_SERVICE_ROLE_KEY`, já entrega a senha inicial que o admin definiu).

`supabase/legacy-schema-reference.sql` é uma cópia do schema do app Flutter,
mantida só como referência para a migração de dados futura — não é aplicada
por este projeto.

## Desenvolvimento

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Conceito do vínculo com o fatiador

Cada linha em `catalog.filaments` representa uma bobina física. Seu `id`
(UUID) deve ser colado no campo "Notas" do perfil de filamento no fatiador
(Orca Slicer / Bambu Studio / Creality Print). Ao importar o `.gcode.3mf`
ou o `.gcode` num orçamento, o parser lê esse UUID em `filament_notes` e
vincula automaticamente à bobina cadastrada (com fallback por cor + tipo,
depois só tipo).
