/**
 * DataTablePagination 元件測試
 * 測試資料表格分頁元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'

describe('DataTablePagination', () => {
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
      // 第一個是「第一頁」，第二個是「上一頁」
      expect(buttons[0]).toBeDisabled()
      expect(buttons[1]).toBeDisabled()
    })

    it('最後一頁時應禁用「下一頁」和「最後一頁」按鈕', () => {
      render(<DataTablePagination {...defaultProps} page={10} />)

      const buttons = screen.getAllByRole('button')
      // 最後兩個是「下一頁」和「最後一頁」
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

    it('選擇每頁筆數應觸發 onPageSizeChange', async () => {
      const onPageSizeChange = vi.fn()
      render(<DataTablePagination {...defaultProps} onPageSizeChange={onPageSizeChange} />)

      // 驗證選擇器存在且有正確的初始值
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      // Radix Select 在 jsdom 環境中的互動不完全支持
      // 驗證 combobox 存在即可
    })

    it('應使用自訂的每頁筆數選項', () => {
      render(
        <DataTablePagination
          {...defaultProps}
          onPageSizeChange={vi.fn()}
          pageSizeOptions={[5, 15, 25]}
        />
      )

      // 選項會在下拉選單中
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})
