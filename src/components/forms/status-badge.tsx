import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/**
 * 狀態對照表類型
 */
interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

/**
 * 訂單狀態對照表
 */
export const orderStatusMap: Record<string, StatusConfig> = {
  PENDING: { label: '待處理', variant: 'secondary' },
  CONFIRMED: { label: '已確認', variant: 'default', className: 'bg-blue-500' },
  COMPLETED: { label: '已完成', variant: 'default', className: 'bg-green-500' },
  CANCELLED: { label: '已取消', variant: 'destructive' },
}

/**
 * 付款狀態對照表
 */
export const paymentStatusMap: Record<string, StatusConfig> = {
  UNPAID: { label: '未付款', variant: 'destructive' },
  PARTIAL: { label: '部分付款', variant: 'secondary', className: 'bg-yellow-500 text-white' },
  PAID: { label: '已付款', variant: 'default', className: 'bg-green-500' },
}

/**
 * 採購單狀態對照表
 */
export const purchaseOrderStatusMap: Record<string, StatusConfig> = {
  DRAFT: { label: '草稿', variant: 'outline' },
  PENDING: { label: '待核准', variant: 'secondary' },
  APPROVED: { label: '已核准', variant: 'default', className: 'bg-blue-500' },
  ORDERED: { label: '已下單', variant: 'default', className: 'bg-indigo-500' },
  PARTIAL: { label: '部分到貨', variant: 'secondary', className: 'bg-yellow-500 text-white' },
  COMPLETED: { label: '已完成', variant: 'default', className: 'bg-green-500' },
  CANCELLED: { label: '已取消', variant: 'destructive' },
}

/**
 * 庫存異動類型對照表
 */
export const inventoryMovementTypeMap: Record<string, StatusConfig> = {
  IN: { label: '入庫', variant: 'default', className: 'bg-green-500' },
  OUT: { label: '出庫', variant: 'default', className: 'bg-red-500' },
  ADJUST: { label: '調整', variant: 'secondary' },
  TRANSFER: { label: '調撥', variant: 'default', className: 'bg-blue-500' },
}

/**
 * 啟用/停用狀態對照表
 */
export const activeStatusMap: Record<string, StatusConfig> = {
  true: { label: '啟用', variant: 'default', className: 'bg-green-500' },
  false: { label: '停用', variant: 'destructive' },
}

interface StatusBadgeProps {
  status: string
  statusMap: Record<string, StatusConfig>
  className?: string
}

/**
 * 狀態標籤元件
 * 根據狀態對照表顯示對應的標籤樣式
 */
export function StatusBadge({ status, statusMap, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'outline' as const }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

/**
 * 啟用狀態標籤
 */
export function ActiveBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  return <StatusBadge status={String(isActive)} statusMap={activeStatusMap} className={className} />
}
