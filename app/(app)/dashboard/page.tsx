import NextLink from "next/link"
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm"
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Factory,
  FileText,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Badge,
  Box,
  Card,
  Center,
  Flex,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react"
import { db } from "@/db"
import { clients, consumables, filaments, quotes } from "@/db/schema"
import {
  quoteStatusLabels,
  quoteStatusPalette,
  quoteStatusValues,
} from "@/lib/validation/quote"
import { formatBRL, formatBRLCompact } from "@/lib/format"
import { DataCard } from "@/components/chakra/data-card"
import { MonthlyChart, type MonthPoint } from "@/components/dashboard/monthly-chart"

const LOW_STOCK_RATIO = 0.15
const TZ = "America/Sao_Paulo"
const MONTHS = 6
// Orçamentos que viraram venda — entram no valor aprovado.
const SOLD_STATUSES = ["approved", "in_production", "completed"] as const

/** Últimos N meses (o atual por último) no fuso de São Paulo, como "YYYY-MM". */
function lastMonths(n: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === "year")!.value)
  const month = Number(parts.find((p) => p.type === "month")!.value)
  const short = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
  const long = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (n - 1 - i), 1))
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: short.format(d).replace(".", ""),
      longLabel: long.format(d),
      start: d,
    }
  })
}

function StatTile({
  icon,
  label,
  value,
  footer,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Card.Root>
      <Card.Body py="5" px="5">
        <HStack gap="4">
          <Center
            boxSize="14"
            flexShrink="0"
            rounded="full"
            bg="bg.muted"
            color="brand.fg"
          >
            {icon}
          </Center>
          <Box minW="0">
            <Text textStyle="sm" color="fg.muted" truncate>
              {label}
            </Text>
            <Text textStyle="2xl" fontWeight="bold" lineHeight="short">
              {value}
            </Text>
            {footer}
          </Box>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) return null
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0
  return (
    <HStack gap="1" textStyle="xs" mt="0.5">
      <Box color={up ? "fg.success" : "fg.error"} display="flex">
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      </Box>
      <Text fontWeight="semibold" color={up ? "fg.success" : "fg.error"}>
        {up ? "+" : ""}
        {pct.toFixed(0)}%
      </Text>
      <Text color="fg.muted">vs. mês anterior</Text>
    </HStack>
  )
}

