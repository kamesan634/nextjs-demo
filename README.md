# 龜三的ERP Demo - Next.js 全端專案

基於 TypeScript + Next.js 15 + React 19 的零售業 ERP 系統全端 Web 應用。

## 技能樹 請點以下技能

| 技能         | 版本   | 說明                   |
| ------------ | ------ | ---------------------- |
| TypeScript   | 5.x    | 程式語言               |
| Next.js      | 15.x   | 核心框架（App Router） |
| React        | 19.x   | UI 框架                |
| Tailwind CSS | 4.x    | 樣式框架               |
| shadcn/ui    | latest | UI 元件庫              |
| Prisma       | 6.x    | ORM 框架               |
| NextAuth.js  | 5.x    | JWT 認證               |
| Zod          | latest | 資料驗證               |
| Zustand      | latest | 狀態管理               |
| PostgreSQL   | 16     | 資料庫                 |
| Vitest       | latest | 單元測試               |
| Playwright   | latest | E2E 測試               |
| Docker       | -      | 容器化佈署             |

## 功能模組

- **accounts** - 帳號管理（使用者、角色、門市、倉庫）
- **products** - 商品管理（商品、分類、單位、稅別）
- **customers** - 客戶管理（會員、會員等級）
- **suppliers** - 供應商管理
- **inventory** - 庫存管理（庫存查詢、異動記錄、盤點、調撥）
- **sales** - 銷售管理（訂單、促銷、優惠券）
- **purchasing** - 採購管理（採購單、驗收）
- **reports** - 報表管理（Dashboard、統計報表）

## 快速開始

### 環境需求

- Docker & Docker Compose
- 或 Node.js 20+ + PostgreSQL 16

### 使用 Docker 佈署（推薦）

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f app

# 停止服務
docker-compose down
```

### 本地開發

```bash
# 安裝相依套件
npm install

# 設定環境變數
cp .env.example .env

# 啟動 PostgreSQL
docker-compose up -d postgres

# 執行資料庫遷移
npm run db:migrate

# 執行種子資料
npm run db:seed

