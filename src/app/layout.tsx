import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zoqonyx Email Marketing | Commercial Outreach & Sequence Automation",
  description:
    "Enterprise-grade email marketing and cold outreach automation platform developed by Nawix Tech Solution. Multi-mailbox rotation, automated sequence builder, reply interruption, and deliverability protection.",
  keywords: [
    "cold email outreach",
    "email sequence automation",
    "multi-mailbox rotation",
    "reply detection",
    "deliverability advisor",
    "Nawix Tech Solution",
    "Zoqonyx",
  ],
  authors: [{ name: "Nawix Tech Solution", url: "https://newixtechsolutions.com/" }],
  openGraph: {
    title: "Zoqonyx Email Marketing | Commercial Outreach Platform",
    description:
      "Enterprise email automation platform with multi-tenant architecture, mailbox pooling, spreadsheet ingestion, and real-time deliverability protection.",
    url: "https://newixtechsolutions.com/",
    siteName: "Zoqonyx Email Marketing",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
