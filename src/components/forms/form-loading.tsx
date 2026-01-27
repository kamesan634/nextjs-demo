import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormLoadingProps {
  className?: string
  message?: string
}

/**
 * 表單載入中元件
 * 在表單載入資料時顯示
 */
export function FormLoading({ className, message = '載入中...' }: FormLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
