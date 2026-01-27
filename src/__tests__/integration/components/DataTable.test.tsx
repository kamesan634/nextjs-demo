/**
 * DataTable 元件測試
 * 測試資料表格元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { DataTable, type ColumnDef } from '@/components/data-table/data-table'

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
]

const mockPagination = {
  total: 50,
  page: 1,
  pageSize: 10,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: false,
}

describe('DataTable', () => {
  describe('基本渲染', () => {
    it('應渲染表頭', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      expect(screen.getByText('名稱')).toBeInTheDocument()
      expect(screen.getByText('電子郵件')).toBeInTheDocument()
      expect(screen.getByText('狀態')).toBeInTheDocument()
    })

    it('應渲染資料列', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      expect(screen.getByText('張三')).toBeInTheDocument()
      expect(screen.getByText('zhang@example.com')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
    })

    it('應使用 cell 函式渲染自訂內容', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)

      const badges = screen.getAllByText(/啟用|停用/)
      expect(badges).toHaveLength(2)
    })

    it('無資料時應顯示空訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} />)

      expect(screen.getByText('無資料')).toBeInTheDocument()
    })

    it('應顯示自訂空訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} emptyMessage="找不到符合條件的資料" />)

      expect(screen.getByText('找不到符合條件的資料')).toBeInTheDocument()
    })

    it('載入中應顯示載入訊息', () => {
      render(<DataTable columns={mockColumns} data={[]} isLoading={true} />)

      expect(screen.getByText('載入中...')).toBeInTheDocument()
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
  })

  describe('排序功能', () => {
    it('可排序欄位應顯示排序圖示', () => {
      const { container } = render(
        <DataTable columns={mockColumns} data={mockData} onSort={vi.fn()} />
      )

      // 名稱欄位有 sortable: true
      const sortIcons = container.querySelectorAll('svg')
      expect(sortIcons.length).toBeGreaterThan(0)
    })

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

      // 找到下一頁按鈕（ChevronRight）
      const buttons = screen.getAllByRole('button')
      const nextPageButton = buttons.find(
        (btn) => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      )

      if (nextPageButton) {
        await user.click(nextPageButton)
      }

      expect(onPageChange).toHaveBeenCalled()
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
  })

  describe('每頁筆數', () => {
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
  })
})
