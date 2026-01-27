import type { RoleCode } from '@/types'
import type { DefaultSession } from 'next-auth'

/**
 * NextAuth.js 類型擴展
 * 擴展 Session 和 JWT 類型以包含自定義欄位
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      image?: string | null
      role: {
        id: string
        code: RoleCode
        name: string
        permissions: {
          module: string
          action: string
        }[]
      }
      store: {
        id: string
        code: string
        name: string
      } | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    username: string
    email: string
    name: string
    image?: string | null
    role: {
      id: string
      code: RoleCode
      name: string
      permissions: {
        module: string
        action: string
      }[]
    }
    store: {
      id: string
      code: string
      name: string
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: {
      id: string
      code: RoleCode
      name: string
      permissions: {
        module: string
        action: string
      }[]
    }
    store: {
      id: string
      code: string
      name: string
    } | null
  }
}
