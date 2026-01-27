import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from './breadcrumb'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  backHref?: string
}

/**
 * 頁面標題元件
 * 包含麵包屑導航、頁面標題和操作按鈕區域
 */
export function PageHeader({ title, description, children, className, backHref }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 麵包屑導航 */}
      <div className="flex items-center gap-4">
        {backHref && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Breadcrumb />
      </div>

      {/* 標題與操作區域 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
