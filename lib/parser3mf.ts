import JSZip from "jszip"

// Porta fiel de lib/core/utils/gcode_3mf_parser.dart do app Flutter legado —
// mesma abordagem por regex (o slice_info.config não é XML bem-formado o
// bastante para valer um parser XML completo) e mesmos nomes de campo.

export type SliceFilament = {
  slotId: number
  type: string
  colorHex: string
  weightG: number
  lengthM: number
  vendor: string
  notes: string | null
}

export type SliceData = {
  printerModel: string
  printTimeH: number
  totalWeightG: number
  layerHeight: string
  nozzleDiameter: string
  filaments: SliceFilament[]
  modelName: string
  thumbnailBase64: string | null
}

const METADATA_RE = /<metadata\s+key="([^"]+)"\s+value="([^"]*)"/g
const OBJECT_RE = /<object\s[^>]*name="([^"]+)"/
const FILAMENT_TAG_RE = /<filament\s([^/]+)\/>/g
const ATTR_RE = /(\w+)="([^"]*)"/g

/** Lê um .gcode.3mf (ZIP) e retorna os dados de fatiamento estruturados, ou null se inválido. */
export async function parseGcode3mf(
  bytes: ArrayBuffer | Uint8Array
): Promise<SliceData | null> {
  try {
    const archive = await JSZip.loadAsync(bytes)

    const sliceFile = archive.file("Metadata/slice_info.config")
    if (!sliceFile) return null
    const sliceContent = await sliceFile.async("string")

    const settingsFile = archive.file("Metadata/project_settings.config")
    const settingsContent = settingsFile
      ? await settingsFile.async("string")
      : null

    const thumbFile =
      archive.file("Metadata/plate_1_small.png") ??
      archive.file("Metadata/plate_1.png")
    const thumbnailBase64 = thumbFile
      ? await thumbFile.async("base64")
      : null

    // ── slice_info.config (XML, lido via regex — mesma abordagem do Flutter) ──
    const metaMap: Record<string, string> = {}
    for (const m of sliceContent.matchAll(METADATA_RE)) {
      metaMap[m[1]] = m[2]
    }

    const printerModel = metaMap["printer_model_id"] ?? ""
    const predictionSec = parseInt(metaMap["prediction"] ?? "0", 10) || 0
    const printTimeH = predictionSec / 3600
    const totalWeightG = parseFloat(metaMap["weight"] ?? "0") || 0
    const nozzleDiameter = metaMap["nozzle_diameters"] ?? ""
    const modelName = OBJECT_RE.exec(sliceContent)?.[1] ?? ""

    type RawFilament = {
      slotId: number
      type: string
      colorHex: string
      weightG: number
      lengthM: number
      vendor: string
      notes: string | null
    }

    const rawFilaments: RawFilament[] = []
    for (const fMatch of sliceContent.matchAll(FILAMENT_TAG_RE)) {
      const attrs: Record<string, string> = {}
      for (const a of fMatch[1].matchAll(ATTR_RE)) {
        attrs[a[1]] = a[2]
      }
      rawFilaments.push({
        slotId: parseInt(attrs["id"] ?? "0", 10) || 0,
        type: attrs["type"] ?? "",
        colorHex: attrs["color"] ?? "",
        weightG: parseFloat(attrs["used_g"] ?? "0") || 0,
        lengthM: parseFloat(attrs["used_m"] ?? "0") || 0,
        vendor: "",
        notes: null,
      })
    }

    // ── project_settings.config (JSON) — vendor/notes por slot ──
    let layerHeight = ""
    if (settingsContent) {
      try {
        const settings = JSON.parse(settingsContent) as Record<string, unknown>
        layerHeight = settings["layer_height"]?.toString() ?? ""

        const vendors = settings["filament_vendor"]
        if (Array.isArray(vendors)) {
          for (const rf of rawFilaments) {
            const idx = rf.slotId - 1
            if (idx >= 0 && idx < vendors.length) {
              rf.vendor = vendors[idx]?.toString() ?? ""
            }
          }
        }

        const notes = settings["filament_notes"]
        if (Array.isArray(notes)) {
          for (const rf of rawFilaments) {
            const idx = rf.slotId - 1
            if (idx >= 0 && idx < notes.length) {
              const note = notes[idx]?.toString().trim()
              rf.notes = note ? note : null
            }
          }
        }
      } catch {
        // project_settings.config ausente/corrompido — segue sem vendor/notes
      }
    }

    return {
      printerModel,
      printTimeH,
      totalWeightG,
      layerHeight,
      nozzleDiameter,
      filaments: rawFilaments,
      modelName,
      thumbnailBase64,
    }
  } catch {
    return null
  }
}

export type MatchableFilament = {
  id: string
  name: string
  color: string | null
}

/**
 * Casa um SliceFilament com um filamento cadastrado, na mesma ordem de
 * prioridade do Flutter (`_matchFilament` em quote_form_screen.dart):
 *   0. UUID exato colado nas notas do slicer (sf.notes === filament.id)
 *   1. Cor + tipo (nome contém o tipo)
 *   2. Só tipo (nome contém o tipo)
 */
export function matchFilament<T extends MatchableFilament>(
  sf: SliceFilament,
  filaments: T[]
): T | null {
  if (sf.notes) {
    const byId = filaments.find((f) => f.id === sf.notes)
    if (byId) return byId
  }

  const typeLower = sf.type.toLowerCase()
  const colorLower = sf.colorHex.toLowerCase()

  const byColorAndType = filaments.find(
    (f) =>
      (f.color?.toLowerCase() ?? "") === colorLower &&
      f.name.toLowerCase().includes(typeLower)
  )
  if (byColorAndType) return byColorAndType

  const byTypeOnly = filaments.find((f) =>
    f.name.toLowerCase().includes(typeLower)
  )
  return byTypeOnly ?? null
}
