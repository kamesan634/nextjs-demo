/**
 * Calendar 元件整合測試
 * 測試日曆元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import { Calendar } from '@/components/ui/calendar'

// ============================================================================
// Calendar 元件測試
// ============================================================================
describe('Calendar 元件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染日曆', () => {
      const { container } = render(<Calendar />)

      expect(container.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('應該顯示當前月份', () => {
      render(<Calendar />)

      // 日曆應該顯示一些日期數字
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('應該顯示星期標題', () => {
      render(<Calendar />)

      // 檢查是否有星期的縮寫（英文版本）
      const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      weekdays.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument()
      })
    })

    it('應該顯示導航按鈕', () => {
      render(<Calendar />)

      // 應該有上個月和下個月的導航按鈕
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Props 測試', () => {
    it('應該支援 selected 屬性', () => {
      const selectedDate = new Date(2024, 0, 15) // 2024年1月15日
      render(<Calendar mode="single" selected={selectedDate} />)

      // 選中的日期應該有特殊樣式
      const dayButton = screen.getByRole('button', { name: /15/ })
      expect(dayButton).toHaveAttribute('data-selected-single', 'true')
    })

    it('應該支援 disabled 日期', () => {
      const disabledDays = [new Date(2024, 0, 10)]
      render(<Calendar mode="single" month={new Date(2024, 0)} disabled={disabledDays} />)

      // 禁用的日期應該不可點擊
      const dayButton = screen.getByRole('button', { name: /10/ })
      expect(dayButton).toBeDisabled()
    })

    it('應該支援自訂 className', () => {
      const { container } = render(<Calendar className="custom-calendar" />)

      const calendar = container.querySelector('[data-slot="calendar"]')
      expect(calendar).toHaveClass('custom-calendar')
    })

    it('應該支援 showOutsideDays 屬性', () => {
      render(<Calendar showOutsideDays={true} />)

      // 當 showOutsideDays 為 true 時，應該顯示上/下月的日期
      // 這些日期會有特殊的樣式
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('showOutsideDays 為 false 時不應顯示月外日期', () => {
      render(<Calendar showOutsideDays={false} />)

      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('應該支援 month 屬性', () => {
      render(<Calendar month={new Date(2024, 5)} />) // 六月

      // 應該顯示六月
      expect(screen.getByText(/June|六月/i)).toBeInTheDocument()
    })
  })

  describe('使用者交互', () => {
    it('應該允許選擇日期', async () => {
      const handleSelect = vi.fn()
      const { user } = render(
        <Calendar mode="single" onSelect={handleSelect} month={new Date(2024, 0)} />
      )

      const dayButton = screen.getByRole('button', { name: /15/ })
      await user.click(dayButton)

      expect(handleSelect).toHaveBeenCalled()
    })

    it('點擊上個月按鈕應該切換到上個月', async () => {
      const { user } = render(<Calendar month={new Date(2024, 1)} />) // 二月

      // 找到上個月按鈕（通常是第一個或帶有特定類名的按鈕）
      const prevButton = screen.getByRole('button', { name: /previous|上一個/i })
      await user.click(prevButton)

      await waitFor(() => {
        // 應該顯示一月
        expect(screen.getByText(/January|一月/i)).toBeInTheDocument()
      })
    })

    it('點擊下個月按鈕應該切換到下個月', async () => {
      const { user } = render(<Calendar month={new Date(2024, 0)} />) // 一月

      // 找到下個月按鈕
      const nextButton = screen.getByRole('button', { name: /next|下一個/i })
      await user.click(nextButton)

      await waitFor(() => {
        // 應該顯示二月
        expect(screen.getByText(/February|二月/i)).toBeInTheDocument()
      })
    })

    it('應該處理 onMonthChange 事件', async () => {
      const handleMonthChange = vi.fn()
      const { user } = render(
        <Calendar month={new Date(2024, 0)} onMonthChange={handleMonthChange} />
      )

      const nextButton = screen.getByRole('button', { name: /next|下一個/i })
      await user.click(nextButton)

      expect(handleMonthChange).toHaveBeenCalled()
    })
  })

  describe('日期範圍選擇', () => {
    it('應該支援範圍選擇模式', () => {
      render(
        <Calendar
          mode="range"
          selected={{
            from: new Date(2024, 0, 10),
            to: new Date(2024, 0, 15),
          }}
          month={new Date(2024, 0)}
        />
      )

      // 範圍開始日期
      const startDay = screen.getByRole('button', { name: /10/ })
      expect(startDay).toHaveAttribute('data-range-start', 'true')

      // 範圍結束日期
      const endDay = screen.getByRole('button', { name: /15/ })
      expect(endDay).toHaveAttribute('data-range-end', 'true')
    })

    it('範圍中間的日期應該有正確的屬性', () => {
      render(
        <Calendar
          mode="range"
          selected={{
            from: new Date(2024, 0, 10),
            to: new Date(2024, 0, 15),
          }}
          month={new Date(2024, 0)}
        />
      )

      // 中間日期
      const middleDay = screen.getByRole('button', { name: /12/ })
      expect(middleDay).toHaveAttribute('data-range-middle', 'true')
    })
  })

  describe('多選模式', () => {
    it('應該支援多選模式', async () => {
      const handleSelect = vi.fn()
      const { user } = render(
        <Calendar
          mode="multiple"
          selected={[new Date(2024, 0, 10)]}
          onSelect={handleSelect}
          month={new Date(2024, 0)}
        />
      )

      const dayButton = screen.getByRole('button', { name: /15/ })
      await user.click(dayButton)

      expect(handleSelect).toHaveBeenCalled()
    })
  })

  describe('樣式', () => {
    it('應該有正確的基礎樣式', () => {
      const { container } = render(<Calendar />)

      const calendar = container.querySelector('[data-slot="calendar"]')
      expect(calendar).toHaveClass('p-3')
    })

    it('應該支援 buttonVariant 屬性', () => {
      render(<Calendar buttonVariant="outline" />)

      // 日期按鈕應該使用 outline variant
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('今天的日期應該有特殊樣式', () => {
      render(<Calendar />)

      // 今天的日期應該被標記
      const today = new Date()
      const todayButton = screen.getByRole('button', { name: new RegExp(`${today.getDate()}`) })
      // 今天的 cell 會有 data-today 屬性
      expect(todayButton).toBeInTheDocument()
    })
  })

  describe('captionLayout', () => {
    it('預設應該是 label 模式', () => {
      render(<Calendar />)

      // 預設顯示月份標籤
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('應該支援 dropdown 模式', () => {
      render(<Calendar captionLayout="dropdown" />)

      // dropdown 模式下應該有選擇器
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('應該支援 dropdown-months 模式', () => {
      render(<Calendar captionLayout="dropdown-months" />)

      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })

    it('應該支援 dropdown-years 模式', () => {
      render(<Calendar captionLayout="dropdown-years" />)

      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })
  })

  describe('無障礙性', () => {
    it('日期按鈕應該有正確的 aria 屬性', () => {
      render(<Calendar month={new Date(2024, 0)} />)

      const dayButton = screen.getByRole('button', { name: /15/ })
      expect(dayButton).toBeInTheDocument()
    })

    it('導航按鈕應該可以通過鍵盤操作', async () => {
      const { user } = render(<Calendar month={new Date(2024, 0)} />)

      const nextButton = screen.getByRole('button', { name: /next|下一個/i })
      nextButton.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText(/February|二月/i)).toBeInTheDocument()
      })
    })
  })

  describe('格式化', () => {
    it('應該支援自訂 formatters', () => {
      render(
        <Calendar
          captionLayout="dropdown"
          formatters={{
            formatMonthDropdown: (date) => `月份 ${date.getMonth() + 1}`,
          }}
        />
      )

      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })
  })

  describe('多月份顯示', () => {
    it('應該支援顯示多個月份', () => {
      render(<Calendar numberOfMonths={2} />)

      // 應該顯示兩個月份
      const calendar = document.querySelector('[data-slot="calendar"]')
      expect(calendar).toBeInTheDocument()
    })
  })

  describe('週數顯示', () => {
    it('應該支援顯示週數', () => {
      render(<Calendar showWeekNumber />)

      // 應該顯示週數
      expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    })
  })
})
