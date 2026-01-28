/**
 * ChartWrapper 元件測試
 * 測試圖表包裝元件的渲染
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { ChartWrapper } from '@/components/reports/chart-wrapper'

describe('ChartWrapper', () => {
  describe('基本渲染', () => {
    it('應正確渲染標題', () => {
      render(
        <ChartWrapper title="銷售報表">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('銷售報表')).toBeInTheDocument()
    })

    it('應正確渲染子元件', () => {
      render(
        <ChartWrapper title="銷售報表">
          <div data-testid="chart-content">圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
      expect(screen.getByText('圖表內容')).toBeInTheDocument()
    })

    it('有描述時應渲染描述', () => {
      render(
        <ChartWrapper title="銷售報表" description="本月銷售趨勢圖">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('本月銷售趨勢圖')).toBeInTheDocument()
    })

    it('無描述時不應渲染描述區域', () => {
      render(
        <ChartWrapper title="銷售報表">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.queryByText('本月銷售趨勢圖')).not.toBeInTheDocument()
    })
  })

  describe('Props 變化', () => {
    it('應套用自訂 className', () => {
      const { container } = render(
        <ChartWrapper title="銷售報表" className="custom-wrapper-class">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      const card = container.querySelector('[data-slot="card"]')
      expect(card).toHaveClass('custom-wrapper-class')
    })

    it('應正確處理空字串描述', () => {
      render(
        <ChartWrapper title="銷售報表" description="">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      // 空字串描述不應渲染描述元素
      const cardHeader = screen.getByText('銷售報表').closest('[data-slot="card-header"]')
      expect(cardHeader).toBeInTheDocument()
    })

    it('使用 rerender 更新標題', () => {
      const { rerender } = render(
        <ChartWrapper title="原始標題">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('原始標題')).toBeInTheDocument()

      rerender(
        <ChartWrapper title="更新後標題">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('更新後標題')).toBeInTheDocument()
      expect(screen.queryByText('原始標題')).not.toBeInTheDocument()
    })

    it('使用 rerender 更新描述', () => {
      const { rerender } = render(
        <ChartWrapper title="標題" description="原始描述">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('原始描述')).toBeInTheDocument()

      rerender(
        <ChartWrapper title="標題" description="更新後描述">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(screen.getByText('更新後描述')).toBeInTheDocument()
      expect(screen.queryByText('原始描述')).not.toBeInTheDocument()
    })
  })

  describe('Card 結構', () => {
    it('應包含 Card 結構元素', () => {
      const { container } = render(
        <ChartWrapper title="銷售報表" description="描述文字">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      // 檢查 Card 結構
      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-description"]')).toBeInTheDocument()
    })

    it('無描述時不應包含 card-description', () => {
      const { container } = render(
        <ChartWrapper title="銷售報表">
          <div>圖表內容</div>
        </ChartWrapper>
      )

      expect(container.querySelector('[data-slot="card-description"]')).not.toBeInTheDocument()
    })
  })

  describe('多個子元件', () => {
    it('應正確渲染多個子元件', () => {
      render(
        <ChartWrapper title="銷售報表">
          <div data-testid="child-1">子元件 1</div>
          <div data-testid="child-2">子元件 2</div>
          <div data-testid="child-3">子元件 3</div>
        </ChartWrapper>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })
  })
})
