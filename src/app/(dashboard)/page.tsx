import { redirect } from 'next/navigation'

/**
 * Dashboard 根路徑 - 重導向到儀表板
 */
export default function DashboardRootPage() {
  redirect('/dashboard')
}
