"use client"

import { useSyncExternalStore } from "react"
import { IconButton, Menu, Portal } from "@chakra-ui/react"
import { Monitor, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { THEMES, type ThemeDefinition } from "@/lib/themes"

const noopSubscribe = () => () => {}

/** true só no cliente — o tema salvo não é conhecido no render do servidor. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

function themeIcon(theme: ThemeDefinition | undefined, size = 16) {
  if (!theme) return <Palette size={size} />
  return theme.scheme === "dark" ? <Moon size={size} /> : <Sun size={size} />
}

export function ThemeMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isClient = useIsClient()

  const active = THEMES.find((t) => t.id === resolvedTheme)
  const icon = !isClient ? (
    <Palette size={18} />
  ) : theme === "system" ? (
    <Monitor size={18} />
  ) : (
    themeIcon(active, 18)
  )

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" size="sm" rounded="full" aria-label="Mudar tema">
          {icon}
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="44">
            <Menu.RadioItemGroup
              value={isClient ? (theme ?? "system") : ""}
              onValueChange={(e) => setTheme(e.value)}
            >
              <Menu.ItemGroupLabel>Tema</Menu.ItemGroupLabel>
              {THEMES.map((t) => (
                <Menu.RadioItem key={t.id} value={t.id}>
                  {themeIcon(t)}
                  {t.label}
                  <Menu.ItemIndicator />
                </Menu.RadioItem>
              ))}
              <Menu.RadioItem value="system">
                <Monitor size={16} />
                Sistema
                <Menu.ItemIndicator />
              </Menu.RadioItem>
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
