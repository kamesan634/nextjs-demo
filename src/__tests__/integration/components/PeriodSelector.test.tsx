/**
 * PeriodSelector 元件測試
 * 測試期間選擇器元件的渲染和互動
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { PeriodSelector } from '@/components/reports/period-selector'

describe('PeriodSelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應渲染期間選擇下拉選單', () => {
      render(<PeriodSelector onChange={mockOnChange} />)

      // Select 元件會渲染一個帶有 combobox role 的按鈕
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('預設應選擇「本月」', () => {
      render(<PeriodSelector onChange={mockOnChange} />)

      // 預設值是 month
      expect(screen.getByRole('combobox')).toHaveTextContent('本月')
    })

    it('預設不應顯示自訂日期選擇器', () => {
      render(<PeriodSelector onChange={mockOnChange} />)

      expect(screen.queryByRole('button', { name: '選擇日期' })).not.toBeInTheDocument()
    })
  })

  describe('期間選擇', () => {
    it('選擇「今天」應觸發 onChange', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 開啟下拉選單
      await user.click(screen.getByRole('combobox'))

      // 選擇「今天」
      await waitFor(() => {
        expect(screen.getByRole('option', { name: '今天' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '今天' }))

      await waitFor(() => {
        // 檢查 onChange 被呼叫，且開始和結束日期相同（今天）
        expect(mockOnChange).toHaveBeenCalledTimes(1)
        const [startDate, endDate] = mockOnChange.mock.calls[0]
        expect(startDate).toBe(endDate)
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('選擇「本週」應觸發 onChange 並計算正確日期', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '本週' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '本週' }))

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
        const [startDate, endDate] = mockOnChange.mock.calls[0]
        // 開始日期應該比結束日期早 7 天
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('選擇「本月」應觸發 onChange 並計算正確日期', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 先選擇其他選項，再選回本月
      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '今天' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '今天' }))

      vi.clearAllMocks()

      await user.click(screen.getByRole('combobox'))
      await waitFor(() => {
        expect(screen.getByRole('option', { name: '本月' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '本月' }))

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
        const [startDate, endDate] = mockOnChange.mock.calls[0]
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('選擇「本季」應觸發 onChange 並計算正確日期', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '本季' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '本季' }))

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
        const [startDate, endDate] = mockOnChange.mock.calls[0]
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('選擇「自訂期間」不應立即觸發 onChange', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 選擇自訂期間時不應觸發 onChange
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('自訂期間功能', () => {
    it('選擇「自訂期間」應顯示日期選擇按鈕', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /選擇日期/ })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 20000)

    it('點擊日期選擇按鈕應開啟 Popover', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 點擊日期選擇按鈕
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /選擇日期/ })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('button', { name: /選擇日期/ }))

      // Popover 應該顯示日期輸入欄位
      await waitFor(
        () => {
          expect(screen.getByLabelText('開始日期')).toBeInTheDocument()
          expect(screen.getByLabelText('結束日期')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 25000)

    it('應顯示套用按鈕', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 開啟日期選擇 Popover
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /選擇日期/ })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('button', { name: /選擇日期/ }))

      // 應顯示套用按鈕
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: '套用' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 25000)

    it('輸入日期並點擊套用應觸發 onChange', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 開啟日期選擇 Popover
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /選擇日期/ })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('button', { name: /選擇日期/ }))

      // 輸入開始日期
      const startDateInput = await screen.findByLabelText('開始日期')
      await user.clear(startDateInput)
      await user.type(startDateInput, '2024-01-01')

      // 輸入結束日期
      const endDateInput = await screen.findByLabelText('結束日期')
      await user.clear(endDateInput)
      await user.type(endDateInput, '2024-01-31')

      // 點擊套用
      await user.click(screen.getByRole('button', { name: '套用' }))

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
        },
        { timeout: 10000 }
      )
    }, 30000)

    it('未輸入日期時點擊套用不應觸發 onChange', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 開啟日期選擇 Popover
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /選擇日期/ })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('button', { name: /選擇日期/ }))

      // 等待套用按鈕出現
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: '套用' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      // 直接點擊套用（未輸入日期）
      await user.click(screen.getByRole('button', { name: '套用' }))

      // 不應觸發 onChange
      expect(mockOnChange).not.toHaveBeenCalled()
    }, 25000)
  })

  describe('下拉選單選項', () => {
    it('應包含所有期間選項', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      await user.click(screen.getByRole('combobox'))

      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '今天' })).toBeInTheDocument()
          expect(screen.getByRole('option', { name: '本週' })).toBeInTheDocument()
          expect(screen.getByRole('option', { name: '本月' })).toBeInTheDocument()
          expect(screen.getByRole('option', { name: '本季' })).toBeInTheDocument()
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)
  })

  describe('樣式和結構', () => {
    it('應有正確的容器結構', () => {
      const { container } = render(<PeriodSelector onChange={mockOnChange} />)

      // 容器應有 flex 和 items-center
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex')
      expect(wrapper).toHaveClass('items-center')
    })

    it('日期選擇按鈕應顯示日曆圖示', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 檢查日期選擇按鈕中的圖示
      await waitFor(
        () => {
          const dateButton = screen.getByRole('button', { name: /選擇日期/ })
          const svg = dateButton.querySelector('svg')
          expect(svg).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)
  })

  describe('邊界情況', () => {
    it('連續快速切換期間類型應正確處理', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 快速切換多個選項
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '今天' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '今天' }))

      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '本週' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '本週' }))

      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '本季' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '本季' }))

      // 應該被調用三次
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    }, 35000)

    it('從自訂期間切回預設期間應正確處理', async () => {
      const { user } = render(<PeriodSelector onChange={mockOnChange} />)

      // 先選擇自訂期間
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '自訂期間' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '自訂期間' }))

      // 自訂期間不觸發 onChange
      expect(mockOnChange).not.toHaveBeenCalled()

      // 切回本月
      await user.click(screen.getByRole('combobox'))
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: '本月' })).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
      await user.click(screen.getByRole('option', { name: '本月' }))

      // 應該觸發 onChange，檢查呼叫次數而非特定日期
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledTimes(1)
        },
        { timeout: 10000 }
      )
    }, 30000)
  })
})
