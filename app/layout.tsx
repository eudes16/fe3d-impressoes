import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/chakra/provider";
import { Toaster } from "@/components/chakra/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F&E 3D",
  description: "Gestão de orçamentos, estoque e produção de impressão 3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // next-themes grava data-theme antes da hidratação.
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning>
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
