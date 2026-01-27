import { PageHeader } from '@/components/layout'
import { SupplierForm } from '../supplier-form'
import { generateSupplierCode } from '@/actions/suppliers'

export const metadata = {
  title: '新增供應商',
}

/**
 * 新增供應商頁面
 */
export default async function NewSupplierPage() {
  const generatedCode = await generateSupplierCode()

  return (
    <div className="space-y-6">
      <PageHeader title="新增供應商" description="建立新的供應商資料" backHref="/suppliers" />

      <SupplierForm generatedCode={generatedCode} />
    </div>
  )
}
