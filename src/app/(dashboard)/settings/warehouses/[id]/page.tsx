import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { getWarehouse } from '@/actions/warehouses'
import { WarehouseForm } from '../warehouse-form'

export const metadata = {
  title: '編輯倉庫',
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯倉庫頁面
 */
export default async function EditWarehousePage({ params }: PageProps) {
  const { id } = await params
  const warehouse = await getWarehouse(id)

  if (!warehouse) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯倉庫" description={`編輯倉庫「${warehouse.name}」的資料`} />

      <div className="max-w-2xl">
        <WarehouseForm warehouse={warehouse} />
      </div>
    </div>
  )
}
