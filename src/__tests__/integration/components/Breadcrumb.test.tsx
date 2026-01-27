/**
 * Breadcrumb 元件測試
 * 測試麵包屑導航元件的渲染
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { Breadcrumb } from '@/components/layout/breadcrumb'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('Breadcrumb', () => {
  it('根路徑應不顯示任何項目', () => {
    mockUsePathname.mockReturnValue('/')

    const { container } = render(<Breadcrumb />)

    // 只有首頁圖示
    expect(container.querySelector('nav')).toBeNull()
  })

  it('應顯示 dashboard 路徑', () => {
    mockUsePathname.mockReturnValue('/dashboard')

    render(<Breadcrumb />)

    expect(screen.getByText('儀表板')).toBeInTheDocument()
  })

  it('應顯示 products 路徑', () => {
    mockUsePathname.mockReturnValue('/products')

    render(<Breadcrumb />)

    expect(screen.getByText('商品管理')).toBeInTheDocument()
  })

  it('應顯示多層路徑', () => {
    mockUsePathname.mockReturnValue('/settings/users')

    render(<Breadcrumb />)

    expect(screen.getByText('系統設定')).toBeInTheDocument()
    expect(screen.getByText('使用者管理')).toBeInTheDocument()
  })

  it('最後一層應為粗體文字而非連結', () => {
    mockUsePathname.mockReturnValue('/products')

    render(<Breadcrumb />)

    const productText = screen.getByText('商品管理')
    expect(productText.tagName).not.toBe('A')
  })

  it('中間層應為連結', () => {
    mockUsePathname.mockReturnValue('/settings/users')

    render(<Breadcrumb />)

    const settingsLink = screen.getByRole('link', { name: '系統設定' })
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  it('應正確處理動態 ID 路由', () => {
    mockUsePathname.mockReturnValue('/products/abc123def456789012345678')

    render(<Breadcrumb />)

    expect(screen.getByText('商品管理')).toBeInTheDocument()
    expect(screen.getByText('詳情')).toBeInTheDocument()
  })

  it('應套用自訂 className', () => {
    mockUsePathname.mockReturnValue('/products')

    const { container } = render(<Breadcrumb className="custom-class" />)

    expect(container.querySelector('nav')).toHaveClass('custom-class')
  })
})
