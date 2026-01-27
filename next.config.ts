import type { NextConfig } from 'next'

/**
 * Next.js 設定檔
 * 龜三的ERP Demo - 零售業簡易 ERP 系統
 */
const nextConfig: NextConfig = {
  // 嚴格模式 - 幫助識別潛在問題
  reactStrictMode: true,

  // 實驗性功能
  experimental: {
    // 啟用 Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 圖片最佳化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 輸出設定 (用於 Docker 部署)
  output: 'standalone',
}

export default nextConfig
