import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/auth/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CDN Fire Engineering — Inventory & ERP Portal",
  description:
    "Secure inventory and ERP management system for CDN Fire Engineering (Pvt) Ltd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full w-full overflow-x-hidden font-sans bg-[#090e1a] text-gray-100 selection:bg-red-500 selection:text-white">
        {children}
        {/* Global toast notification container */}
        <ToastProvider />
      </body>
    </html>
  );
}
