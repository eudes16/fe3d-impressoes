import type { SliceData, SliceFilament } from "@/lib/parser3mf"

// Parser de metadados de .gcode fatiado pelo Creality Print (fork da família
// Bambu Studio/OrcaSlicer — não confundir com o formato clássico do
// PrusaSlicer). Diferente do .3mf (ZIP com XML/JSON), aqui é texto puro com
// os metadados de fatiamento em comentários: um bloco de cabeçalho (com os
// thumbnails PNG em base64) no topo e um resumo de consumo + CONFIG_BLOCK
// (todas as configs do fatiador, `; chave = valor`) no rodapé. O arquivo
// pode ter dezenas de MB de G-code no meio, então só decodificamos as pontas.

const HEAD_BYTES = 400_000
const TAIL_BYTES = 300_000

const THUMBNAIL_RE =
  /;\s*thumbnail begin (\d+)x(\d+) \d+\s*\n([\s\S]*?);\s*thumbnail end/gi

/** Extrai o maior thumbnail PNG (base64) embutido nos comentários do cabeçalho. */
function extractThumbnail(headText: string): string | null {
  let best: { area: number; base64: string } | null = null
  for (const m of headText.matchAll(THUMBNAIL_RE)) {
    const area = parseInt(m[1], 10) * parseInt(m[2], 10)
    const base64 = m[3]
      .split("\n")
      .map((line) => line.replace(/^;\s*/, "").trim())
      .filter(Boolean)
      .join("")
    if (base64 && (!best || area > best.area)) best = { area, base64 }
  }
  return best?.base64 ?? null
}

/** Divide uma lista `a;"b c";d` (formato do CONFIG_BLOCK), respeitando aspas. */
function splitSlicerList(value: string): string[] {
  const parts: string[] = []
  let current = ""
  let inQuotes = false
  for (const c of value) {
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ";" && !inQuotes) {
      parts.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  parts.push(current.trim())
  return parts
}

function splitNumberList(value: string): number[] {
  return value.split(",").map((v) => parseFloat(v.trim()) || 0)
}

/** "5h 47m 37s" (ou qualquer subconjunto de d/h/m/s) → horas. */
function parsePrintTimeH(value: string): number {
  const m = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i.exec(
    value.trim()
  )
  if (!m) return 0
  const [, d, h, mi, s] = m
  const totalSec =
    (parseInt(d ?? "0", 10) || 0) * 86400 +
    (parseInt(h ?? "0", 10) || 0) * 3600 +
    (parseInt(mi ?? "0", 10) || 0) * 60 +
    (parseInt(s ?? "0", 10) || 0)
  return totalSec / 3600
}

/** Nome do modelo: nome do objeto no gcode ou, na falta, o nome do arquivo. */
function guessModelName(headText: string, fileNameHint: string): string {
  const names = new Set<string>()
  for (const m of headText.matchAll(/EXCLUDE_OBJECT_DEFINE NAME=(\S+)/g)) {
    const base = m[1].replace(/_(?:id_\d+|copy_\d+)/g, "")
    if (base) names.add(base)
  }
  if (names.size > 0) return [...names].join(", ")

  const base = fileNameHint.replace(/\.gcode$/i, "")
  // Creality Print nomeia o arquivo como {nome}_{filamento}_{tempo}, ex.:
  // "Assembly_PLA_5h48m.gcode" — tira o sufixo pra sobrar só o nome do modelo.
  return base.replace(/_[A-Za-z0-9]+_\d+h(?:\d+m)?$/i, "") || base
}

/**
 * Lê um .gcode fatiado pelo Creality Print (ou fatiador compatível da
 * família Bambu/Orca) e retorna os mesmos dados estruturados do .3mf, ou
 * null se os metadados esperados não forem encontrados.
 */
export function parseGcode(
  bytes: ArrayBuffer,
  fileNameHint = ""
): SliceData | null {
  try {
    const decoder = new TextDecoder()
    const total = bytes.byteLength
    const headText = decoder.decode(bytes.slice(0, Math.min(HEAD_BYTES, total)))
    const tailText = decoder.decode(
      bytes.slice(Math.max(0, total - TAIL_BYTES))
    )

    const configStart = tailText.indexOf("; CONFIG_BLOCK_START")
    const configEnd = tailText.indexOf("; CONFIG_BLOCK_END")
    const configText =
      configStart !== -1 && configEnd !== -1
        ? tailText.slice(configStart, configEnd)
        : ""

    const configMap: Record<string, string> = {}
    // Espaço horizontal só ([ \t], não \s) — com \s, uma linha de valor
    // vazio (ex.: "layer_change_gcode = ") deixava o \s* depois do "="
    // engolir a quebra de linha e "roubar" a linha seguinte inteira como
    // se fosse o valor dessa chave.
    const lineRe = /^;[ \t]*([a-zA-Z0-9_]+)[ \t]*=[ \t]*(.*)$/gm
    for (const m of configText.matchAll(lineRe)) {
      configMap[m[1]] = m[2].trimEnd()
    }

    const weightsLine = /;\s*filament used \[g\]\s*=\s*(.+)/.exec(tailText)
    const lengthsLine = /;\s*filament used \[mm\]\s*=\s*(.+)/.exec(tailText)
    const timeLine = /;\s*estimated printing time \(normal mode\)\s*=\s*(.+)/.exec(
      tailText
    )
    // Sem nenhum dos dois, não dá pra confiar que isso é um gcode fatiado
    // por um slicer da família Bambu/Orca/Creality — melhor recusar.
    if (!weightsLine && !timeLine) {
      console.warn(
        "[parseGcode] nenhuma linha de resumo (\"filament used [g]\" / " +
          "\"estimated printing time\") encontrada nos últimos " +
          `${TAIL_BYTES} bytes do arquivo — formato não reconhecido.`
      )
      return null
    }

    const weightsG = weightsLine ? splitNumberList(weightsLine[1]) : []
    const lengthsMm = lengthsLine ? splitNumberList(lengthsLine[1]) : []
    const types = splitSlicerList(configMap["filament_type"] ?? "")
    const colors = splitSlicerList(configMap["filament_colour"] ?? "")
    const vendors = splitSlicerList(configMap["filament_vendor"] ?? "")
    const notes = splitSlicerList(configMap["filament_notes"] ?? "")

    // Os campos do CONFIG_BLOCK listam todos os slots configurados na
    // impressora (ex.: 3 cores), não só os usados neste prato — por isso o
    // corte real vem do resumo "filament used [g]", que só tem peso > 0 nos
    // slots efetivamente impressos.
    const filaments: SliceFilament[] = []
    weightsG.forEach((weightG, i) => {
      if (weightG <= 0) return
      const note = notes[i]?.trim()
      filaments.push({
        slotId: i + 1,
        type: types[i] ?? "",
        colorHex: colors[i] ?? "",
        weightG,
        lengthM: (lengthsMm[i] ?? 0) / 1000,
        vendor: vendors[i] ?? "",
        notes: note ? note : null,
      })
    })

    return {
      printerModel: configMap["printer_model"] ?? "",
      printTimeH: timeLine ? parsePrintTimeH(timeLine[1]) : 0,
      totalWeightG: weightsG.reduce((s, w) => s + w, 0),
      layerHeight: configMap["layer_height"] ?? "",
      nozzleDiameter: configMap["nozzle_diameter"] ?? "",
      filaments,
      modelName: guessModelName(headText, fileNameHint),
      thumbnailBase64: extractThumbnail(headText),
    }
  } catch (err) {
    console.error("[parseGcode] falha ao interpretar o .gcode", err)
    return null
  }
}
