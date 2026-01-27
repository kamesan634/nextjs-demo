/**
 * PageHeader 元件測試
 * 測試頁面標題元件的渲染
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { PageHeader } from '@/components/layout/page-header'

// Mock Breadcrumb
vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">麵包屑</nav>,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/products',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('PageHeader', () => {
  it('應渲染標題', () => {
    render(<PageHeader title="商品管理" />)

    expect(screen.getByRole('heading', { name: '商品管理' })).toBeInTheDocument()
  })

  it('應渲染描述', () => {
    render(<PageHeader title="商品管理" description="管理所有商品資料" />)

    expect(screen.getByText('管理所有商品資料')).toBeInTheDocument()
  })

  it('無描述時不應渲染描述區域', () => {
    render(<PageHeader title="商品管理" />)

    expect(screen.queryByText('管理所有商品資料')).not.toBeInTheDocument()
  })

  it('應渲染麵包屑導航', () => {
    render(<PageHeader title="商品管理" />)

    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
  })

  it('應渲染 children 作為操作按鈕區域', () => {
    render(
      <PageHeader title="商品管理">
        <button>新增商品</button>
      </PageHeader>
    )

    expect(screen.getByRole('button', { name: '新增商品' })).toBeInTheDocument()
  })

  it('有 backHref 時應顯示返回按鈕', () => {
    render(<PageHeader title="商品詳情" backHref="/products" />)

    const backLink = screen.getByRole('link')
    expect(backLink).toHaveAttribute('href', '/products')
  })

  it('應套用自訂 className', () => {
    const { container } = render(<PageHeader title="商品管理" className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
