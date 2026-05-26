import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VPP — Meu Padrão",
  description:
    "Ferramenta de apoio à observação de padrões pelo método VPP.",
  applicationName: "VPP — Meu Padrão",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-vpp.jpeg",
    apple: "/logo-vpp.jpeg",
  },
  appleWebApp: {
    capable: true,
    title: "Meu Padrão",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2F2A24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}