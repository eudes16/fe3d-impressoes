import { Box, HStack } from "@chakra-ui/react"

/** Círculos com as cores de um filamento (várias para silk/dual/rainbow). */
export function ColorDots({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null
  return (
    <HStack gap="0.5" flexShrink="0">
      {colors.map((c, i) => (
        <Box
          key={i}
          boxSize="3.5"
          rounded="full"
          borderWidth="1px"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </HStack>
  )
}
