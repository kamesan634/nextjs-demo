import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { getUser } from '@/actions/users'
import { getRoleOptions } from '@/actions/roles'
import { getStoreOptions } from '@/actions/stores'
import { UserForm } from '../user-form'

export const metadata = {
  title: '編輯使用者',
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 編輯使用者頁面
 */
export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params
  const [user, roleOptions, storeOptions] = await Promise.all([
    getUser(id),
    getRoleOptions(),
    getStoreOptions(),
  ])

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="編輯使用者" description={`編輯使用者「${user.name}」的資料`} />

      <div className="max-w-2xl">
        <UserForm user={user} roleOptions={roleOptions} storeOptions={storeOptions} />
      </div>
    </div>
  )
}
