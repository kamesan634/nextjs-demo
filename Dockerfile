# ===================================
# 龜三的ERP Demo - Dockerfile
# 多階段建構，優化映像大小
# ===================================

# 階段 1: 相依套件安裝
FROM node:20-alpine AS deps
WORKDIR /app

# 安裝所有相依套件（包含 devDependencies 用於建構）
COPY package*.json ./
RUN npm ci

# 階段 2: 建構
FROM node:20-alpine AS builder
WORKDIR /app

# 複製相依套件
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 複製 prisma schema
COPY prisma ./prisma

# 設定環境變數
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 產生 Prisma Client
RUN npx prisma generate

# 建構 Next.js 應用程式
RUN npm run build

# 階段 3: 執行
FROM node:20-alpine AS runner
WORKDIR /app

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

# 安全性設定 - 使用非 root 使用者
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 設定環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 複製必要檔案
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# 複製 standalone 輸出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 複製 Prisma 客戶端
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 切換到非 root 使用者
USER nextjs

# 暴露埠號
EXPOSE 3000

# 啟動應用程式
CMD ["node", "server.js"]
