import {
  LayoutDashboard,
  Users,
  Printer,
  Boxes,
  Package,
  FileText,
  Settings,
} from "lucide-react"

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/quotes", label: "Orçamentos", icon: FileText },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/printers", label: "Impressoras", icon: Printer },
  { href: "/filaments", label: "Filamentos", icon: Boxes },
  { href: "/consumables", label: "Consumíveis", icon: Package },
  { href: "/settings", label: "Configurações", icon: Settings },
]

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Breadcrumb + título da página atual, derivados da rota (o header fica no
 * layout e não recebe nada das páginas).
 */
export function pageTrail(pathname: string): { crumbs: string[]; title: string } {
  const section = NAV_ITEMS.find((item) => isActive(pathname, item.href))
  if (!section) return { crumbs: ["Páginas"], title: "F&E 3D" }

  if (section.href === "/quotes" && pathname !== "/quotes") {
    const title = pathname === "/quotes/new" ? "Novo orçamento" : "Detalhes do orçamento"
    return { crumbs: ["Páginas", section.label], title }
  }
  return { crumbs: ["Páginas"], title: section.label }
}
