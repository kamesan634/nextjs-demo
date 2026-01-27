import { redirect } from 'next/navigation'

/**
 * 系統設定頁面 - 重導向到使用者管理
 */
export default function SettingsPage() {
  redirect('/settings/users')
}
