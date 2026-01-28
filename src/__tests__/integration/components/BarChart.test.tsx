/**
 * BarChartComponent 元件測試
 * 測試長條圖元件的渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { BarChartComponent } from '@/components/reports/bar-chart'

// Mock recharts 元件
vi.mock('recharts', () => ({
  ResponsiveContainer: ({
    children,
    width,
    height,
  }: {
    children: React.ReactNode
    width: string
    height: number
  }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  BarChart: ({
    children,
    data,
    layout,
  }: {
    children: React.ReactNode
    data: unknown[]
    layout: string
  }) => (
    <div data-testid="bar-chart" data-layout={layout} data-item-count={data.length}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name, fill }: { dataKey: string; name: string; fill: string }) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} data-fill={fill} />
  ),
  XAxis: ({ dataKey, type }: { dataKey?: string; type?: string }) => (
    <div data-testid="x-axis" data-datakey={dataKey} data-type={type} />
  ),
  YAxis: ({ dataKey, type, width }: { dataKey?: string; type?: string; width?: number }) => (
    <div data-testid="y-axis" data-datakey={dataKey} data-type={type} data-width={width} />
  ),
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
    <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

describe('BarChartComponent', () => {
  const mockData = [
    { name: '一月', sales: 4000, revenue: 2400 },
    { name: '二月', sales: 3000, revenue: 1398 },
    { name: '三月', sales: 2000, revenue: 9800 },
  ]

  const mockBars = [
    { key: 'sales', name: '銷售量', color: '#8884d8' },
    { key: 'revenue', name: '營收', color: '#82ca9d' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應正確渲染標題', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByText('銷售報表')).toBeInTheDocument()
    })

    it('應渲染描述（如有提供）', () => {
      render(
        <BarChartComponent
          title="銷售報表"
          description="2024年第一季銷售數據"
          data={mockData}
          xKey="name"
          bars={mockBars}
        />
      )

      expect(screen.getByText('2024年第一季銷售數據')).toBeInTheDocument()
    })

    it('無描述時不應渲染描述', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.queryByText('2024年第一季銷售數據')).not.toBeInTheDocument()
    })

    it('應渲染 ResponsiveContainer', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('應渲染 BarChart', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('Bar 渲染', () => {
    it('應渲染所有 Bar 元件', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('bar-sales')).toBeInTheDocument()
      expect(screen.getByTestId('bar-revenue')).toBeInTheDocument()
    })

    it('Bar 應有正確的屬性', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      const salesBar = screen.getByTestId('bar-sales')
      expect(salesBar).toHaveAttribute('data-name', '銷售量')
      expect(salesBar).toHaveAttribute('data-fill', '#8884d8')

      const revenueBar = screen.getByTestId('bar-revenue')
      expect(revenueBar).toHaveAttribute('data-name', '營收')
      expect(revenueBar).toHaveAttribute('data-fill', '#82ca9d')
    })

    it('單一 Bar 也應正確渲染', () => {
      const singleBar = [{ key: 'sales', name: '銷售量', color: '#8884d8' }]

      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={singleBar} />)

      expect(screen.getByTestId('bar-sales')).toBeInTheDocument()
      expect(screen.queryByTestId('bar-revenue')).not.toBeInTheDocument()
    })
  })

  describe('座標軸渲染', () => {
    it('應渲染 XAxis', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    })

    it('應渲染 YAxis', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })

    it('應渲染 CartesianGrid', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })
  })

  describe('其他元件渲染', () => {
    it('應渲染 Tooltip', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('應渲染 Legend', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('Props 變化', () => {
    it('應使用預設高度 300', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '300')
    })

    it('應套用自訂高度', () => {
      render(
        <BarChartComponent
          title="銷售報表"
          data={mockData}
          xKey="name"
          bars={mockBars}
          height={500}
        />
      )

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '500')
    })

    it('預設 layout 應為 horizontal', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />)

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-layout', 'horizontal')
    })

    it('應套用 vertical layout', () => {
      render(
        <BarChartComponent
          title="銷售報表"
          data={mockData}
          xKey="name"
          bars={mockBars}
          layout="vertical"
        />
      )

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-layout', 'vertical')
    })

    it('使用 rerender 更新資料', () => {
      const { rerender } = render(
        <BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />
      )

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-item-count', '3')

      const newData = [...mockData, { name: '四月', sales: 5000, revenue: 3000 }]

      rerender(<BarChartComponent title="銷售報表" data={newData} xKey="name" bars={mockBars} />)

      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-item-count', '4')
    })

    it('使用 rerender 更新標題', () => {
      const { rerender } = render(
        <BarChartComponent title="原始標題" data={mockData} xKey="name" bars={mockBars} />
      )

      expect(screen.getByText('原始標題')).toBeInTheDocument()

      rerender(<BarChartComponent title="更新後標題" data={mockData} xKey="name" bars={mockBars} />)

      expect(screen.getByText('更新後標題')).toBeInTheDocument()
      expect(screen.queryByText('原始標題')).not.toBeInTheDocument()
    })
  })

  describe('ChartWrapper 整合', () => {
    it('應包含 Card 結構', () => {
      const { container } = render(
        <BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={mockBars} />
      )

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
    })
  })

  describe('邊界情況', () => {
    it('應處理空資料', () => {
      render(<BarChartComponent title="銷售報表" data={[]} xKey="name" bars={mockBars} />)

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-item-count', '0')
    })

    it('應處理空 bars 陣列', () => {
      render(<BarChartComponent title="銷售報表" data={mockData} xKey="name" bars={[]} />)

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.queryByTestId('bar-sales')).not.toBeInTheDocument()
    })

    it('應處理單筆資料', () => {
      const singleData = [{ name: '一月', sales: 4000 }]

      render(
        <BarChartComponent
          title="銷售報表"
          data={singleData}
          xKey="name"
          bars={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-item-count', '1')
    })

    it('應處理大量資料', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        name: `項目${i + 1}`,
        sales: Math.random() * 10000,
      }))

      render(
        <BarChartComponent
          title="銷售報表"
          data={largeData}
          xKey="name"
          bars={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-item-count', '100')
    })
  })

  describe('不同 xKey', () => {
    it('應使用自訂 xKey', () => {
      const customData = [
        { category: '電子產品', sales: 4000 },
        { category: '服飾', sales: 3000 },
      ]

      render(
        <BarChartComponent
          title="分類銷售"
          data={customData}
          xKey="category"
          bars={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-datakey', 'category')
    })
  })
})
