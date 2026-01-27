import { Suspense } from 'react'
import { getRoles } from '@/actions/roles'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { RoleList } from './role-list'

export const metadata = {
  title: '角色管理',
}

/**
 * 角色管理頁面
 */
export default async function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="角色管理" description="管理系統角色與權限設定，系統內建角色無法刪除" />

      <Suspense fallback={<FormLoading message="載入角色列表中..." />}>
        <RoleListData />
      </Suspense>
    </div>
  )
}

async function RoleListData() {
  const roles = await getRoles()

  return <RoleList roles={roles} />
}
