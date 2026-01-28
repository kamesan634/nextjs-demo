/**
 * KPICard 元件測試
 * 測試 KPI 卡片元件的渲染
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { KPICard } from '@/components/reports/kpi-card'
import { DollarSign, Users, Package, TrendingUp } from 'lucide-react'

describe('KPICard', () => {
  describe('基本渲染', () => {
    it('應正確渲染標題', () => {
      render(<KPICard title="總銷售額" value="$10,000" />)

      expect(screen.getByText('總銷售額')).toBeInTheDocument()
    })

    it('應正確渲染字串值', () => {
      render(<KPICard title="總銷售額" value="$10,000" />)

      expect(screen.getByText('$10,000')).toBeInTheDocument()
    })

    it('應正確渲染數字值', () => {
      render(<KPICard title="訂單數量" value={150} />)

      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('應正確渲染圖示', () => {
      const { container } = render(<KPICard title="總銷售額" value="$10,000" icon={DollarSign} />)

      // lucide-react 圖示會渲染為 svg 元素
      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })

    it('無圖示時不應渲染圖示區域', () => {
      const { container } = render(<KPICard title="總銷售額" value="$10,000" />)

      const svgIcon = container.querySelector('svg.h-4.w-4.text-muted-foreground')
      expect(svgIcon).not.toBeInTheDocument()
    })
  })

  describe('變化率顯示', () => {
    it('正變化應顯示綠色和向上箭頭', () => {
      const { container } = render(<KPICard title="總銷售額" value="$10,000" change={15.5} />)

      expect(screen.getByText('+15.5% 相較上期')).toBeInTheDocument()

      // 檢查是否有綠色文字樣式
      const changeElement = screen.getByText('+15.5% 相較上期').closest('p')
      expect(changeElement).toHaveClass('text-green-600')

      // 檢查向上箭頭圖示
      const arrowUp = container.querySelector('svg.h-3.w-3')
      expect(arrowUp).toBeInTheDocument()
    })

    it('負變化應顯示紅色和向下箭頭', () => {
      const { container } = render(<KPICard title="總銷售額" value="$10,000" change={-8.3} />)

      expect(screen.getByText('-8.3% 相較上期')).toBeInTheDocument()

      // 檢查是否有紅色文字樣式
      const changeElement = screen.getByText('-8.3% 相較上期').closest('p')
      expect(changeElement).toHaveClass('text-red-600')

      // 檢查向下箭頭圖示
      const arrowDown = container.querySelector('svg.h-3.w-3')
      expect(arrowDown).toBeInTheDocument()
    })

    it('零變化不應顯示箭頭', () => {
      render(<KPICard title="總銷售額" value="$10,000" change={0} />)

      expect(screen.getByText('0.0% 相較上期')).toBeInTheDocument()

      // 零變化不是正也不是負，不應有特殊顏色
      const changeElement = screen.getByText('0.0% 相較上期').closest('p')
      expect(changeElement).not.toHaveClass('text-green-600')
      expect(changeElement).not.toHaveClass('text-red-600')
    })

    it('無變化值時不應渲染變化區域', () => {
      render(<KPICard title="總銷售額" value="$10,000" />)

      expect(screen.queryByText(/相較上期/)).not.toBeInTheDocument()
    })

    it('應正確格式化小數點', () => {
      render(<KPICard title="總銷售額" value="$10,000" change={12.345} />)

      // 應該顯示一位小數
      expect(screen.getByText('+12.3% 相較上期')).toBeInTheDocument()
    })
  })

  describe('Props 變化', () => {
    it('應套用自訂 className', () => {
      const { container } = render(
        <KPICard title="總銷售額" value="$10,000" className="custom-kpi-class" />
      )

      const card = container.querySelector('[data-slot="card"]')
      expect(card).toHaveClass('custom-kpi-class')
    })

    it('使用 rerender 更新值', () => {
      const { rerender } = render(<KPICard title="總銷售額" value="$10,000" />)

      expect(screen.getByText('$10,000')).toBeInTheDocument()

      rerender(<KPICard title="總銷售額" value="$20,000" />)

      expect(screen.getByText('$20,000')).toBeInTheDocument()
      expect(screen.queryByText('$10,000')).not.toBeInTheDocument()
    })

    it('使用 rerender 更新變化率', () => {
      const { rerender } = render(<KPICard title="總銷售額" value="$10,000" change={10} />)

      expect(screen.getByText('+10.0% 相較上期')).toBeInTheDocument()

      rerender(<KPICard title="總銷售額" value="$10,000" change={-5} />)

      expect(screen.getByText('-5.0% 相較上期')).toBeInTheDocument()
    })

    it('使用 rerender 移除變化率', () => {
      const { rerender } = render(<KPICard title="總銷售額" value="$10,000" change={10} />)

      expect(screen.getByText('+10.0% 相較上期')).toBeInTheDocument()

      rerender(<KPICard title="總銷售額" value="$10,000" />)

      expect(screen.queryByText(/相較上期/)).not.toBeInTheDocument()
    })
  })

  describe('不同圖示', () => {
    it('應正確渲染 Users 圖示', () => {
      const { container } = render(<KPICard title="總會員數" value={1500} icon={Users} />)

      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })

    it('應正確渲染 Package 圖示', () => {
      const { container } = render(<KPICard title="商品數量" value={320} icon={Package} />)

      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })

    it('應正確渲染 TrendingUp 圖示', () => {
      const { container } = render(<KPICard title="成長率" value="15%" icon={TrendingUp} />)

      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })
  })

  describe('Card 結構', () => {
    it('應包含正確的 Card 結構', () => {
      const { container } = render(<KPICard title="總銷售額" value="$10,000" change={10} />)

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
    })
  })

  describe('邊界情況', () => {
    it('應處理空字串標題', () => {
      render(<KPICard title="" value="$10,000" />)

      expect(screen.getByText('$10,000')).toBeInTheDocument()
    })

    it('應處理零值', () => {
      render(<KPICard title="總銷售額" value={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('應處理負數值', () => {
      render(<KPICard title="虧損金額" value={-5000} />)

      expect(screen.getByText('-5000')).toBeInTheDocument()
    })

    it('應處理極大變化率', () => {
      render(<KPICard title="成長" value="$10,000" change={999.99} />)

      expect(screen.getByText('+1000.0% 相較上期')).toBeInTheDocument()
    })

    it('應處理極小變化率', () => {
      render(<KPICard title="下降" value="$10,000" change={-99.99} />)

      expect(screen.getByText('-100.0% 相較上期')).toBeInTheDocument()
    })
  })
})
