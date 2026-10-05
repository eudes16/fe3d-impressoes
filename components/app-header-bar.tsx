"use client"

import { useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import {
  Avatar,
  Box,
  CloseButton,
  Drawer,
  Flex,
  HStack,
  Heading,
  IconButton,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react"
import { LogOut, Menu as MenuIcon } from "lucide-react"

import { signOut } from "@/actions/auth"
import { SidebarContent } from "@/components/app-sidebar"
import { pageTrail } from "@/components/nav-items"
import { ThemeMenu } from "@/components/theme-menu"

function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="start"
    >
      <Drawer.Trigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          rounded="full"
          aria-label="Abrir menu"
          display={{ base: "inline-flex", xl: "none" }}
        >
          <MenuIcon />
        </IconButton>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="72" style={{ backgroundColor: "var(--sidebar)" }}>
            <SidebarContent onNavigate={() => setOpen(false)} />
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

function AccountMenu({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <Box as="button" rounded="full" focusRing="outside" cursor="pointer">
          <Avatar.Root size="sm" colorPalette="brand" variant="solid">
            <Avatar.Fallback name={name || email} />
          </Avatar.Root>
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56" rounded="l3">
            <Box px="3" py="2">
              <Text fontWeight="bold" textStyle="sm">
                👋 Olá, {name || "usuário"}
              </Text>
              <Text textStyle="xs" color="fg.muted" truncate>
                {email}
              </Text>
            </Box>
            <Menu.Separator />
            <Menu.Item
              value="sign-out"
              color="fg.error"
              disabled={pending}
              onSelect={() => startTransition(() => signOut())}
            >
              <LogOut size={16} />
              Sair
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

export function AppHeaderBar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()
  const { crumbs, title } = pageTrail(pathname)

  return (
    <Flex
      as="header"
      position="sticky"
      top="3"
      zIndex="sticky"
      mx={{ base: "3", md: "6" }}
      mt="3"
      px={{ base: "3", md: "4" }}
      py="2"
      rounded="l4"
      align="center"
      justify="space-between"
      gap="4"
      bg="color-mix(in srgb, var(--background) 70%, transparent)"
      backdropFilter="blur(20px)"
    >
      <Box minW="0">
        <Text textStyle="sm" color="fg.muted">
          {crumbs.join(" / ")}
        </Text>
        <Heading
          as="h1"
          textStyle={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          letterSpacing="tight"
          truncate
        >
          {title}
        </Heading>
      </Box>

      <HStack
        gap="2"
        p="2"
        rounded="full"
        bg="bg.subtle"
        boxShadow="card"
        flexShrink="0"
      >
        <MobileNav />
        <ThemeMenu />
        <AccountMenu name={name} email={email} />
      </HStack>
    </Flex>
  )
}
