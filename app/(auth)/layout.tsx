import { Box, Center, Flex } from "@chakra-ui/react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Flex
      position="relative"
      minH="100vh"
      flex="1"
      direction="column"
      align="center"
      justify="center"
      gap="6"
      overflow="hidden"
      p="4"
      bg="color-mix(in srgb, var(--muted) 30%, transparent)"
    >
      <Box
        aria-hidden
        pointerEvents="none"
        position="absolute"
        inset="0"
        zIndex="-1"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--chart-1), transparent 85%), transparent), radial-gradient(50% 40% at 100% 100%, color-mix(in srgb, var(--chart-2), transparent 88%), transparent)",
        }}
      />
      <Center position="relative" boxSize="64">
        <Box
          position="absolute"
          inset="0"
          rounded="full"
          bg="brand.subtle"
          filter="blur(24px)"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de 400KB, sem otimização de raster necessária */}
        <img
          src="/logo.svg"
          alt="F&E 3D"
          style={{ position: "relative", width: "16rem", height: "16rem" }}
        />
      </Center>
      <Box w="full" maxW="sm">
        {children}
      </Box>
    </Flex>
  )
}
