import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sign In - CDN Fire Engineering (Pvt) Ltd",
  description: "CDN Fire Engineering Inventory & ERP Management System Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-gray-50 text-gray-900 selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
