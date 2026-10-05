"use client"

import { NativeSelect } from "@chakra-ui/react"

import { PAGE_SIZES } from "@/lib/list-params"
import { useListNavigation } from "@/components/list/list-toolbar"

export function PageSizeSelect({ value }: { value: number }) {
  const { update } = useListNavigation()

  return (
    <NativeSelect.Root size="xs" width="auto">
      <NativeSelect.Field
        aria-label="Itens por página"
        value={value}
        onChange={(e) => update({ size: e.currentTarget.value })}
        rounded="l2"
      >
        {PAGE_SIZES.map((s) => (
          <option key={s} value={s}>
            {s} por página
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}
