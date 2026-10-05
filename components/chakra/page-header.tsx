import { Box, Flex, HStack, Heading, Text } from "@chakra-ui/react"

/**
 * Barra de título dentro da página (h2) — o h1 com o nome da seção fica no
 * header global (AppHeaderBar). Usada onde a página tem um nome próprio,
 * como o detalhe de um orçamento.
 */
export function PageHeader({
  title,
  description,
  badge,
  children,
}: {
  title: string
  description?: React.ReactNode
  badge?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <Flex align="center" justify="space-between" gap="4" wrap="wrap">
      <Box minW="0">
        <HStack gap="3">
          <Heading as="h2" textStyle="xl" fontWeight="bold" truncate>
            {title}
          </Heading>
          {badge}
        </HStack>
        {description ? <Text color="fg.muted">{description}</Text> : null}
      </Box>
      {children}
    </Flex>
  )
}
