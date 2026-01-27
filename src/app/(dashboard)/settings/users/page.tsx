import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getUsers } from '@/actions/users'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { FormLoading } from '@/components/forms'
import { UserList } from './user-list'

export const metadata = {
  title: '使用者管理',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

/**
 * 使用者管理頁面
 */
export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''

  return (
    <div className="space-y-6">
      <PageHeader title="使用者管理" description="管理系統使用者帳號與權限">
        <Button asChild>
          <Link href="/settings/users/new">
            <Plus className="mr-2 h-4 w-4" />
            新增使用者
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<FormLoading message="載入使用者列表中..." />}>
        <UserListData page={page} search={search} />
      </Suspense>
    </div>
  )
}

/**
 * 使用者列表資料元件
 */
async function UserListData({ page, search }: { page: number; search: string }) {
  const { data, pagination } = await getUsers({ page, search })

  return <UserList users={data} pagination={pagination} />
}
