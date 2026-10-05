"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Check } from "lucide-react"

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Table,
  Text,
} from "@chakra-ui/react"
import { SimpleSelect } from "@/components/chakra/simple-select"
import { ColorDots } from "@/components/chakra/color-dots"
import { filamentSelectItem } from "@/lib/filament-label"
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
  const selectItems = useMemo(
    () => [
      { value: SKIP, label: "Não vincular" },
      ...filamentOptions.map(filamentSelectItem),
    ],
    [filamentOptions]
  )

  return (
    <Dialog.Root
      open={pending !== null}
      onOpenChange={(e) => {
        if (!e.open) onCancel()
      }}
      placement="center"
      size="xl"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header flexDirection="column" alignItems="start">
              <Dialog.Title>Confirmar filamentos do arquivo importado</Dialog.Title>
              <Dialog.Description>
                O fatiador não identifica a bobina exata — confira ou troque o
                vínculo de cada filamento antes de importar.
              </Dialog.Description>
            </Dialog.Header>

            <Dialog.Body display="flex" flexDirection="column" gap="4">
              {pending?.source === "3mf" ? (
                <ThreeMfViewer buffer={pending.buffer} />
              ) : null}

              {pending?.source === "gcode" && pending.data.thumbnailBase64 ? (
                <Box
                  mx="auto"
                  rounded="l2"
                  borderWidth="1px"
                  overflow="hidden"
                >
                  <Image
                    src={`data:image/png;base64,${pending.data.thumbnailBase64}`}
                    alt="Prévia do modelo"
                    width={260}
                    height={260}
                    unoptimized
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              ) : null}

              {pending ? (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="transparent">
                      <Table.ColumnHeader>Detectado no arquivo</Table.ColumnHeader>
                      <Table.ColumnHeader w="24">Peso</Table.ColumnHeader>
                      <Table.ColumnHeader w="64">Vincular a</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {pending.data.filaments.map((sf, index) => {
                      const exactMatch =
                        !!sf.notes && filamentOptions.some((f) => f.id === sf.notes)
                      return (
                        <Table.Row key={index} bg="transparent">
                          <Table.Cell>
                            <HStack gap="2">
                              <ColorDots colors={sf.colorHex ? [sf.colorHex] : []} />
                              <Box>
                                <Text fontWeight="medium">
                                  {sf.type || "Tipo desconhecido"}
                                </Text>
                                <Text textStyle="xs" color="fg.muted">
                                  {sf.vendor || "—"}
                                </Text>
                              </Box>
                              {exactMatch ? (
                                <HStack
                                  gap="0.5"
                                  textStyle="xs"
                                  style={{ color: "var(--chart-3)" }}
                                >
                                  <Check size={12} />
                                  UUID
                                </HStack>
                              ) : null}
                            </HStack>
                          </Table.Cell>
                          <Table.Cell>{sf.weightG.toFixed(1)} g</Table.Cell>
                          <Table.Cell>
                            <SimpleSelect
                              items={selectItems}
                              value={pending.mapping[index] ?? SKIP}
                              onValueChange={(v) =>
                                onMappingChange(index, v === SKIP ? null : v)
                              }
                            />
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table.Root>
              ) : null}
            </Dialog.Body>

            <Dialog.Footer>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="button" onClick={onConfirm}>
                Confirmar e importar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
