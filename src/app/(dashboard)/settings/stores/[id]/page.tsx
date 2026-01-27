import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { getStore } from '@/actions/stores'
import { StoreForm } from '../store-form'

export const metadata = {
  title: '編輯門市',
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯門市頁面
 */
export default async function EditStorePage({ params }: PageProps) {
  const { id } = await params
  const store = await getStore(id)

  if (!store) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯門市" description={`編輯門市「${store.name}」的資料`} />

      <div className="max-w-2xl">
        <StoreForm store={store} />
      </div>
    </div>
  )
}
