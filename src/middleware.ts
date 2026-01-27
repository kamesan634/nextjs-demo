import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * 路由保護中間件
 * 驗證使用者身份並控制路由存取
 */
export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // 公開路徑 - 無需登入
  const publicPaths = ['/login', '/api/auth', '/api/health']
  const isPublicPath = publicPaths.some(
    (path) => nextUrl.pathname === path || nextUrl.pathname.startsWith(path + '/')
  )

  // 靜態資源 - 不處理
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 已登入使用者訪問登入頁 -> 重導向到儀表板
  if (isLoggedIn && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // 未登入使用者訪問受保護頁面 -> 重導向到登入頁
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 根路徑處理
  if (nextUrl.pathname === '/') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    } else {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
  }

  return NextResponse.next()
})

// 設定匹配的路由
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
