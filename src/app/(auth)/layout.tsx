/**
 * 認證頁面佈局
 * 用於登入、註冊等不需要側邊欄的頁面
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  )
}
