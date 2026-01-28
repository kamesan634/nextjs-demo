import { PageHeader } from '@/components/layout'
import { ImportForm } from './import-form'

export const metadata = {
  title: '商品匯入',
}

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="商品匯入" description="從 Excel 檔案匯入商品資料" backHref="/products" />
      <ImportForm />
    </div>
  )
}
