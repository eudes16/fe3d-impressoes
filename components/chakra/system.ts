import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { cardAnatomy, dialogAnatomy, tableAnatomy } from "@chakra-ui/react/anatomy"

import { schemeSelector } from "@/lib/themes"

// Tema do Chakra UI apontando para as variáveis CSS de app/globals.css
// (paleta de marca). Cada tema redefine essas variáveis num bloco
// [data-theme="<id>"], então não é preciso definir _light/_dark aqui.
//
// Linguagem visual inspirada no Horizon UI: cards grandes e bem
// arredondados sem borda (separados do fundo só pela cor e por uma sombra
// suave), títulos em negrito e tabelas "limpas" (cabeçalho em caixa alta
// discreto, sem linhas entre as linhas).
const config = defineConfig({
  // O Chakra decide claro/escuro pela classe .dark por padrão; aqui passa a
  // decidir pelo data-theme, para que temas personalizados (lib/themes.ts)
  // também ativem as cores claras/escuras dos componentes do Chakra.
  conditions: {
    light: `:root &, ${schemeSelector("light")}`,
    dark: schemeSelector("dark"),
  },
  globalCss: {
    html: {
      colorPalette: "brand",
    },
    "*::selection": {
      bg: "brand.subtle",
    },
    // Títulos em negrito via CSS global, não no slot recipe: sobrescrever
    // `title` no recipe muda a ordem das propriedades mescladas de forma
    // diferente no servidor e no cliente, e o hash da classe diverge
    // (hydration mismatch).
    ".chakra-card__title, .chakra-dialog__title": {
      fontWeight: "bold",
    },
  },
  theme: {
    recipes: {
      // Como no shadcn: só o botão sólido leva a cor de marca; ghost/outline
      // são neutros. Um colorPalette explícito (ex.: "red") ainda prevalece.
      button: {
        variants: {
          variant: {
            ghost: { colorPalette: "gray" },
            outline: { colorPalette: "gray" },
          },
        },
      },
    },
    slotRecipes: {
      card: {
        slots: cardAnatomy.keys(),
        base: {
          root: { borderRadius: "l4" },
        },
        variants: {
          // Título maior que o padrão do Chakra (lg). Tamanho de título só por
          // aqui: `textStyle` como prop no Card.Title conflita com o do recipe
          // e gera classes diferentes no servidor e no cliente.
          size: {
            md: { title: { textStyle: "xl" } },
          },
          variant: {
            outline: {
              root: {
                bg: "bg.subtle",
                borderWidth: "0",
                boxShadow: "card",
              },
            },
          },
        },
      },
      table: {
        slots: tableAnatomy.keys(),
        base: {
          columnHeader: {
            color: "fg.muted",
            fontWeight: "medium",
            textStyle: "xs",
            textTransform: "uppercase",
            letterSpacing: "wide",
          },
        },
        variants: {
          variant: {
            line: {
              columnHeader: { borderBottomWidth: "0" },
              cell: { borderBottomWidth: "0" },
              row: { bg: "transparent" },
            },
          },
        },
      },
      dialog: {
        slots: dialogAnatomy.keys(),
        base: {
          content: { borderRadius: "l4" },
        },
      },
    },
    tokens: {
      fonts: {
        // Geist, carregada via next/font em app/layout.tsx.
        body: { value: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" },
        heading: { value: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" },
        mono: { value: "var(--font-geist-mono), ui-monospace, monospace" },
      },
    },
    semanticTokens: {
      radii: {
        l1: { value: "0.5rem" },
        l2: { value: "0.75rem" },
        l3: { value: "1rem" },
        // Cards e diálogos.
        l4: { value: "1.25rem" },
      },
      shadows: {
        // Definida por tema em app/globals.css.
        card: { value: "var(--shadow-card)" },
      },
      colors: {
        bg: {
          DEFAULT: { value: "var(--background)" },
          panel: { value: "var(--popover)" },
          muted: { value: "var(--muted)" },
          subtle: { value: "var(--card)" },
          emphasized: { value: "var(--accent)" },
        },
        fg: {
          DEFAULT: { value: "var(--foreground)" },
          muted: { value: "var(--muted-foreground)" },
          error: { value: "var(--destructive)" },
        },
        border: {
          DEFAULT: { value: "var(--border)" },
          muted: { value: "var(--border)" },
          emphasized: { value: "var(--input)" },
        },
        // Paleta neutra (ghost/outline, badges cinza) nos tons navy-roxo do
        // tema em vez dos cinzas padrão do Chakra.
        gray: {
          solid: { value: "var(--foreground)" },
          contrast: { value: "var(--background)" },
          fg: { value: "var(--foreground)" },
          subtle: { value: "var(--muted)" },
          muted: { value: "var(--secondary)" },
          emphasized: { value: "var(--accent)" },
          focusRing: { value: "var(--ring)" },
          border: { value: "var(--border)" },
        },
        brand: {
          solid: { value: "var(--primary)" },
          contrast: { value: "var(--primary-foreground)" },
          fg: { value: "var(--primary)" },
          muted: { value: "color-mix(in srgb, var(--primary) 30%, transparent)" },
          subtle: { value: "color-mix(in srgb, var(--primary) 15%, transparent)" },
          emphasized: { value: "color-mix(in srgb, var(--primary) 40%, transparent)" },
          focusRing: { value: "var(--ring)" },
          border: { value: "var(--primary)" },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
