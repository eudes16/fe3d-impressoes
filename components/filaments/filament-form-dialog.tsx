"use client"

import { GridItem, Input, SimpleGrid } from "@chakra-ui/react"

import { createFilament, updateFilament } from "@/actions/filaments"
import { useEntityFormAction } from "@/lib/hooks/use-entity-form-action"
import { EntityFormDialog, FormField } from "@/components/chakra/entity-form-dialog"
import type { filaments } from "@/db/schema"

type Filament = typeof filaments.$inferSelect

const CATEGORY_SUGGESTIONS = [
  "Padrão",
  "Silk",
  "Dual Color",
  "Tri Color",
  "Quad Color",
  "Metalic",
  "Glow",
]

export function FilamentFormDialog({ filament }: { filament?: Filament }) {
  const action = filament
    ? updateFilament.bind(null, filament.id)
    : createFilament
  const { open, setOpen, pending, handleSubmit } = useEntityFormAction(
    action,
    filament ? "Filamento atualizado." : "Filamento criado."
  )

  return (
    <EntityFormDialog
      editing={!!filament}
      createLabel="Novo filamento"
      title={filament ? "Editar filamento" : "Novo filamento (bobina)"}
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onSubmit={handleSubmit}
      size="lg"
    >
      <FormField label="Nome" required>
        <Input
          name="name"
          defaultValue={filament?.name}
          placeholder="Ex.: Voolt3D PLA Velvet"
        />
      </FormField>
      <SimpleGrid columns={2} gap="4">
        <FormField label="Fabricante">
          <Input name="vendor" defaultValue={filament?.vendor ?? ""} />
        </FormField>
        <FormField label="Tipo (PLA, PETG...)">
          <Input name="materialType" defaultValue={filament?.materialType ?? ""} />
        </FormField>
        <FormField label="Categoria">
          <Input
            name="category"
            list="filament-categories"
            placeholder="Padrão, Silk, Dual Color..."
            defaultValue={filament?.category ?? ""}
          />
          <datalist id="filament-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <GridItem colSpan={2}>
          <FormField
            label="Cores (para casar com o .3mf/.gcode)"
            helperText="#RRGGBB separadas por vírgula — mais de uma para silk/dual/tri/quad color."
          >
            <Input
              name="colors"
              placeholder="#RRGGBB, #RRGGBB"
              defaultValue={filament?.colors?.join(", ") ?? ""}
            />
          </FormField>
        </GridItem>
        <FormField label="Diâmetro (mm)" required>
          <Input
            name="diameterMm"
            type="number"
            step="0.01"
            defaultValue={filament?.diameterMm ?? 1.75}
          />
        </FormField>
        <FormField label="Preço da bobina (R$)" required>
          <Input
            name="price"
            type="number"
            step="0.01"
            defaultValue={filament?.price ?? 0}
          />
        </FormField>
        <FormField label="Peso total (kg)" required>
          <Input
            name="weightKg"
            type="number"
            step="0.01"
            defaultValue={filament?.weightKg ?? 1}
          />
        </FormField>
        <FormField label="Estoque atual (g)" required>
          <Input
            name="remainingWeightG"
            type="number"
            step="0.01"
            defaultValue={filament?.remainingWeightG ?? 0}
          />
        </FormField>
        <FormField label="Densidade (g/cm³)" required>
          <Input
            name="density"
            type="number"
            step="0.01"
            defaultValue={filament?.density ?? 1.24}
          />
        </FormField>
        <FormField label="Temp. bico (°C)" required>
          <Input
            name="nozzleTemp"
            type="number"
            defaultValue={filament?.nozzleTemp ?? 210}
          />
        </FormField>
        <FormField label="Temp. mesa (°C)" required>
          <Input
            name="bedTemp"
            type="number"
            defaultValue={filament?.bedTemp ?? 60}
          />
        </FormField>
        <FormField label="Comprimento (m)" required>
          <Input
            name="lengthM"
            type="number"
            step="0.01"
            defaultValue={filament?.lengthM ?? 330}
          />
        </FormField>
      </SimpleGrid>
    </EntityFormDialog>
  )
}
