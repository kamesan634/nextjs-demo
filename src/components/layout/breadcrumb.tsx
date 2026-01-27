'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 路徑名稱對照表
 */
const pathNames: Record<string, string> = {
  dashboard: '儀表板',
  products: '商品管理',
  categories: '分類管理',
  customers: '客戶管理',
  suppliers: '供應商管理',
  inventory: '庫存管理',
  orders: '訂單管理',
  'purchase-orders': '採購管理',
  promotions: '促銷管理',
  reports: '報表中心',
  settings: '系統設定',
  users: '使用者管理',
  roles: '角色管理',
  stores: '門市管理',
  warehouses: '倉庫管理',
  new: '新增',
  edit: '編輯',
}

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

/**
 * 麵包屑導航元件
 * 自動根據當前路徑產生導航路徑
 */
export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()

  // 解析路徑產生麵包屑項目
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)

    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const isLast = index === segments.length - 1

      // 處理動態路由 ID (如 /products/[id])
      const isId = segment.length > 20 || /^[a-z0-9]{24,}$/i.test(segment)
      const label = isId ? '詳情' : pathNames[segment] || segment

      return { label, href, isLast }
    })
  }

  const items = getBreadcrumbItems()

  if (items.length === 0) {
    return null
  }

  return (
    <nav
      className={cn('flex items-center text-sm text-muted-foreground', className)}
      aria-label="麵包屑導航"
    >
      {/* 首頁連結 */}
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>

      {/* 麵包屑項目 */}
      {items.map((item) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="mx-2 h-4 w-4" />
          {item.isLast ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
