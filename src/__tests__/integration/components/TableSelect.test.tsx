/**
 * Table 和 Select 元件整合測試
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableCaption,
  TableFooter,
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

describe('Table 元件', () => {
  it('應該正確渲染表格結構', () => {
    render(
      <Table>
        <TableCaption>表格標題</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>欄位一</TableHead>
            <TableHead>欄位二</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>資料一</TableCell>
            <TableCell>資料二</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>頁尾一</TableCell>
            <TableCell>頁尾二</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )

    // 驗證表格結構
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('表格標題')).toBeInTheDocument()

    // 驗證表頭
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(2)
    expect(headers[0]).toHaveTextContent('欄位一')
    expect(headers[1]).toHaveTextContent('欄位二')

    // 驗證資料行和頁尾行
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3) // 1 header row + 1 body row + 1 footer row

    // 驗證儲存格
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(4) // 2 body cells + 2 footer cells
  })

  it('應該正確渲染多筆資料行', () => {
    const data = [
      { id: 1, name: '商品 A', price: 100 },
      { id: 2, name: '商品 B', price: 200 },
      { id: 3, name: '商品 C', price: 300 },
    ]

    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>編號</TableHead>
            <TableHead>名稱</TableHead>
            <TableHead>價格</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

    // 驗證資料行數量
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4) // 1 header + 3 data rows

    // 驗證資料內容
    expect(screen.getByText('商品 A')).toBeInTheDocument()
    expect(screen.getByText('商品 B')).toBeInTheDocument()
    expect(screen.getByText('商品 C')).toBeInTheDocument()

    // 驗證價格
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('應該正確套用自訂 className', () => {
    render(
      <Table className="custom-table">
        <TableHeader className="custom-header">
          <TableRow className="custom-row">
            <TableHead className="custom-head">標題</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell className="custom-cell">內容</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByRole('table')).toHaveClass('custom-table')
    expect(screen.getByRole('columnheader')).toHaveClass('custom-head')
    expect(screen.getByRole('cell')).toHaveClass('custom-cell')
  })

  it('應該正確設定 data-slot 屬性', () => {
    render(
      <Table>
        <TableCaption>標題</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>欄位</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>資料</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>頁尾</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )

    expect(screen.getByRole('table')).toHaveAttribute('data-slot', 'table')
    expect(screen.getByText('標題')).toHaveAttribute('data-slot', 'table-caption')
  })
})

describe('Select 元件', () => {
  it('應該正確渲染 Select 觸發器', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('請選擇')).toBeInTheDocument()
  })

  it('應該在點擊時開啟下拉選單', async () => {
    const { user } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // 驗證下拉選單開啟
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '選項一' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '選項二' })).toBeInTheDocument()
  })

  it('應該在選擇選項後關閉下拉選單並顯示選中值', async () => {
    const { user } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
        </SelectContent>
      </Select>
    )

    // 開啟下拉選單
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // 選擇選項
    const option = screen.getByRole('option', { name: '選項二' })
    await user.click(option)

    // 驗證選單關閉且顯示選中值
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent('選項二')
  })

  it('應該觸發 onValueChange 回呼', async () => {
    const handleChange = vi.fn()

    const { user } = render(
      <Select onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
        </SelectContent>
      </Select>
    )

    // 開啟並選擇
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: '選項一' }))

    expect(handleChange).toHaveBeenCalledWith('option1')
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('應該支援預設值', () => {
    render(
      <Select defaultValue="option2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('選項二')
  })

  it('應該支援 disabled 狀態', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('應該支援不同的 size', () => {
    const { rerender } = render(
      <Select>
        <SelectTrigger size="default">
          <SelectValue placeholder="預設大小" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'default')

    rerender(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="小尺寸" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm')
  })

  it('應該使用鍵盤導航', async () => {
    const handleChange = vi.fn()

    const { user } = render(
      <Select onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項一</SelectItem>
          <SelectItem value="option2">選項二</SelectItem>
          <SelectItem value="option3">選項三</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByRole('combobox')

    // 使用 Enter 開啟選單
    trigger.focus()
    await user.keyboard('{Enter}')

    // 驗證選單開啟
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // 使用方向鍵導航並選擇
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(handleChange).toHaveBeenCalled()
  })
})
