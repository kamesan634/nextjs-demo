import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * 首頁 - 重導向處理
 * 根據登入狀態重導向到對應頁面
 */
export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    // 已登入 -> 重導向到儀表板
    redirect('/dashboard')
  } else {
    // 未登入 -> 重導向到登入頁
    redirect('/login')
  }
}
