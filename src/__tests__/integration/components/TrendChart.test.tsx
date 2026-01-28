/**
 * TrendChart 元件測試
 * 測試趨勢圖（折線圖）元件的渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { TrendChart } from '@/components/reports/trend-chart'

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
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-item-count={data.length}>
      {children}
    </div>
  ),
  Line: ({
    dataKey,
    name,
    stroke,
    strokeWidth,
    type,
  }: {
    dataKey: string
    name: string
    stroke: string
    strokeWidth: number
    type: string
  }) => (
    <div
      data-testid={`line-${dataKey}`}
      data-name={name}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
      data-type={type}
    />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-datakey={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
    <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

describe('TrendChart', () => {
  const mockData = [
    { month: '一月', sales: 4000, revenue: 2400 },
    { month: '二月', sales: 3000, revenue: 1398 },
    { month: '三月', sales: 2000, revenue: 9800 },
    { month: '四月', sales: 2780, revenue: 3908 },
    { month: '五月', sales: 1890, revenue: 4800 },
    { month: '六月', sales: 2390, revenue: 3800 },
  ]

  const mockLines = [
    { key: 'sales', name: '銷售量', color: '#8884d8' },
    { key: 'revenue', name: '營收', color: '#82ca9d' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應正確渲染標題', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByText('銷售趨勢')).toBeInTheDocument()
    })

    it('應渲染描述（如有提供）', () => {
      render(
        <TrendChart
          title="銷售趨勢"
          description="2024年上半年銷售趨勢"
          data={mockData}
          xKey="month"
          lines={mockLines}
        />
      )

      expect(screen.getByText('2024年上半年銷售趨勢')).toBeInTheDocument()
    })

    it('無描述時不應渲染描述', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.queryByText('2024年上半年銷售趨勢')).not.toBeInTheDocument()
    })

    it('應渲染 ResponsiveContainer', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('應渲染 LineChart', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Line 渲染', () => {
    it('應渲染所有 Line 元件', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('line-sales')).toBeInTheDocument()
      expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
    })

    it('Line 應有正確的屬性', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      const salesLine = screen.getByTestId('line-sales')
      expect(salesLine).toHaveAttribute('data-name', '銷售量')
      expect(salesLine).toHaveAttribute('data-stroke', '#8884d8')
      expect(salesLine).toHaveAttribute('data-stroke-width', '2')
      expect(salesLine).toHaveAttribute('data-type', 'monotone')

      const revenueLine = screen.getByTestId('line-revenue')
      expect(revenueLine).toHaveAttribute('data-name', '營收')
      expect(revenueLine).toHaveAttribute('data-stroke', '#82ca9d')
    })

    it('單一 Line 也應正確渲染', () => {
      const singleLine = [{ key: 'sales', name: '銷售量', color: '#8884d8' }]

      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={singleLine} />)

      expect(screen.getByTestId('line-sales')).toBeInTheDocument()
      expect(screen.queryByTestId('line-revenue')).not.toBeInTheDocument()
    })

    it('多條 Line 應正確渲染', () => {
      const multipleLines = [
        { key: 'line1', name: '線條1', color: '#111' },
        { key: 'line2', name: '線條2', color: '#222' },
        { key: 'line3', name: '線條3', color: '#333' },
        { key: 'line4', name: '線條4', color: '#444' },
      ]

      const multiData = mockData.map((item) => ({
        ...item,
        line1: 100,
        line2: 200,
        line3: 300,
        line4: 400,
      }))

      render(<TrendChart title="多線條" data={multiData} xKey="month" lines={multipleLines} />)

      expect(screen.getByTestId('line-line1')).toBeInTheDocument()
      expect(screen.getByTestId('line-line2')).toBeInTheDocument()
      expect(screen.getByTestId('line-line3')).toBeInTheDocument()
      expect(screen.getByTestId('line-line4')).toBeInTheDocument()
    })
  })

  describe('座標軸渲染', () => {
    it('應渲染 XAxis', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    })

    it('XAxis 應使用正確的 dataKey', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-datakey', 'month')
    })

    it('應渲染 YAxis', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    })

    it('應渲染 CartesianGrid', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })
  })

  describe('其他元件渲染', () => {
    it('應渲染 Tooltip', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('應渲染 Legend', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('Props 變化', () => {
    it('應使用預設高度 300', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '300')
    })

    it('應套用自訂高度', () => {
      render(
        <TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} height={450} />
      )

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '450')
    })

    it('使用 rerender 更新資料', () => {
      const { rerender } = render(
        <TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-item-count', '6')

      const newData = [...mockData, { month: '七月', sales: 3500, revenue: 4200 }]

      rerender(<TrendChart title="銷售趨勢" data={newData} xKey="month" lines={mockLines} />)

      expect(screen.getByTestId('line-chart')).toHaveAttribute('data-item-count', '7')
    })

    it('使用 rerender 更新標題', () => {
      const { rerender } = render(
        <TrendChart title="原始標題" data={mockData} xKey="month" lines={mockLines} />
      )

      expect(screen.getByText('原始標題')).toBeInTheDocument()

      rerender(<TrendChart title="更新後標題" data={mockData} xKey="month" lines={mockLines} />)

      expect(screen.getByText('更新後標題')).toBeInTheDocument()
      expect(screen.queryByText('原始標題')).not.toBeInTheDocument()
    })

    it('使用 rerender 更新 lines', () => {
      const { rerender } = render(
        <TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />
      )

      expect(screen.getByTestId('line-sales')).toBeInTheDocument()
      expect(screen.getByTestId('line-revenue')).toBeInTheDocument()

      const newLines = [{ key: 'sales', name: '銷售量', color: '#FF0000' }]

      rerender(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={newLines} />)

      expect(screen.getByTestId('line-sales')).toBeInTheDocument()
      expect(screen.queryByTestId('line-revenue')).not.toBeInTheDocument()
    })
  })

  describe('ChartWrapper 整合', () => {
    it('應包含 Card 結構', () => {
      const { container } = render(
        <TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={mockLines} />
      )

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
    })
  })

  describe('邊界情況', () => {
    it('應處理空資料', () => {
      render(<TrendChart title="銷售趨勢" data={[]} xKey="month" lines={mockLines} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-item-count', '0')
    })

    it('應處理空 lines 陣列', () => {
      render(<TrendChart title="銷售趨勢" data={mockData} xKey="month" lines={[]} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.queryByTestId('line-sales')).not.toBeInTheDocument()
    })

    it('應處理單筆資料', () => {
      const singleData = [{ month: '一月', sales: 4000 }]

      render(
        <TrendChart
          title="銷售趨勢"
          data={singleData}
          xKey="month"
          lines={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-item-count', '1')
    })

    it('應處理大量資料點', () => {
      const largeData = Array.from({ length: 365 }, (_, i) => ({
        day: `Day ${i + 1}`,
        value: Math.random() * 10000,
      }))

      render(
        <TrendChart
          title="年度趨勢"
          data={largeData}
          xKey="day"
          lines={[{ key: 'value', name: '數值', color: '#8884d8' }]}
        />
      )

      const chart = screen.getByTestId('line-chart')
      expect(chart).toHaveAttribute('data-item-count', '365')
    })

    it('應處理零值', () => {
      const zeroData = [
        { month: '一月', sales: 0 },
        { month: '二月', sales: 0 },
      ]

      render(
        <TrendChart
          title="零值趨勢"
          data={zeroData}
          xKey="month"
          lines={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('應處理負值', () => {
      const negativeData = [
        { month: '一月', profit: -1000 },
        { month: '二月', profit: 500 },
        { month: '三月', profit: -500 },
      ]

      render(
        <TrendChart
          title="損益趨勢"
          data={negativeData}
          xKey="month"
          lines={[{ key: 'profit', name: '損益', color: '#8884d8' }]}
        />
      )

      expect(screen.getByTestId('line-profit')).toBeInTheDocument()
    })

    it('應處理大數值', () => {
      const largeValueData = [
        { month: '一月', sales: 1000000000 },
        { month: '二月', sales: 2000000000 },
      ]

      render(
        <TrendChart
          title="大數值"
          data={largeValueData}
          xKey="month"
          lines={[{ key: 'sales', name: '銷售量', color: '#8884d8' }]}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('應處理小數值', () => {
      const decimalData = [
        { month: '一月', rate: 0.123 },
        { month: '二月', rate: 0.456 },
      ]

      render(
        <TrendChart
          title="比率趨勢"
          data={decimalData}
          xKey="month"
          lines={[{ key: 'rate', name: '比率', color: '#8884d8' }]}
        />
      )

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('不同 xKey', () => {
    it('應使用日期作為 xKey', () => {
      const dateData = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ]

      render(
        <TrendChart
          title="日期趨勢"
          data={dateData}
          xKey="date"
          lines={[{ key: 'value', name: '數值', color: '#8884d8' }]}
        />
      )

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-datakey', 'date')
    })

    it('應使用數字作為 xKey', () => {
      const numericData = [
        { index: 1, value: 100 },
        { index: 2, value: 200 },
      ]

      render(
        <TrendChart
          title="數字索引"
          data={numericData}
          xKey="index"
          lines={[{ key: 'value', name: '數值', color: '#8884d8' }]}
        />
      )

      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-datakey', 'index')
    })
  })
})
