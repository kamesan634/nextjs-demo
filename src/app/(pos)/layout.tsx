import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'

/**
 * POS 佈局
 * 獨立的全螢幕佈局，不套用 Dashboard 的側邊欄
 */
export default async function POSLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
