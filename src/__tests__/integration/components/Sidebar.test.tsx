/**
 * Sidebar 元件測試
 * 測試側邊欄導航元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { Sidebar } from '@/components/layout/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/dashboard'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('Sidebar', () => {
  it('應渲染 Logo 和品牌名稱', () => {
    render(<Sidebar />)

    expect(screen.getByText('ERP Demo')).toBeInTheDocument()
  })

  it('應渲染主要導航項目', () => {
    render(<Sidebar />)

    expect(screen.getByText('儀表板')).toBeInTheDocument()
    expect(screen.getByText('商品管理')).toBeInTheDocument()
    expect(screen.getByText('分類管理')).toBeInTheDocument()
    expect(screen.getByText('客戶管理')).toBeInTheDocument()
    expect(screen.getByText('供應商管理')).toBeInTheDocument()
  })

  it('應渲染營運管理導航項目', () => {
    render(<Sidebar />)

    expect(screen.getByText('庫存管理')).toBeInTheDocument()
    expect(screen.getByText('訂單管理')).toBeInTheDocument()
    expect(screen.getByText('採購管理')).toBeInTheDocument()
    expect(screen.getByText('促銷管理')).toBeInTheDocument()
  })

  it('應渲染報表導航項目', () => {
    render(<Sidebar />)

    expect(screen.getByText('報表中心')).toBeInTheDocument()
  })

  it('應渲染系統設定導航項目', () => {
    render(<Sidebar />)

    expect(screen.getByText('設定')).toBeInTheDocument()
  })

  it('收合狀態應隱藏文字', () => {
    render(<Sidebar isCollapsed={true} />)

    // 收合時不應顯示品牌名稱
    expect(screen.queryByText('ERP Demo')).not.toBeInTheDocument()
  })

  it('收合狀態應保留圖示', () => {
    const { container } = render(<Sidebar isCollapsed={true} />)

    // 應該有導航圖示
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('應套用自訂 className', () => {
    const { container } = render(<Sidebar className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
