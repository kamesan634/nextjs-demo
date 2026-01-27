/**
 * DataTableSkeleton 元件測試
 * 測試資料表格骨架載入元件的渲染
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'

describe('DataTableSkeleton', () => {
  describe('基本渲染', () => {
    it('應根據 columnCount 渲染正確數量的欄位', () => {
      const { container } = render(<DataTableSkeleton columnCount={4} />)

      // 表頭應有 4 個欄位
      const headerCells = container.querySelectorAll('thead th')
      expect(headerCells).toHaveLength(4)
    })

    it('應根據 rowCount 渲染正確數量的列', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} rowCount={8} />)

      // 表格內容應有 8 列
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

  describe('Header 區域', () => {
    it('預設應顯示 Header', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      // Card Header 存在
      const cardHeader = container.querySelector('.space-y-2')
      expect(cardHeader).toBeInTheDocument()
    })

    it('showHeader=false 時不應顯示 Header', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} showHeader={false} />)

      // Card Header 中的標題骨架不應存在
      const skeletonTitle = container.querySelector('.h-6.w-32')
      expect(skeletonTitle).not.toBeInTheDocument()
    })
  })

  describe('分頁區域', () => {
    it('預設應顯示分頁骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      // 分頁區域應有 4 個分頁按鈕骨架
      const paginationButtons = container.querySelectorAll('.h-9.w-9')
      expect(paginationButtons.length).toBeGreaterThanOrEqual(4)
    })

    it('showPagination=false 時不應顯示分頁骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} showPagination={false} />)

      // 分頁區域的按鈕骨架不應存在（h-9 w-9 是分頁按鈕的尺寸）
      const paginationArea = container.querySelector('.mt-4.flex.items-center.justify-between')
      expect(paginationArea).not.toBeInTheDocument()
    })
  })

  describe('搜尋與篩選區域', () => {
    it('應渲染搜尋與篩選骨架', () => {
      const { container } = render(<DataTableSkeleton columnCount={3} />)

      // 搜尋欄骨架
      const searchSkeleton = container.querySelector('.max-w-xs')
      expect(searchSkeleton).toBeInTheDocument()
    })
  })

  describe('組合測試', () => {
    it('無 Header 無分頁時應只渲染表格', () => {
      const { container } = render(
        <DataTableSkeleton columnCount={2} rowCount={3} showHeader={false} showPagination={false} />
      )

      // 表格應存在
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      // 應有 3 列 2 欄
      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(3)

      const firstRowCells = rows[0].querySelectorAll('td')
      expect(firstRowCells).toHaveLength(2)
    })
  })
})