# 啟動開發伺服器
npm run dev
```

## Port

| 服務       | Port | 說明     |
| ---------- | ---- | -------- |
| Next.js    | 3000 | Web 應用 |
| PostgreSQL | 5433 | 資料庫   |

## 頁面功能

啟動服務後，訪問：http://localhost:3000

### 主要頁面

| 頁面       | 路徑             | 說明                     |
| ---------- | ---------------- | ------------------------ |
| 登入       | /login           | 系統登入                 |
| Dashboard  | /                | 首頁儀表板               |
| 商品管理   | /products        | 商品 CRUD                |
| 分類管理   | /categories      | 分類 CRUD                |
| 客戶管理   | /customers       | 客戶 CRUD                |
| 供應商管理 | /suppliers       | 供應商 CRUD              |
| 庫存查詢   | /inventory       | 庫存列表                 |
| 訂單管理   | /orders          | 訂單列表                 |
| 促銷管理   | /promotions      | 促銷 CRUD                |
| 採購管理   | /purchase-orders | 採購單 CRUD              |
| 系統設定   | /settings        | 使用者、角色、門市、倉庫 |

## 測試資訊

### 測試帳號

所有帳號的密碼都是：`password123`

| 帳號        | 角色       | 說明           |
| ----------- | ---------- | -------------- |
| admin       | 系統管理員 | 擁有所有權限   |
| manager01   | 門市店長   | 門市管理權限   |
| cashier01   | 收銀員     | 收銀台操作權限 |
| warehouse01 | 倉管人員   | 倉庫管理權限   |
| purchaser01 | 採購人員   | 採購作業權限   |

### 測試資料

系統已預載以下種子資料：

| 資料類型  | 數量 | 說明                                                  |
| --------- | ---- | ----------------------------------------------------- |
| 角色      | 6    | ADMIN, MANAGER, CASHIER, WAREHOUSE, PURCHASER, VIEWER |
| 門市/倉庫 | 6    | 1 總公司 + 3 門市 + 2 物流中心                        |
| 使用者    | 5    | 含各角色使用者                                        |
| 商品分類  | 8    | 含階層分類                                            |
| 計量單位  | 7    | 個、盒、包、瓶、罐、組、公斤                          |
| 稅別      | 3    | 應稅5%、零稅率、免稅                                  |
| 商品      | 10   | 3C 產品、零食、飲料                                   |
| 會員等級  | 4    | 一般、銀卡、金卡、VIP                                 |
| 會員      | 5    | 不同等級的會員                                        |
| 供應商    | 4    | 各類供應商                                            |
| 庫存      | 10   | 不同門市/倉庫的庫存                                   |
| 促銷活動  | 3    | 各類促銷活動                                          |
| 優惠券    | 3    | 各類優惠券                                            |
| 訂單      | 5    | 含不同狀態的訂單                                      |

## 專案結構

```
nextjs-demo/
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                  # Docker 映像配置
├── package.json                # npm 配置
├── prisma/
│   ├── schema.prisma           # 資料庫 Schema
│   └── seed.ts                 # 種子資料
├── e2e/                        # E2E 測試
├── src/
│   ├── __tests__/              # 單元/整合測試
│   ├── app/
│   │   ├── (auth)/             # 認證頁面（登入）
│   │   ├── (dashboard)/        # 後台管理頁面
│   │   │   ├── products/       # 商品模組
│   │   │   ├── categories/     # 分類模組
│   │   │   ├── customers/      # 客戶模組
│   │   │   ├── suppliers/      # 供應商模組
│   │   │   ├── inventory/      # 庫存模組
│   │   │   ├── orders/         # 訂單模組
│   │   │   ├── purchase-orders/# 採購模組
│   │   │   ├── promotions/     # 促銷模組
│   │   │   ├── reports/        # 報表模組
│   │   │   └── settings/       # 系統設定
│   │   └── api/                # API 路由
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 元件
│   │   ├── layout/             # 佈局元件
│   │   ├── forms/              # 表單元件
│   │   └── data-table/         # 資料表格元件
│   ├── lib/                    # 工具函數
│   ├── actions/                # Server Actions
│   ├── hooks/                  # Custom Hooks
│   ├── types/                  # TypeScript 型別
│   └── stores/                 # Zustand Stores
```

## 資料庫連線

### Docker 環境

- Host: `localhost`
- Port: `5433`
- Database: `nextjsdemo_db`
- Username: `postgres`
- Password: `postgres`

```bash
# 使用 psql 連線
psql -h localhost -p 5433 -U postgres -d nextjsdemo_db

# 或進入 Docker 容器
docker exec -it nextjs-demo-postgres psql -U postgres -d nextjsdemo_db

# 開啟 Prisma Studio
npm run db:studio
```

## 開發指令

```bash
# 開發伺服器
npm run dev

# 建構
npm run build

# 啟動生產環境
npm start

# 程式碼檢查
npm run lint
npm run lint:fix

# 格式化
npm run format

# 資料庫
npm run db:generate    # 產生 Prisma Client
npm run db:migrate     # 執行遷移
npm run db:push        # 推送 Schema
npm run db:seed        # 執行種子資料
npm run db:studio      # 開啟 Prisma Studio

# 測試
npm run test           # 執行單元測試
npm run test:run       # 執行一次測試
npm run test:ui        # 開啟測試 UI
npm run test:coverage  # 測試覆蓋率
npm run test:e2e       # 執行 E2E 測試
npm run test:e2e:ui    # 開啟 E2E 測試 UI
```

## 健康檢查

```bash
# 檢查應用程式健康狀態
curl http://localhost:3000/api/health
```

## License

MIT License
我一開始以為是Made In Taiwan 咧！(羞
