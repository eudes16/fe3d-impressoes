/**
 * Registro de temas. O tema ativo vai no atributo `data-theme` do <html>
 * (via next-themes) e cada tema define suas cores num bloco
 * `[data-theme="<id>"]` em app/globals.css.
 *
 * Para criar um tema personalizado:
 *  1. adicione uma entrada aqui (id, nome e se a base é clara ou escura);
 *  2. crie o bloco `[data-theme="<id>"] { ... }` em app/globals.css com as
 *     mesmas variáveis dos temas existentes.
 * O seletor de tema e as condições _light/_dark do Chakra (cores de status,
 * alertas...) leem desta lista, então não há mais nada a mudar.
 */
export type ThemeScheme = "light" | "dark"

export type ThemeDefinition = {
  id: string
  label: string
  scheme: ThemeScheme
}

export const THEMES: ThemeDefinition[] = [
  { id: "light", label: "Claro", scheme: "light" },
  { id: "dark", label: "Escuro", scheme: "dark" },
]

export const THEME_IDS = THEMES.map((t) => t.id)

/** Tema usado na primeira visita (antes de o usuário escolher). */
export const DEFAULT_THEME = "dark"

/** Seletores CSS para as condições _light/_dark do Chakra. */
export function schemeSelector(scheme: ThemeScheme) {
  return THEMES.filter((t) => t.scheme === scheme)
    .map((t) => `[data-theme="${t.id}"] &`)
    .join(", ")
}
