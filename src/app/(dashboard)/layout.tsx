import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar, Header } from '@/components/layout'
import { Toaster } from '@/components/ui/sonner'
import type { UserSession } from '@/types'

/**
 * Dashboard 佈局
 * 包含側邊欄和頁首的主要應用程式佈局
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 取得當前使用者 session
  const session = await auth()

  // 未登入則重導向到登入頁
  if (!session?.user) {
    redirect('/login')
  }

  // 建立使用者資訊物件
  const user: UserSession = {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email || '',
    name: session.user.name || '',
    avatar: session.user.image,
    role: session.user.role,
    store: session.user.store,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 側邊欄 - 桌面版 */}
      <Sidebar className="hidden lg:flex" />

      {/* 主要內容區域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 頁首 */}
        <Header user={user} />

        {/* 內容區域 */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>

      {/* Toast 通知 */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
