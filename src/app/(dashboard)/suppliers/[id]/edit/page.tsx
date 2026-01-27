import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { SupplierForm } from '../../supplier-form'
import { getSupplier } from '@/actions/suppliers'

export const metadata = {
  title: '編輯供應商',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 編輯供應商頁面
 */
export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params
  const supplier = await getSupplier(id)

  if (!supplier) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="編輯供應商"
        description={`編輯供應商「${supplier.name}」的資料`}
        backHref="/suppliers"
      />

      <SupplierForm supplier={supplier} />
    </div>
  )
}
