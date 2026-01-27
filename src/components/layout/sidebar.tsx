'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Truck,
  Warehouse,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Tag,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  UserCog,
  Shield,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { NavItem, NavGroup } from '@/types'

/**
 * 導航項目設定
 * 定義側邊欄的所有導航項目
 */
const navGroups: NavGroup[] = [
  {
    title: '主要功能',
    items: [
      {
        title: '儀表板',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: '商品管理',
        href: '/products',
        icon: Package,
      },
      {
        title: '分類管理',
        href: '/categories',
        icon: FolderTree,
      },
      {
        title: '客戶管理',
        href: '/customers',
        icon: Users,
      },
      {
        title: '供應商管理',
        href: '/suppliers',
        icon: Truck,
      },
    ],
  },
  {
    title: '營運管理',
    items: [
      {
        title: '庫存管理',
        href: '/inventory',
        icon: Warehouse,
      },
      {
        title: '訂單管理',
        href: '/orders',
        icon: ShoppingCart,
      },
      {
        title: '採購管理',
        href: '/purchase-orders',
        icon: ClipboardList,
      },
      {
        title: '促銷管理',
        href: '/promotions',
        icon: Tag,
      },
    ],
  },
  {
    title: '報表分析',
    items: [
      {
        title: '報表中心',
        href: '/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    title: '系統設定',
    items: [
      {
        title: '設定',
        href: '/settings',
        icon: Settings,
        children: [
          {
            title: '使用者管理',
            href: '/settings/users',
            icon: UserCog,
          },
          {
            title: '角色管理',
            href: '/settings/roles',
            icon: Shield,
          },
          {
            title: '門市管理',
            href: '/settings/stores',
            icon: Store,
          },
          {
            title: '倉庫管理',
            href: '/settings/warehouses',
            icon: Building2,
          },
        ],
      },
    ],
  },
]

/**
 * 側邊欄導航項目元件
 */
function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(
    item.children?.some((child) => pathname.startsWith(child.href)) || false
  )

  const isActive = pathname === item.href
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  // 有子項目的導航
  if (hasChildren) {
    return (
      <div>
        <Button
          variant="ghost"
          className={cn('w-full justify-start', isCollapsed && 'justify-center px-2')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {Icon && <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </Button>
        {isExpanded && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-2">
            {item.children?.map((child) => (
              <NavItemComponent key={child.href} item={child} isCollapsed={isCollapsed} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // 一般導航項目
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'w-full justify-start',
        isCollapsed && 'justify-center px-2',
        isActive && 'bg-secondary font-medium'
      )}
      asChild
    >
      <Link href={item.href}>
        {Icon && <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />}
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    </Button>
  )
}

/**
 * 側邊欄元件
 */
export function Sidebar({
  isCollapsed = false,
  className,
}: {
  isCollapsed?: boolean
  className?: string
}) {
  return (
    <aside
      className={cn('flex flex-col border-r bg-card', isCollapsed ? 'w-16' : 'w-64', className)}
    >
      {/* Logo 區域 */}
      <div className={cn('flex h-14 items-center border-b px-4', isCollapsed && 'justify-center')}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          {!isCollapsed && <span className="font-bold">ERP Demo</span>}
        </Link>
      </div>

      {/* 導航區域 */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-4 px-2">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItemComponent key={item.href} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
