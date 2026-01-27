/**
 * Header 元件測試
 * 測試頁首元件的渲染和互動
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { Header } from '@/components/layout/header'
import type { UserSession } from '@/types'

// Mock logout action
vi.mock('@/actions/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('Header', () => {
  const mockUser: UserSession = {
    id: 'user-1',
    username: 'testuser',
    name: '測試使用者',
    email: 'test@example.com',
    role: { code: 'ADMIN', name: '管理員' },
    avatar: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應正確渲染使用者名稱', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByText('測試使用者')).toBeInTheDocument()
  })

  it('應正確渲染使用者角色', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByText('管理員')).toBeInTheDocument()
  })

  it('應顯示使用者頭像縮寫', () => {
    render(<Header user={mockUser} />)

    // 「測試使用者」的縮寫為第一個字「測」
    expect(screen.getByText('測')).toBeInTheDocument()
  })

  it('應渲染手機版選單按鈕', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByRole('button', { name: '切換選單' })).toBeInTheDocument()
  })

  it('應渲染通知按鈕', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByRole('button', { name: '通知' })).toBeInTheDocument()
  })

  it('點擊選單按鈕應觸發 onMenuClick', async () => {
    const onMenuClick = vi.fn()
    const { user } = render(<Header user={mockUser} onMenuClick={onMenuClick} />)

    const menuButton = screen.getByRole('button', { name: '切換選單' })
    await user.click(menuButton)

    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('有門市資訊時應顯示門市名稱', async () => {
    const userWithStore: UserSession = {
      ...mockUser,
      store: { id: 'store-1', name: '台北門市' },
    }
    const { user } = render(<Header user={userWithStore} />)

    // 開啟下拉選單
    const trigger = screen.getByRole('button', { name: /測試使用者/i })
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/台北門市/)).toBeInTheDocument()
    })
  })

  it('應在下拉選單中顯示使用者 email', async () => {
    const { user } = render(<Header user={mockUser} />)

    // 開啟下拉選單
    const trigger = screen.getByRole('button', { name: /測試使用者/i })
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })
})
