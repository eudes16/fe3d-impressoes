import { Box } from "@chakra-ui/react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh">
      <AppSidebar />
      <Box ms={{ xl: "72" }} minW="0">
        <AppHeader />
        <Box as="main" px={{ base: "3", md: "6" }} pt="4" pb="10">
          {children}
        </Box>
      </Box>
    </Box>
  )
}
