import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./providers/queryProvider";
import { ThemeProvider } from "next-themes";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistInter = Geist({
  variable: "--font-geist-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://salesflow.codelaicuocdoi.io.vn"),
  title: {
    default: "SalesFlow - Hệ thống CRM Multi-tenant SaaS cho SME",
    template: "%s | SalesFlow CRM",
  },
  description: "SalesFlow là hệ thống quản lý khách hàng (CRM) thông minh thế hệ mới dành cho doanh nghiệp vừa và nhỏ (SME) tại Việt Nam. Tích hợp AI phân tích phễu bán hàng, tự động hóa quy trình chăm sóc khách hàng và cô lập tenant dữ liệu an toàn tuyệt đối.",
  keywords: [
    "CRM",
    "SaaS CRM",
    "CRM Multi-tenant",
    "quản lý khách hàng",
    "phần mềm bán hàng",
    "tự động hóa pipeline",
    "Sales CRM",
    "CRM thông minh",
    "AI CRM",
    "SalesFlow"
  ],
  authors: [{ name: "SalesFlow Team", url: "https://salesflow.codelaicuocdoi.io.vn" }],
  creator: "SalesFlow Developer Group",
  publisher: "SalesFlow CRM",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SalesFlow - Hệ thống CRM Multi-tenant SaaS cho SME",
    description: "Hệ thống quản lý khách hàng CRM thông minh giúp tăng 30% doanh thu, tích hợp AI phân tích và tự động hóa quy trình bán hàng.",
    url: "https://salesflow.codelaicuocdoi.io.vn",
    siteName: "SalesFlow CRM",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalesFlow - Hệ thống CRM Multi-tenant SaaS cho SME",
    description: "Hệ thống quản lý khách hàng CRM thông minh giúp tăng 30% doanh thu, tích hợp AI phân tích và tự động hóa quy trình bán hàng.",
    creator: "@salesflow",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
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
          <Analytics />
          <SpeedInsights/>
        </ThemeProvider>
      </body>
    </html>
  );
}
