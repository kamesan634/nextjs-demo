import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * 應用程式 Metadata
 */
export const metadata: Metadata = {
  title: {
    default: '龜三的ERP Demo',
    template: '%s | 龜三的ERP Demo',
  },
  description: '零售業簡易 ERP 系統 - Next.js 15 全端專案展示',
  keywords: ['ERP', 'Next.js', 'React', 'TypeScript', 'Prisma', 'PostgreSQL'],
}

/**
 * 根佈局元件
 * 所有頁面的最外層包裹元件
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
