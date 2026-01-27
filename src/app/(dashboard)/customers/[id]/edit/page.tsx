import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { CustomerForm } from '../../customer-form'
import { getCustomer, getActiveCustomerLevels } from '@/actions/customers'

export const metadata = {
  title: '編輯會員',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 編輯會員頁面
 */
export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params
  const [customer, levels] = await Promise.all([getCustomer(id), getActiveCustomerLevels()])

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="編輯會員"
        description={`編輯會員「${customer.name}」的資料`}
        backHref="/customers"
      />

      <CustomerForm customer={customer} levels={levels} />
    </div>
  )
}
