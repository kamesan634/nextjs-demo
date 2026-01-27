import { PageHeader } from '@/components/layout'
import { getRoleOptions } from '@/actions/roles'
import { getStoreOptions } from '@/actions/stores'
import { UserForm } from '../user-form'

export const metadata = {
  title: '新增使用者',
}

/**
 * 新增使用者頁面
 */
export default async function NewUserPage() {
  const [roleOptions, storeOptions] = await Promise.all([getRoleOptions(), getStoreOptions()])

  return (
    <div className="space-y-6">
      <PageHeader title="新增使用者" description="建立新的系統使用者帳號" />

      <div className="max-w-2xl">
        <UserForm roleOptions={roleOptions} storeOptions={storeOptions} />
      </div>
    </div>
  )
}
