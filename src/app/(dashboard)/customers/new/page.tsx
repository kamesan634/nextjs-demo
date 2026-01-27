import { PageHeader } from '@/components/layout'
import { CustomerForm } from '../customer-form'
import { getActiveCustomerLevels, generateCustomerCode } from '@/actions/customers'

export const metadata = {
  title: '新增會員',
}

/**
 * 新增會員頁面
 */
export default async function NewCustomerPage() {
  const [levels, generatedCode] = await Promise.all([
    getActiveCustomerLevels(),
    generateCustomerCode(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="新增會員" description="建立新的會員資料" backHref="/customers" />

      <CustomerForm levels={levels} generatedCode={generatedCode} />
    </div>
  )
}
