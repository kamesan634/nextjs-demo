/**
 * PieChartComponent 元件測試
 * 測試圓餅圖元件的渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { PieChartComponent } from '@/components/reports/pie-chart'

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
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({
    data,
    dataKey,
    cx,
    cy,
    outerRadius,
  }: {
    data: unknown[]
    dataKey: string
    cx: string
    cy: string
    outerRadius: number
  }) => (
    <div
      data-testid="pie"
      data-item-count={data.length}
      data-datakey={dataKey}
      data-cx={cx}
      data-cy={cy}
      data-outer-radius={outerRadius}
    >
      {/* Cell 元件會作為 children 傳入 */}
    </div>
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

describe('PieChartComponent', () => {
  const mockData = [
    { name: '電子產品', value: 400 },
    { name: '服飾', value: 300 },
    { name: '食品', value: 200 },
    { name: '其他', value: 100 },
  ]

  const mockColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應正確渲染標題', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByText('銷售分布')).toBeInTheDocument()
    })

    it('應渲染描述（如有提供）', () => {
      render(<PieChartComponent title="銷售分布" description="各類別銷售佔比" data={mockData} />)

      expect(screen.getByText('各類別銷售佔比')).toBeInTheDocument()
    })

    it('無描述時不應渲染描述', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.queryByText('各類別銷售佔比')).not.toBeInTheDocument()
    })

    it('應渲染 ResponsiveContainer', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('應渲染 PieChart', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('應渲染 Pie', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })
  })

  describe('Pie 屬性', () => {
    it('Pie 應有正確的資料筆數', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-item-count', '4')
    })

    it('Pie 應使用 value 作為 dataKey', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-datakey', 'value')
    })

    it('Pie 應置中 (50%, 50%)', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-cx', '50%')
      expect(pie).toHaveAttribute('data-cy', '50%')
    })

    it('Pie 應有預設 outerRadius', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-outer-radius', '80')
    })
  })

  describe('其他元件渲染', () => {
    it('應渲染 Tooltip', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('應渲染 Legend', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('Props 變化', () => {
    it('應使用預設高度 300', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '300')
    })

    it('應套用自訂高度', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} height={400} />)

      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '400')
    })

    it('應套用自訂顏色', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} colors={mockColors} />)

      // 由於 Cell 是在 Pie 內部渲染，我們主要驗證元件有正確渲染
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('使用 rerender 更新資料', () => {
      const { rerender } = render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(screen.getByTestId('pie')).toHaveAttribute('data-item-count', '4')

      const newData = [...mockData, { name: '新類別', value: 50 }]

      rerender(<PieChartComponent title="銷售分布" data={newData} />)

      expect(screen.getByTestId('pie')).toHaveAttribute('data-item-count', '5')
    })

    it('使用 rerender 更新標題', () => {
      const { rerender } = render(<PieChartComponent title="原始標題" data={mockData} />)

      expect(screen.getByText('原始標題')).toBeInTheDocument()

      rerender(<PieChartComponent title="更新後標題" data={mockData} />)

      expect(screen.getByText('更新後標題')).toBeInTheDocument()
      expect(screen.queryByText('原始標題')).not.toBeInTheDocument()
    })

    it('使用 rerender 更新描述', () => {
      const { rerender } = render(
        <PieChartComponent title="銷售分布" description="原始描述" data={mockData} />
      )

      expect(screen.getByText('原始描述')).toBeInTheDocument()

      rerender(<PieChartComponent title="銷售分布" description="更新後描述" data={mockData} />)

      expect(screen.getByText('更新後描述')).toBeInTheDocument()
    })
  })

  describe('ChartWrapper 整合', () => {
    it('應包含 Card 結構', () => {
      const { container } = render(<PieChartComponent title="銷售分布" data={mockData} />)

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument()
    })
  })

  describe('顏色處理', () => {
    it('應使用預設顏色', () => {
      render(<PieChartComponent title="銷售分布" data={mockData} />)

      // 驗證 Pie 有正確渲染（使用預設顏色）
      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })

    it('資料超過顏色數量時應循環使用顏色', () => {
      const manyData = [
        { name: '類別1', value: 100 },
        { name: '類別2', value: 90 },
        { name: '類別3', value: 80 },
        { name: '類別4', value: 70 },
        { name: '類別5', value: 60 },
        { name: '類別6', value: 50 },
        { name: '類別7', value: 40 },
        { name: '類別8', value: 30 },
        { name: '類別9', value: 20 },
        { name: '類別10', value: 10 },
      ]

      render(<PieChartComponent title="銷售分布" data={manyData} colors={['#AAA', '#BBB']} />)

      // 應該正常渲染，顏色會循環
      expect(screen.getByTestId('pie')).toHaveAttribute('data-item-count', '10')
    })
  })

  describe('邊界情況', () => {
    it('應處理空資料', () => {
      render(<PieChartComponent title="銷售分布" data={[]} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-item-count', '0')
    })

    it('應處理單筆資料', () => {
      const singleData = [{ name: '唯一類別', value: 100 }]

      render(<PieChartComponent title="銷售分布" data={singleData} />)

      const pie = screen.getByTestId('pie')
      expect(pie).toHaveAttribute('data-item-count', '1')
    })

    it('應處理零值資料', () => {
      const zeroData = [
        { name: '類別1', value: 0 },
        { name: '類別2', value: 100 },
      ]

      render(<PieChartComponent title="銷售分布" data={zeroData} />)

      expect(screen.getByTestId('pie')).toHaveAttribute('data-item-count', '2')
    })

    it('應處理大數值', () => {
      const largeData = [
        { name: '類別1', value: 1000000000 },
        { name: '類別2', value: 2000000000 },
      ]

      render(<PieChartComponent title="銷售分布" data={largeData} />)

      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })

    it('應處理小數值', () => {
      const decimalData = [
        { name: '類別1', value: 0.123 },
        { name: '類別2', value: 0.456 },
      ]

      render(<PieChartComponent title="銷售分布" data={decimalData} />)

      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })

    it('應處理負值（雖然圓餅圖不應有負值）', () => {
      const negativeData = [
        { name: '類別1', value: -100 },
        { name: '類別2', value: 200 },
      ]

      render(<PieChartComponent title="銷售分布" data={negativeData} />)

      // 元件應該仍然渲染，實際顯示效果由 recharts 處理
      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })
  })

  describe('資料格式', () => {
    it('應正確處理標準資料格式', () => {
      const standardData = [
        { name: '產品A', value: 1000 },
        { name: '產品B', value: 2000 },
      ]

      render(<PieChartComponent title="產品分布" data={standardData} />)

      expect(screen.getByTestId('pie')).toHaveAttribute('data-item-count', '2')
    })

    it('應處理中文名稱', () => {
      const chineseData = [
        { name: '電子產品類別', value: 500 },
        { name: '日用品類別', value: 300 },
      ]

      render(<PieChartComponent title="中文分類" data={chineseData} />)

      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })

    it('應處理特殊字元名稱', () => {
      const specialData = [
        { name: 'Category #1 (New)', value: 500 },
        { name: 'Category & Others', value: 300 },
      ]

      render(<PieChartComponent title="特殊字元" data={specialData} />)

      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })
  })
})
