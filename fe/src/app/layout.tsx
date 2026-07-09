import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./providers/queryProvider";
import { ThemeProvider } from "next-themes";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistInter = Geist({
  variable: "--font-geist-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Multi tenant SaaS",
  description: "Hệ thống quản lý khách hàng dành cho SME Việt Nam: pipeline bán hàng, chăm sóc khách hàng, và AI gợi ý follow-up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistInter.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider> 
              {children}
          </QueryProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
