import { Box, Card, Flex } from "@chakra-ui/react"

/** Card com título, descrição e ações no topo — usado em volta das tabelas. */
export function DataCard({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Flex align="start" justify="space-between" gap="4">
          <Box>
            <Card.Title>{title}</Card.Title>
            {description ? (
              <Card.Description mt="1">{description}</Card.Description>
            ) : null}
          </Box>
          {actions}
        </Flex>
      </Card.Header>
      <Card.Body pt="4" overflowX="auto">
        {children}
      </Card.Body>
    </Card.Root>
  )
}
