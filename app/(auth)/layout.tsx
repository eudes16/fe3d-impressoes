export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-muted/30 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--chart-1),transparent_85%),transparent),radial-gradient(50%_40%_at_100%_100%,color-mix(in_oklch,var(--chart-2),transparent_88%),transparent)]"
      />
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de 400KB, sem otimização de raster necessária */}
        <img src="/logo.svg" alt="F&E 3D" className="relative size-16" />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
