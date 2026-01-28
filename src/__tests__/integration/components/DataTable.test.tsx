/**
 * DataTable 元件整合測試
 * 測試資料表格相關元件的渲染和互動
 *
 * 測試元件：
 * - DataTable - 資料表格主元件
 * - DataTablePagination - 分頁元件
 * - DataTableSkeleton - 載入骨架
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'

// ===================================
// 測試資料定義
// ===================================

interface TestData {
  id: string
  name: string
  email: string
  status: string
}

const mockColumns: ColumnDef<TestData>[] = [
  { id: 'name', header: '名稱', accessorKey: 'name', sortable: true },
  { id: 'email', header: '電子郵件', accessorKey: 'email' },
  {
    id: 'status',
    header: '狀態',
    cell: (row) => <span className="badge">{row.status}</span>,
  },
]

const mockData: TestData[] = [
  { id: '1', name: '張三', email: 'zhang@example.com', status: '啟用' },
  { id: '2', name: '李四', email: 'li@example.com', status: '停用' },
  { id: '3', name: '王五', email: 'wang@example.com', status: '啟用' },
]

const mockPagination = {
  total: 50,
  page: 1,
  pageSize: 10,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: false,
}

// ===================================
// DataTable 主元件測試
// ===================================

describe('DataTable 元件', () => {
  describe('正確渲染表格資料', () => {
    it('應渲染所有資料列', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      expect(screen.getByText('張三')).toBeInTheDocument()
      expect(screen.getByText('zhang@example.com')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
      expect(screen.getByText('li@example.com')).toBeInTheDocument()
      expect(screen.getByText('王五')).toBeInTheDocument()
      expect(screen.getByText('wang@example.com')).toBeInTheDocument()
    })

    it('應使用 accessorKey 渲染欄位值', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      // accessorKey 直接存取物件屬性
      expect(screen.getByText('張三')).toBeInTheDocument()
      expect(screen.getByText('zhang@example.com')).toBeInTheDocument()
    })

    it('應使用 cell 函式渲染自訂內容', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      // cell 函式渲染的 badge
      const badges = screen.getAllByText(/啟用|停用/)
      expect(badges).toHaveLength(3)
    })

    it('應使用 rowKey 函式作為列的唯一鍵', () => {
      const { container } = render(
        <DataTable columns={mockColumns} data={mockData} rowKey={(row) => row.id} />
      )

      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(3)
    })
  })

  describe('欄位標題顯示', () => {
    it('應渲染所有欄位標題', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      expect(screen.getByText('名稱')).toBeInTheDocument()
      expect(screen.getByText('電子郵件')).toBeInTheDocument()
      expect(screen.getByText('狀態')).toBeInTheDocument()
    })

    it('可排序欄位應顯示排序圖示', () => {
      const { container } = render(
        <DataTable columns={mockColumns} data={mockData} onSort={vi.fn()} />
      )

      // 名稱欄位有 sortable: true，應有排序圖示
      const sortIcons = container.querySelectorAll('svg')
      expect(sortIcons.length).toBeGreaterThan(0)
    })

    it('應套用欄位的 className', () => {
      const columnsWithClass: ColumnDef<TestData>[] = [
        { id: 'name', header: '名稱', accessorKey: 'name', className: 'w-[200px]' },
      ]

      const { container } = render(<DataTable columns={columnsWithClass} data={mockData} />)

      const headerCell = container.querySelector('th')
      expect(headerCell).toHaveClass('w-[200px]')
    })
  })

  describe('空資料顯示', () => {
    it('無資料時應顯示預設空訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} />)

      expect(screen.getByText('無資料')).toBeInTheDocument()
    })

    it('應顯示自訂空訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} emptyMessage="找不到符合條件的資料" />)

      expect(screen.getByText('找不到符合條件的資料')).toBeInTheDocument()
    })

    it('空訊息應跨越所有欄位', () => {
      const { container } = render(<DataTable columns={mockColumns} data={[]} />)

      const emptyCell = container.querySelector('td[colspan]')
      expect(emptyCell).toHaveAttribute('colspan', '3')
    })
  })

  describe('分頁功能', () => {
    it('有 pagination 時應顯示分頁資訊', () => {
      render(<DataTable columns={mockColumns} data={mockData} pagination={mockPagination} />)

      expect(screen.getByText(/共 50 筆資料/)).toBeInTheDocument()
      expect(screen.getByText(/第 1 \/ 5 頁/)).toBeInTheDocument()
    })

    it('點擊下一頁應觸發 onPageChange', async () => {
      const onPageChange = vi.fn()
      const { user } = render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          pagination={mockPagination}
          onPageChange={onPageChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      // 第三個按鈕是下一頁
      const nextPageButton = buttons[2]

      await user.click(nextPageButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('第一頁時上一頁按鈕應被禁用', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          pagination={mockPagination}
          onPageChange={vi.fn()}
        />
      )

      const buttons = screen.getAllByRole('button')
      // 前兩個是 第一頁 和 上一頁
      expect(buttons[0]).toBeDisabled()
      expect(buttons[1]).toBeDisabled()
    })

    it('最後一頁時下一頁按鈕應被禁用', () => {
      const lastPagePagination = {
        ...mockPagination,
        page: 5,
        hasNextPage: false,
        hasPrevPage: true,
      }

      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          pagination={lastPagePagination}
          onPageChange={vi.fn()}
        />
      )

      const buttons = screen.getAllByRole('button')
      // 後兩個是 下一頁 和 最後一頁
      expect(buttons[buttons.length - 1]).toBeDisabled()
      expect(buttons[buttons.length - 2]).toBeDisabled()
    })

    it('有 onPageSizeChange 時應顯示每頁筆數選擇器', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          pagination={mockPagination}
          onPageSizeChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('載入狀態', () => {
    it('isLoading 為 true 時應顯示載入訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} isLoading={true} />)

      expect(screen.getByText('載入中...')).toBeInTheDocument()
    })

    it('載入中時不應顯示資料', () => {
      render(<DataTable columns={mockColumns} data={mockData} isLoading={true} />)

      expect(screen.queryByText('張三')).not.toBeInTheDocument()
      expect(screen.getByText('載入中...')).toBeInTheDocument()
    })

    it('載入訊息應跨越所有欄位', () => {
      const { container } = render(<DataTable columns={mockColumns} data={[]} isLoading={true} />)

      const loadingCell = container.querySelector('td[colspan]')
      expect(loadingCell).toHaveAttribute('colspan', '3')
    })
  })

  describe('搜尋功能', () => {
    it('有 onSearch 時應顯示搜尋欄', () => {
      render(<DataTable columns={mockColumns} data={mockData} onSearch={vi.fn()} />)

      expect(screen.getByPlaceholderText('搜尋...')).toBeInTheDocument()
    })

    it('應顯示自訂搜尋提示文字', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSearch={vi.fn()}
          searchPlaceholder="搜尋商品..."
        />
      )

      expect(screen.getByPlaceholderText('搜尋商品...')).toBeInTheDocument()
    })

    it('輸入搜尋文字應觸發 onSearch', async () => {
      const onSearch = vi.fn()
      const { user } = render(
        <DataTable columns={mockColumns} data={mockData} onSearch={onSearch} />
      )

      const input = screen.getByPlaceholderText('搜尋...')
      await user.type(input, '張三')

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('張三')
      })
    })

    it('點擊清除按鈕應清空搜尋', async () => {
      const onSearch = vi.fn()
      const { user } = render(
        <DataTable columns={mockColumns} data={mockData} onSearch={onSearch} />
      )

      const input = screen.getByPlaceholderText('搜尋...')
      await user.type(input, '測試')

      // 清除按鈕在輸入後出現
      const clearButton = screen.getByRole('button')
      await user.click(clearButton)

      expect(onSearch).toHaveBeenLastCalledWith('')
    })
  })

  describe('排序功能', () => {
    it('點擊可排序欄位應觸發 onSort', async () => {
      const onSort = vi.fn()
      const { user } = render(<DataTable columns={mockColumns} data={mockData} onSort={onSort} />)

      const nameHeader = screen.getByText('名稱')
      await user.click(nameHeader)

      expect(onSort).toHaveBeenCalledWith('name', 'asc')
    })

    it('再次點擊應切換排序方向', async () => {
      const onSort = vi.fn()
      const { user } = render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onSort={onSort}
          sortField="name"
          sortDirection="asc"
        />
      )

      const nameHeader = screen.getByText('名稱')
      await user.click(nameHeader)

      expect(onSort).toHaveBeenCalledWith('name', 'desc')
    })

    it('點擊不可排序欄位不應觸發 onSort', async () => {
      const onSort = vi.fn()
      const { user } = render(<DataTable columns={mockColumns} data={mockData} onSort={onSort} />)

      // 電子郵件欄位沒有 sortable: true
      const emailHeader = screen.getByText('電子郵件')
      await user.click(emailHeader)

      expect(onSort).not.toHaveBeenCalled()
    })
  })

  describe('列點擊', () => {
    it('有 onRowClick 時點擊列應觸發事件', async () => {
      const onRowClick = vi.fn()
      const { user } = render(
        <DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />
      )

      const firstRow = screen.getByText('張三').closest('tr')
      if (firstRow) {
        await user.click(firstRow)
      }

      expect(onRowClick).toHaveBeenCalledWith(mockData[0])
    })

    it('有 onRowClick 時列應有游標樣式', () => {
      render(<DataTable columns={mockColumns} data={mockData} onRowClick={vi.fn()} />)

      const firstRow = screen.getByText('張三').closest('tr')
      expect(firstRow).toHaveClass('cursor-pointer')
    })
  })
})

// ===================================
// DataTablePagination 分頁元件測試
// ===================================

describe('DataTablePagination 元件', () => {
  const defaultProps = {
    page: 1,
    pageSize: 10,
    total: 100,
    totalPages: 10,
    onPageChange: vi.fn(),
  }

  describe('基本渲染', () => {
    it('應顯示分頁資訊', () => {
      render(<DataTablePagination {...defaultProps} />)

      expect(screen.getByText(/共 100 筆資料/)).toBeInTheDocument()
      expect(screen.getByText(/第 1 \/ 10 頁/)).toBeInTheDocument()
    })

    it('總頁數為 0 時應顯示 1', () => {
      render(<DataTablePagination {...defaultProps} total={0} totalPages={0} />)

      expect(screen.getByText(/第 1 \/ 1 頁/)).toBeInTheDocument()
    })
  })

  describe('分頁按鈕', () => {
    it('第一頁時應禁用「第一頁」和「上一頁」按鈕', () => {
      render(<DataTablePagination {...defaultProps} page={1} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toBeDisabled()
      expect(buttons[1]).toBeDisabled()
    })

    it('最後一頁時應禁用「下一頁」和「最後一頁」按鈕', () => {
      render(<DataTablePagination {...defaultProps} page={10} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons[buttons.length - 1]).toBeDisabled()
      expect(buttons[buttons.length - 2]).toBeDisabled()
    })

    it('點擊「第一頁」應跳到第 1 頁', async () => {
      const onPageChange = vi.fn()
      const { user } = render(
        <DataTablePagination {...defaultProps} page={5} onPageChange={onPageChange} />
      )

      const firstPageBtn = screen.getByTitle('第一頁')
      await user.click(firstPageBtn)

      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('點擊「上一頁」應跳到前一頁', async () => {
      const onPageChange = vi.fn()
      const { user } = render(
        <DataTablePagination {...defaultProps} page={5} onPageChange={onPageChange} />
      )

      const prevPageBtn = screen.getByTitle('上一頁')
      await user.click(prevPageBtn)

      expect(onPageChange).toHaveBeenCalledWith(4)
    })

    it('點擊「下一頁」應跳到下一頁', async () => {
      const onPageChange = vi.fn()
      const { user } = render(
        <DataTablePagination {...defaultProps} page={5} onPageChange={onPageChange} />
      )

      const nextPageBtn = screen.getByTitle('下一頁')
      await user.click(nextPageBtn)

      expect(onPageChange).toHaveBeenCalledWith(6)
    })

    it('點擊「最後一頁」應跳到最後一頁', async () => {
      const onPageChange = vi.fn()
      const { user } = render(
        <DataTablePagination {...defaultProps} page={5} onPageChange={onPageChange} />
      )

      const lastPageBtn = screen.getByTitle('最後一頁')
      await user.click(lastPageBtn)

      expect(onPageChange).toHaveBeenCalledWith(10)
    })
  })

  describe('每頁筆數', () => {
    it('無 onPageSizeChange 時不應顯示每頁筆數選擇器', () => {
      render(<DataTablePagination {...defaultProps} />)

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('有 onPageSizeChange 時應顯示每頁筆數選擇器', () => {
      render(<DataTablePagination {...defaultProps} onPageSizeChange={vi.fn()} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('每頁')).toBeInTheDocument()
      expect(screen.getByText('筆')).toBeInTheDocument()
    })

    it('應使用自訂的每頁筆數選項', () => {
      render(
        <DataTablePagination
          {...defaultProps}
          onPageSizeChange={vi.fn()}
          pageSizeOptions={[5, 15, 25]}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})

// ===================================
// DataTableSkeleton 骨架元件測試
// ===================================

describe('DataTableSkeleton 元件', () => {
  describe('基本渲染', () => {
    it('應根據 columnCount 渲染正確數量的欄位', () => {
      const { container } = render(<DataTableSkeleton columnCount={4} />)

      const headerCells = container.querySelectorAll('thead th')
      expect(headerCells).toHaveLength(4)
    })

    it('應根據 rowCount 渲染正確數量的列', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} rowCount={8} />)

      const bodyRows = container.querySelectorAll('tbody tr')
      expect(bodyRows).toHaveLength(8)
    })

    it('預設應渲染 5 列', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      const bodyRows = container.querySelectorAll('tbody tr')
      expect(bodyRows).toHaveLength(5)
    })

    it('每列應有正確數量的儲存格', () => {
      const { container } = render(<DataTableSkeleton columnCount={5} rowCount={3} />)

      const rows = container.querySelectorAll('tbody tr')
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        expect(cells).toHaveLength(5)
      })
    })
  })

  describe('載入狀態顯示', () => {
    it('應渲染 Skeleton 元素', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      // Skeleton 元件使用 animate-pulse 動畫
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('表頭應有骨架載入效果', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      const headerSkeletons = container.querySelectorAll('thead th')
      headerSkeletons.forEach((th) => {
        const skeleton = th.querySelector('[class*="h-4"]')
        expect(skeleton).toBeInTheDocument()
      })
    })
  })

  describe('Header 區域', () => {
    it('預設應顯示 Header', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      const cardHeader = container.querySelector('.space-y-2')
      expect(cardHeader).toBeInTheDocument()
    })

    it('showHeader=false 時不應顯示 Header', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} showHeader={false} />)

      const skeletonTitle = container.querySelector('.h-6.w-32')
      expect(skeletonTitle).not.toBeInTheDocument()
    })
  })

  describe('分頁區域', () => {
    it('預設應顯示分頁骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      const paginationButtons = container.querySelectorAll('.h-9.w-9')
      expect(paginationButtons.length).toBeGreaterThanOrEqual(4)
    })

    it('showPagination=false 時不應顯示分頁骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} showPagination={false} />)

      const paginationArea = container.querySelector('.mt-4.flex.items-center.justify-between')
      expect(paginationArea).not.toBeInTheDocument()
    })
  })

  describe('搜尋與篩選區域', () => {
    it('應渲染搜尋與篩選骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      const searchSkeleton = container.querySelector('.max-w-xs')
      expect(searchSkeleton).toBeInTheDocument()
    })
  })

  describe('組合測試', () => {
    it('無 Header 無分頁時應只渲染表格', () => {
      const { container } = render(
        <DataTableSkeleton columnCount={2} rowCount={3} showHeader={false} showPagination={false} />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(3)

      const firstRowCells = rows[0].querySelectorAll('td')
      expect(firstRowCells).toHaveLength(2)
    })

    it('完整骨架應包含所有區域', () => {
      const { container } = render(<DataTableSkeleton columnCount={4} rowCount={5} />)

      // Header 區域
      expect(container.querySelector('.space-y-2')).toBeInTheDocument()

      // 搜尋區域
      expect(container.querySelector('.max-w-xs')).toBeInTheDocument()

      // 表格區域
      expect(container.querySelector('table')).toBeInTheDocument()
      expect(container.querySelectorAll('thead th')).toHaveLength(4)
      expect(container.querySelectorAll('tbody tr')).toHaveLength(5)

      // 分頁區域
      expect(container.querySelectorAll('.h-9.w-9').length).toBeGreaterThanOrEqual(4)
    })
  })
})
