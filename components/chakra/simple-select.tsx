"use client"

import { useMemo } from "react"
import { Box, HStack, Portal, Select, Text, createListCollection } from "@chakra-ui/react"

import { ColorDots } from "@/components/chakra/color-dots"

export type SimpleSelectItem = {
  value: string
  label: string
  /** Círculos de cor antes do rótulo (filamentos). */
  colors?: string[]
  /** Texto secundário à direita, ex.: preço. */
  hint?: string
}

function ItemContent({ item, truncate }: { item: SimpleSelectItem; truncate?: boolean }) {
  return (
    <HStack gap="2" flex="1" minW="0" w="full">
      {item.colors?.length ? <ColorDots colors={item.colors} /> : null}
      <Text flex="1" minW="0" truncate={truncate}>
        {item.label}
      </Text>
      {item.hint ? (
        <Text color="fg.muted" textStyle="xs" flexShrink="0">
          {item.hint}
        </Text>
      ) : null}
    </HStack>
  )
}

/**
 * Select controlado de valor único (value/onValueChange com string), no
 * formato que o react-hook-form espera. Esconde o boilerplate do Select do
 * Chakra (collection, positioner, portal...).
 */
export function SimpleSelect({
  items,
  value,
  onValueChange,
  placeholder = "Selecione",
  size = "sm",
  disabled,
  invalid,
  width = "full",
}: {
  items: SimpleSelectItem[]
  value: string | null | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  size?: "xs" | "sm" | "md" | "lg"
  disabled?: boolean
  invalid?: boolean
  width?: string
}) {
  const collection = useMemo(() => createListCollection({ items }), [items])
  const selected = items.find((i) => i.value === value)

  return (
    <Select.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(e) => {
        const next = e.value[0]
        if (next !== undefined) onValueChange(next)
      }}
      size={size}
      width={width}
      disabled={disabled}
      invalid={invalid}
      positioning={{ sameWidth: false }}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText
            placeholder={placeholder}
            display="flex"
            flex="1"
            minW="0"
            // O recipe limita a 80%; aqui só desconta o espaço da seta.
            maxW="calc(100% - 1.75rem)"
          >
            {selected ? <ItemContent item={selected} truncate /> : undefined}
          </Select.ValueText>
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          {/* Pelo menos a largura do trigger, mas com espaço pro nome + preço. */}
          <Select.Content minW="max(var(--reference-width), 22rem)">
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <ItemContent item={item} />
                <Box w="4" flexShrink="0">
                  <Select.ItemIndicator />
                </Box>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}
