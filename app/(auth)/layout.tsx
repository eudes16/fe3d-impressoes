export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG de 400KB, sem otimização de raster necessária */}
      <img src="/logo.svg" alt="F&E 3D" className="size-16" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
