"use client"

import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { Box, Flex, HStack, Separator, Stack, Text } from "@chakra-ui/react"

import { NAV_ITEMS, isActive } from "@/components/nav-items"

function Brand() {
  return (
    <HStack justify="center" gap="3" h="24" px="6">
      <Box position="relative" boxSize="12" flexShrink="0">
        <Box
          position="absolute"
          inset="0"
          rounded="full"
          bg="brand.subtle"
          filter="blur(10px)"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de 400KB, sem otimização de raster necessária */}
        <img
          src="/logo.svg"
          alt=""
          style={{ position: "relative", width: "3rem", height: "3rem" }}
        />
      </Box>
      <Text textStyle="2xl" fontWeight="bold" letterSpacing="tight" whiteSpace="nowrap">
        F&E{" "}
        <Text as="span" fontWeight="normal">
          3D
        </Text>
      </Text>
    </HStack>
  )
}

/** Conteúdo da sidebar — usado fixo no desktop e dentro do drawer no mobile. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <Flex direction="column" h="full">
      <Brand />
      <Separator />
      <Stack as="nav" gap="1" pt="6" pb="4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <NextLink key={href} href={href} onClick={onNavigate}>
              <HStack
                position="relative"
                gap="4"
                ps="8"
                pe="6"
                py="2.5"
                textStyle="sm"
                fontWeight={active ? "bold" : "medium"}
                color={active ? "fg" : "fg.muted"}
                transition="colors"
                transitionDuration="fast"
                _hover={{ color: "fg" }}
              >
                <Box color={active ? "brand.fg" : "inherit"} display="flex">
                  <Icon size={18} />
                </Box>
                {label}
                {active ? (
                  <Box
                    position="absolute"
                    right="0"
                    insetY="1"
                    w="1"
                    roundedStart="full"
                    bgGradient="linear-gradient(180deg, var(--brand-gradient-from), var(--brand-gradient-to))"
                  />
                ) : null}
              </HStack>
            </NextLink>
          )
        })}
      </Stack>
    </Flex>
  )
}

export function AppSidebar() {
  return (
    <Box
      as="aside"
      display={{ base: "none", xl: "block" }}
      position="fixed"
      insetY="0"
      left="0"
      w="72"
      zIndex="docked"
      boxShadow="card"
      style={{
        backgroundColor: "var(--sidebar)",
        color: "var(--sidebar-foreground)",
      }}
    >
      <SidebarContent />
    </Box>
  )
}
