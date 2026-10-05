"use client"

import { Box, Flex, Portal, Stack, Text, Tooltip, VisuallyHidden } from "@chakra-ui/react"

import { formatBRL, formatBRLCompact } from "@/lib/format"

export type MonthPoint = { key: string; label: string; longLabel: string; value: number }

// Escala "redonda" pro eixo: 1, 2, 2.5 ou 5 × 10^k, com ~4 divisões.
function niceScale(max: number) {
  if (max <= 0) return { top: 1, ticks: [0] }
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(t)
  return { top, ticks }
}

const CHART_H = 200

/**
 * Colunas de uma única série (valor aprovado por mês). Sem legenda — o título
 * do card diz o que é plotado. Rótulo só no mês atual; os demais valores ficam
 * no tooltip e na tabela para leitores de tela.
 */
export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  const max = Math.max(0, ...data.map((d) => d.value))
  const { top, ticks } = niceScale(max)
  const lastIndex = data.length - 1

  return (
    <Box>
      <Flex gap="3" aria-hidden>
        {/* Eixo Y */}
        <Box position="relative" h={`${CHART_H}px`} w="12" flexShrink="0">
          {ticks.map((t) => (
            <Text
              key={t}
              position="absolute"
              right="0"
              bottom={`${(t / top) * CHART_H}px`}
              transform="translateY(50%)"
              textStyle="xs"
              color="fg.muted"
            >
              {formatBRLCompact(t)}
            </Text>
          ))}
        </Box>

        <Box position="relative" flex="1" h={`${CHART_H}px`}>
          {/* Grade: linhas finas e discretas */}
          {ticks.map((t) => (
            <Box
              key={t}
              position="absolute"
              insetX="0"
              bottom={`${(t / top) * CHART_H}px`}
              borderTopWidth="1px"
              borderColor="border"
            />
          ))}

          <Flex position="absolute" inset="0" align="end">
            {data.map((d, i) => {
              const h = top > 0 ? (d.value / top) * CHART_H : 0
              return (
                <Tooltip.Root key={d.key} openDelay={0} closeDelay={0} positioning={{ placement: "top" }}>
                  <Tooltip.Trigger asChild>
                    {/* Área de hover = a faixa inteira do mês, não só a barra. */}
                    <Flex
                      flex="1"
                      h="full"
                      direction="column"
                      align="center"
                      justify="end"
                      cursor="default"
                      role="presentation"
                      _hover={{ "& [data-bar]": { opacity: 0.85 } }}
                    >
                      {i === lastIndex && d.value > 0 ? (
                        <Text textStyle="xs" fontWeight="semibold" mb="1">
                          {formatBRLCompact(d.value)}
                        </Text>
                      ) : null}
                      <Box
                        data-bar
                        w="full"
                        maxW="6"
                        h={`${Math.max(h, d.value > 0 ? 2 : 0)}px`}
                        roundedTop="4px"
                        transition="opacity 0.15s"
                        style={{ backgroundColor: "var(--chart-1)" }}
                      />
                    </Flex>
                  </Tooltip.Trigger>
                  <Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        <Stack gap="0">
                          <Text fontWeight="semibold" textTransform="capitalize">
                            {d.longLabel}
                          </Text>
                          <Text>{formatBRL(d.value)}</Text>
                        </Stack>
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Portal>
                </Tooltip.Root>
              )
            })}
          </Flex>
        </Box>
      </Flex>

      {/* Eixo X */}
      <Flex gap="3" mt="2" aria-hidden>
        <Box w="12" flexShrink="0" />
        <Flex flex="1">
          {data.map((d) => (
            <Text
              key={d.key}
              flex="1"
              textAlign="center"
              textStyle="xs"
              color="fg.muted"
              textTransform="uppercase"
            >
              {d.label}
            </Text>
          ))}
        </Flex>
      </Flex>

      <VisuallyHidden>
        <table>
          <caption>Valor aprovado por mês</caption>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key}>
                <td>{d.longLabel}</td>
                <td>{formatBRL(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </Box>
  )
}
