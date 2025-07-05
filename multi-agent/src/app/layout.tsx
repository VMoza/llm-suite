import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-Agent LLM Orchestration Platform",
  description: "Create complex workflows by chaining multiple state-of-the-art LLMs together through a visual drag-and-drop interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav style={{ padding: 12, background: '#18181b', borderBottom: '1px solid #27272a', marginBottom: 0, display: 'flex', gap: 24, position: 'sticky', top: 0, zIndex: 100, height: 56 }}>
          <Link href="/" style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', fontSize: 16, padding: '4px 8px' }}>Home</Link>
          <Link href="/test" style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', fontSize: 16, padding: '4px 8px' }}>Test</Link>
          <Link href="/workflow" style={{ color: '#a5b4fc', fontWeight: 700, textDecoration: 'none', fontSize: 16, padding: '4px 8px' }}>Workflow Editor</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
