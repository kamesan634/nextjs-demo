/**
 * Auth Mock
 * Mock next-auth 和認證相關模組
 */

import { vi } from 'vitest'

// Mock signIn function
export const mockSignIn = vi.fn()

// Mock signOut function
export const mockSignOut = vi.fn()

// Mock revalidatePath
export const mockRevalidatePath = vi.fn()

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

// Mock AuthError class
export class MockAuthError extends Error {
  type: string

  constructor(type: string, message?: string) {
    super(message || type)
    this.type = type
    this.name = 'AuthError'
  }
}

// Reset all auth mocks
export function resetAuthMocks() {
  mockSignIn.mockReset()
  mockSignOut.mockReset()
  mockRevalidatePath.mockReset()
}

const authMocks = {
  mockSignIn,
  mockSignOut,
  mockRevalidatePath,
  MockAuthError,
  resetAuthMocks,
}

export default authMocks
