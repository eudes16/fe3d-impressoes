"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { Check } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { filamentLabel } from "@/lib/filament-label"
import type { SliceData } from "@/lib/parser3mf"
import type { filaments } from "@/db/schema"

type FilamentOption = typeof filaments.$inferSelect

const SKIP = "__skip__"

// three.js/@react-three/fiber usa WebGL — precisa ficar fora de qualquer
// tentativa de SSR.
const ThreeMfViewer = dynamic(
  () => import("@/components/quotes/three-mf-viewer").then((m) => m.ThreeMfViewer),
  { ssr: false }
)

export type PendingImport = {
  data: SliceData
  filename: string
  mapping: (string | null)[]
  buffer: ArrayBuffer
  // O .3mf carrega a malha (visualizada em 3D via ThreeMfViewer); o .gcode
  // puro não tem geometria, então o preview cai pro thumbnail embutido nos
  // comentários do fatiador.
  source: "3mf" | "gcode"
}

// O perfil de filamento no fatiador é por marca+tipo, não por cor — o
// cadastro na aplicação é por bobina (uma cor específica). O matching
// automático (UUID exato > cor+tipo > tipo) só serve de sugestão; o usuário
// sempre confirma ou troca o vínculo antes de aplicar ao orçamento.
export function Import3mfDialog({
  pending,
  filamentOptions,
  onMappingChange,
  onConfirm,
  onCancel,
}: {
  pending: PendingImport | null
  filamentOptions: FilamentOption[]
  onMappingChange: (index: number, filamentId: string | null) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl min-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar filamentos do arquivo importado</DialogTitle>
          <DialogDescription>
            O fatiador não identifica a bobina exata — confira ou troque o
            vínculo de cada filamento antes de importar.
          </DialogDescription>
        </DialogHeader>

        {pending?.source === "3mf" ? (
          <ThreeMfViewer buffer={pending.buffer} />
        ) : null}

        {pending?.source === "gcode" && pending.data.thumbnailBase64 ? (
          <Image
            src={`data:image/png;base64,${pending.data.thumbnailBase64}`}
            alt="Prévia do modelo"
            width={260}
            height={260}
            unoptimized
            className="mx-auto rounded-md border object-contain"
          />
        ) : null}

        {pending ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detectado no .3mf</TableHead>
                <TableHead className="w-24">Peso</TableHead>
                <TableHead className="w-64">Vincular a</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.data.filaments.map((sf, index) => {
                const exactMatch =
                  !!sf.notes && filamentOptions.some((f) => f.id === sf.notes)
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {sf.colorHex ? (
                          <span
                            className="size-3.5 shrink-0 rounded-full border"
                            style={{ backgroundColor: sf.colorHex }}
                            title={sf.colorHex}
                          />
                        ) : null}
                        <div>
                          <div className="font-medium">
                            {sf.type || "Tipo desconhecido"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sf.vendor || "—"}
                          </div>
                        </div>
                        {exactMatch ? (
                          <span className="flex items-center gap-0.5 text-xs text-chart-3">
                            <Check className="size-3" />
                            UUID
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{sf.weightG.toFixed(1)} g</TableCell>
                    <TableCell>
                      <Select
                        value={pending.mapping[index] ?? SKIP}
                        onValueChange={(v) =>
                          onMappingChange(index, v === SKIP ? null : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string) => {
                              if (value === SKIP) return "Não vincular"
                              const f = filamentOptions.find((o) => o.id === value)
                              return f ? filamentLabel(f) : "Não vincular"
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SKIP}>Não vincular</SelectItem>
                          {filamentOptions.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {filamentLabel(f)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirmar e importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
