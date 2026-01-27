import { PageHeader } from '@/components/layout'
import { WarehouseForm } from '../warehouse-form'

export const metadata = {
  title: '新增倉庫',
}

/**
 * 新增倉庫頁面
 */
export default function NewWarehousePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="新增倉庫" description="建立新的倉庫據點" />

      <div className="max-w-2xl">
        <WarehouseForm />
      </div>
    </div>
  )
}
