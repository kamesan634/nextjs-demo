import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { RoleCode } from '@/types'
import type { Adapter } from 'next-auth/adapters'

/**
 * NextAuth.js v5 設定
 * 使用 Credentials Provider 進行帳密登入
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 小時
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: '帳號', type: 'text' },
        password: { label: '密碼', type: 'password' },
      },
      async authorize(credentials) {
        // 驗證輸入
        if (!credentials?.username || !credentials?.password) {
          throw new Error('請輸入帳號和密碼')
        }

        const username = credentials.username as string
        const password = credentials.password as string

        // 查詢使用者
        const user = await prisma.user.findUnique({
          where: { username },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            store: true,
          },
        })

        // 使用者不存在
        if (!user) {
          throw new Error('帳號或密碼錯誤')
        }

        // 帳號停用
        if (!user.isActive) {
          throw new Error('此帳號已停用')
        }

        // 驗證密碼
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
          throw new Error('帳號或密碼錯誤')
        }

        // 更新最後登入時間
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // 回傳使用者資訊 (不包含密碼)
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: {
            id: user.role.id,
            code: user.role.code as RoleCode,
            name: user.role.name,
            permissions: user.role.permissions.map((p) => ({
              module: p.module,
              action: p.action,
            })),
          },
          store: user.store
            ? {
                id: user.store.id,
                code: user.store.code,
                name: user.store.name,
              }
            : null,
        }
      },
    }),
  ],
  callbacks: {
    // JWT 回調：將使用者資訊存入 token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username: string }).username
        token.role = (
          user as {
            role: {
              id: string
              code: string
              name: string
              permissions: { module: string; action: string }[]
            }
          }
        ).role
        token.store = (user as { store: { id: string; code: string; name: string } | null }).store
      }
      return token
    },
    // Session 回調：將 token 資訊存入 session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as {
          id: string
          code: RoleCode
          name: string
          permissions: { module: string; action: string }[]
        }
        session.user.store = token.store as { id: string; code: string; name: string } | null
      }
      return session
    },
  },
})

/**
 * 檢查權限
 * @param userRole 使用者角色
 * @param module 模組代碼
 * @param action 操作類型
 * @returns 是否有權限
 */
export function hasPermission(
  userRole: { code: RoleCode; permissions: { module: string; action: string }[] },
  module: string,
  action: string
): boolean {
  // 系統管理員擁有所有權限
  if (userRole.code === 'ADMIN') {
    return true
  }

  // 檢查權限列表
  return userRole.permissions.some((p) => p.module === module && p.action === action)
}

/**
 * 取得使用者可存取的模組清單
 * @param userRole 使用者角色
 * @returns 可存取的模組列表
 */
export function getAccessibleModules(userRole: {
  code: RoleCode
  permissions: { module: string; action: string }[]
}): string[] {
  if (userRole.code === 'ADMIN') {
    return [
      'dashboard',
      'products',
      'categories',
      'customers',
      'suppliers',
      'inventory',
      'orders',
      'purchase-orders',
      'reports',
      'promotions',
      'settings',
    ]
  }

  // 取得有 read 權限的模組
  const modules = new Set<string>()
  userRole.permissions.forEach((p) => {
    if (p.action === 'read') {
      modules.add(p.module)
    }
  })

  return Array.from(modules)
}
