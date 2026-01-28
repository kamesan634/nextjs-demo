import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { RefundForm } from '../refund-form'

export const metadata = {
  title: '新增退貨單',
}

/**
 * 新增退貨單頁面
 */
export default function NewRefundPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="新增退貨單" description="建立新的退換貨單據">
        <Button variant="outline" asChild>
          <Link href="/orders/refunds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </PageHeader>

      <RefundForm />
    </div>
  )
}