export default async function DashboardPage() {
  const months = lastMonths(MONTHS)
  // Fuso como literal (constante do código): com parâmetro, o Postgres não
  // reconhece o GROUP BY como a mesma expressão do SELECT.
  const monthKey = sql<string>`to_char(${quotes.createdAt} at time zone '${sql.raw(TZ)}', 'YYYY-MM')`

  const [
    allFilaments,
    allConsumables,
    statusCounts,
    recentQuotes,
    monthlySold,
    monthlyCreated,
    [{ clientCount }],
  ] = await Promise.all([
    db.select().from(filaments),
    db.select().from(consumables),
    db
      .select({ status: quotes.status, count: count() })
      .from(quotes)
      .groupBy(quotes.status),
    db
      .select({
        id: quotes.id,
        description: quotes.description,
        status: quotes.status,
        realPrice: quotes.realPrice,
        quantity: quotes.quantity,
        createdAt: quotes.createdAt,
        clientName: clients.name,
      })
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .orderBy(desc(quotes.createdAt))
      .limit(6),
    db
      .select({
        month: monthKey,
        total: sql<number>`coalesce(sum(${quotes.realPrice} * ${quotes.quantity}), 0)`.mapWith(Number),
      })
      .from(quotes)
      .where(
        and(
          inArray(quotes.status, [...SOLD_STATUSES]),
          // Margem de 1 dia cobre a diferença de fuso; o agrupamento por
          // to_char já é no fuso certo.
          gte(quotes.createdAt, new Date(months[0].start.getTime() - 86_400_000))
        )
      )
      .groupBy(monthKey),
    db
      .select({ month: monthKey, count: count() })
      .from(quotes)
      .where(gte(quotes.createdAt, new Date(months.at(-2)!.start.getTime() - 86_400_000)))
      .groupBy(monthKey),
    db.select({ clientCount: count() }).from(clients),
  ])

  const soldByMonth = new Map(monthlySold.map((m) => [m.month, m.total]))
  const chartData: MonthPoint[] = months.map((m) => ({
    key: m.key,
    label: m.label,
    longLabel: m.longLabel,
    value: soldByMonth.get(m.key) ?? 0,
  }))
  const soldThisMonth = chartData.at(-1)!.value
  const soldLastMonth = chartData.at(-2)!.value
  const soldTotal = chartData.reduce((s, d) => s + d.value, 0)

  const createdByMonth = new Map(monthlyCreated.map((m) => [m.month, m.count]))
  const createdThisMonth = createdByMonth.get(months.at(-1)!.key) ?? 0

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s.count]))
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count))

  const lowStockFilaments = allFilaments.filter(
    (f) => f.remainingWeightG < f.weightKg * 1000 * LOW_STOCK_RATIO
  )
  const outOfStockConsumables = allConsumables.filter((c) => c.quantity <= 0)
  const alerts = [
    ...lowStockFilaments.map((f) => ({
      id: f.id,
      name: f.name,
      detail: `${f.remainingWeightG.toFixed(0)} g restantes`,
      href: "/filaments",
      icon: <Boxes size={16} />,
    })),
    ...outOfStockConsumables.map((c) => ({
      id: c.id,
      name: c.name,
      detail: `Esgotado (${c.quantity} ${c.unit})`,
      href: "/consumables",
      icon: <Package size={16} />,
    })),
  ]

  return (
    <Stack gap="5">
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5">
        <StatTile
          icon={<CircleDollarSign size={24} />}
          label="Aprovado no mês"
          value={formatBRL(soldThisMonth)}
          footer={<Delta current={soldThisMonth} previous={soldLastMonth} />}
        />
        <StatTile
          icon={<FileText size={24} />}
          label="Orçamentos no mês"
          value={createdThisMonth}
        />
        <StatTile
          icon={<Factory size={24} />}
          label="Em produção"
          value={countByStatus.get("in_production") ?? 0}
        />
        <StatTile icon={<Users size={24} />} label="Clientes" value={clientCount} />
        <StatTile
          icon={<Boxes size={24} />}
          label="Filamentos em baixa"
          value={lowStockFilaments.length}
        />
        <StatTile
          icon={<Package size={24} />}
          label="Consumíveis esgotados"
          value={outOfStockConsumables.length}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="5">
        <Card.Root>
          <Card.Header>
            <Card.Title>Valor aprovado</Card.Title>
            <Card.Description>
              Orçamentos aprovados, em produção ou concluídos — últimos {MONTHS} meses
            </Card.Description>
          </Card.Header>
          <Card.Body gap="5">
            <Box>
              <Text textStyle="4xl" fontWeight="bold" lineHeight="1">
                {formatBRLCompact(soldTotal)}
              </Text>
              <Text textStyle="sm" color="fg.muted" mt="1">
                Total no período
              </Text>
            </Box>
            <MonthlyChart data={chartData} />
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Orçamentos por status</Card.Title>
            <Card.Description>Todos os orçamentos cadastrados</Card.Description>
          </Card.Header>
          <Card.Body justifyContent="center">
            <Stack gap="4">
              {quoteStatusValues.map((status) => {
                const n = countByStatus.get(status) ?? 0
                return (
                  <Flex key={status} align="center" gap="3">
                    <Text textStyle="sm" color="fg.muted" w="28" flexShrink="0">
                      {quoteStatusLabels[status]}
                    </Text>
                    <Flex flex="1" align="center" gap="2">
                      <Box
                        h="3"
                        roundedEnd="4px"
                        minW={n > 0 ? "1" : "0"}
                        style={{
                          width: `${(n / maxStatus) * 100}%`,
                          backgroundColor: "var(--chart-2)",
                        }}
                      />
                      <Text textStyle="sm" fontWeight="semibold">
                        {n}
                      </Text>
                    </Flex>
                  </Flex>
                )
              })}
            </Stack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="5">
        <Box gridColumn={{ xl: "span 2" }}>
          <DataCard
            title="Orçamentos recentes"
            actions={
              <Link asChild textStyle="sm" color="brand.fg" fontWeight="semibold">
                <NextLink href="/quotes">Ver todos</NextLink>
              </Link>
            }
          >
            {recentQuotes.length === 0 ? (
              <Text textStyle="sm" color="fg.muted">
                Nenhum orçamento ainda.
              </Text>
            ) : (
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Descrição</Table.ColumnHeader>
                    <Table.ColumnHeader>Cliente</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Valor</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Data</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {recentQuotes.map((q) => (
                    <Table.Row key={q.id}>
                      <Table.Cell fontWeight="semibold">
                        <Link asChild color="fg" textDecoration="none">
                          <NextLink href={`/quotes/${q.id}`}>{q.description}</NextLink>
                        </Link>
                      </Table.Cell>
                      <Table.Cell color="fg.muted">{q.clientName ?? "—"}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={quoteStatusPalette[q.status]} variant="subtle">
                          {quoteStatusLabels[q.status]}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="end" fontWeight="semibold">
                        {formatBRL(q.realPrice * q.quantity)}
                      </Table.Cell>
                      <Table.Cell textAlign="end" color="fg.muted">
                        {q.createdAt.toLocaleDateString("pt-BR", { timeZone: TZ })}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </DataCard>
        </Box>

        <Card.Root>
          <Card.Header>
            <Card.Title>Alertas de estoque</Card.Title>
            <Card.Description>
              Filamentos abaixo de {LOW_STOCK_RATIO * 100}% e consumíveis esgotados
            </Card.Description>
          </Card.Header>
          <Card.Body gap="3">
            {alerts.length === 0 ? (
              <Text textStyle="sm" color="fg.muted">
                Nenhum alerta.
              </Text>
            ) : (
              alerts.map((a) => (
                <Link key={a.id} asChild textDecoration="none" color="fg">
                  <NextLink href={a.href}>
                    <HStack
                      w="full"
                      gap="3"
                      p="3"
                      rounded="l3"
                      bg="bg.muted"
                      _hover={{ bg: "bg.emphasized" }}
                    >
                      <Center
                        boxSize="9"
                        flexShrink="0"
                        rounded="full"
                        bg="orange.subtle"
                        color="orange.fg"
                      >
                        {a.icon}
                      </Center>
                      <Box minW="0" flex="1">
                        <Text textStyle="sm" fontWeight="semibold" truncate>
                          {a.name}
                        </Text>
                        <HStack gap="1" textStyle="xs" color="fg.muted">
                          <AlertTriangle size={12} />
                          {a.detail}
                        </HStack>
                      </Box>
                    </HStack>
                  </NextLink>
                </Link>
              ))
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </Stack>
  )
}
