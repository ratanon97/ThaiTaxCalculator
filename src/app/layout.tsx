import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Thai Tax Playground - คำนวณภาษีบุคคลธรรมดา",
  description: "เครื่องมือจำลองและวางแผนภาษีบุคคลธรรมดาไทย คำนวณ RMF, SSF, ประกันชีวิต และค่าลดหย่อนต่างๆ",
  keywords: ["ภาษี", "tax", "RMF", "SSF", "ลดหย่อน", "ประกันชีวิต", "คำนวณภาษี"],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
