"use client"

import { useState } from "react"
import { useServerInsertedHTML } from "next/navigation"
import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"

import { DEFAULT_THEME, THEME_IDS } from "@/lib/themes"
import { system } from "./system"

/**
 * O Chakra usa Emotion. Sem este registry, no SSR o Emotion renderiza as
 * <style> inline no meio da árvore e o cliente não — hydration mismatch no
 * App Router. Aqui os estilos gerados durante o render do servidor são
 * coletados e injetados no <head> via useServerInsertedHTML.
 */
function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [registry] = useState(() => {
    const cache = createCache({ key: "css" })
    cache.compat = true
    const prevInsert = cache.insert
    let inserted: { name: string; isGlobal: boolean }[] = []
    cache.insert = (...args) => {
      const [selector, serialized] = args
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({ name: serialized.name, isGlobal: !selector })
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prev = inserted
      inserted = []
      return prev
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const inserted = registry.flush()
    if (inserted.length === 0) return null

    let styles = ""
    let dataEmotionAttribute = registry.cache.key
    const globals: { name: string; style: string }[] = []

    for (const { name, isGlobal } of inserted) {
      const style = registry.cache.inserted[name]
      if (typeof style !== "string") continue
      if (isGlobal) {
        globals.push({ name, style })
      } else {
        styles += style
        dataEmotionAttribute += ` ${name}`
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${registry.cache.key}-global ${name}`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles ? (
          <style
            data-emotion={dataEmotionAttribute}
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        ) : null}
      </>
    )
  })

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        {/* Tema em data-theme no <html>; "system" segue o SO (light/dark). */}
        <ThemeProvider
          attribute="data-theme"
          themes={THEME_IDS}
          defaultTheme={DEFAULT_THEME}
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ChakraProvider>
    </EmotionRegistry>
  )
}
