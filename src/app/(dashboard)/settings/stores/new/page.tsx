import { PageHeader } from '@/components/layout'
import { StoreForm } from '../store-form'

export const metadata = {
  title: '新增門市',
}

/**
 * 新增門市頁面
 */
export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="新增門市" description="建立新的門市據點" />

      <div className="max-w-2xl">
        <StoreForm />
      </div>
    </div>
  )
}
