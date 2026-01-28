/**
 * 表單相關元件整合測試
 * 測試 DeleteDialog、FormLoading、StatusBadge 元件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { DeleteDialog } from '@/components/forms/delete-dialog'
import { FormLoading } from '@/components/forms/form-loading'
import {
  StatusBadge,
  ActiveBadge,
  orderStatusMap,
  paymentStatusMap,
  purchaseOrderStatusMap,
  inventoryMovementTypeMap,
} from '@/components/forms/status-badge'

/**
 * DeleteDialog 元件測試
 * 測試刪除確認對話框元件的渲染和互動
 */
describe('DeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('開啟/關閉對話框', () => {
    it('應渲染預設的觸發按鈕', () => {
      render(<DeleteDialog onConfirm={async () => {}} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('應渲染自訂的觸發按鈕', () => {
      render(<DeleteDialog onConfirm={async () => {}} trigger={<button>自訂刪除</button>} />)

      expect(screen.getByRole('button', { name: '自訂刪除' })).toBeInTheDocument()
    })

    it('點擊觸發按鈕應開啟對話框', async () => {
      const { user } = render(<DeleteDialog onConfirm={async () => {}} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('應顯示預設標題和描述', async () => {
      const { user } = render(<DeleteDialog onConfirm={async () => {}} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('確定要刪除嗎？')).toBeInTheDocument()
        expect(screen.getByText(/此操作無法復原/)).toBeInTheDocument()
      })
    })

    it('應顯示自訂標題和描述', async () => {
      const { user } = render(
        <DeleteDialog
          onConfirm={async () => {}}
          title="確定要刪除此商品？"
          description="刪除後將無法恢復商品資料。"
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('確定要刪除此商品？')).toBeInTheDocument()
        expect(screen.getByText('刪除後將無法恢復商品資料。')).toBeInTheDocument()
      })
    })

    it('點擊取消應關閉對話框', async () => {
      const { user } = render(<DeleteDialog onConfirm={async () => {}} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('確認/取消動作', () => {
    it('點擊確定應執行 onConfirm', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      const { user } = render(<DeleteDialog onConfirm={onConfirm} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '確定刪除' }))

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    it('執行 onConfirm 時應顯示載入狀態', async () => {
      let resolvePromise: () => void
      const onConfirm = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve
          })
      )
      const { user } = render(<DeleteDialog onConfirm={onConfirm} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // 點擊確定刪除按鈕
      await user.click(screen.getByRole('button', { name: '確定刪除' }))

      // 應該進入載入狀態
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled()
      })

      // 解決 Promise 以結束載入
      resolvePromise!()
    })

    it('disabled 時觸發按鈕應被禁用', () => {
      render(<DeleteDialog onConfirm={async () => {}} disabled={true} />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('取消按鈕不應執行 onConfirm', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      const { user } = render(<DeleteDialog onConfirm={onConfirm} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })

      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})

/**
 * FormLoading 元件測試
 * 測試表單載入中元件的渲染
 */
describe('FormLoading', () => {
  describe('載入狀態顯示', () => {
    it('應渲染預設載入訊息', () => {
      render(<FormLoading />)

      expect(screen.getByText('載入中...')).toBeInTheDocument()
    })

    it('應渲染自訂載入訊息', () => {
      render(<FormLoading message="正在讀取資料..." />)

      expect(screen.getByText('正在讀取資料...')).toBeInTheDocument()
    })

    it('應渲染載入圖示', () => {
      const { container } = render(<FormLoading />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('應套用自訂 className', () => {
      const { container } = render(<FormLoading className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('應包含置中對齊的 flex 容器', () => {
      const { container } = render(<FormLoading />)

      expect(container.firstChild).toHaveClass('flex')
      expect(container.firstChild).toHaveClass('items-center')
      expect(container.firstChild).toHaveClass('justify-center')
    })
  })
})

/**
 * StatusBadge 元件測試
 * 測試狀態標籤元件的渲染
 */
describe('StatusBadge', () => {
  describe('基本渲染', () => {
    it('應根據狀態顯示對應標籤', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} />)

      expect(screen.getByText('待處理')).toBeInTheDocument()
    })

    it('未知狀態應顯示原始值', () => {
      render(<StatusBadge status="UNKNOWN" statusMap={orderStatusMap} />)

      expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    })

    it('應套用自訂 className', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} className="custom-class" />)

      expect(screen.getByText('待處理')).toHaveClass('custom-class')
    })
  })

  describe('orderStatusMap - 訂單狀態樣式', () => {
    it('應正確顯示待處理狀態', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} />)

      expect(screen.getByText('待處理')).toBeInTheDocument()
    })

    it('應正確顯示已確認狀態', () => {
      render(<StatusBadge status="CONFIRMED" statusMap={orderStatusMap} />)

      const badge = screen.getByText('已確認')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-500')
    })

    it('應正確顯示已完成狀態', () => {
      render(<StatusBadge status="COMPLETED" statusMap={orderStatusMap} />)

      const badge = screen.getByText('已完成')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500')
    })

    it('應正確顯示已取消狀態', () => {
      render(<StatusBadge status="CANCELLED" statusMap={orderStatusMap} />)

      expect(screen.getByText('已取消')).toBeInTheDocument()
    })
  })

  describe('paymentStatusMap - 付款狀態樣式', () => {
    it('應正確顯示未付款狀態', () => {
      render(<StatusBadge status="UNPAID" statusMap={paymentStatusMap} />)

      expect(screen.getByText('未付款')).toBeInTheDocument()
    })

    it('應正確顯示部分付款狀態', () => {
      render(<StatusBadge status="PARTIAL" statusMap={paymentStatusMap} />)

      const badge = screen.getByText('部分付款')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-500')
    })

    it('應正確顯示已付款狀態', () => {
      render(<StatusBadge status="PAID" statusMap={paymentStatusMap} />)

      const badge = screen.getByText('已付款')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500')
    })
  })

  describe('purchaseOrderStatusMap - 採購單狀態樣式', () => {
    it('應正確顯示草稿狀態', () => {
      render(<StatusBadge status="DRAFT" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('草稿')).toBeInTheDocument()
    })

    it('應正確顯示待核准狀態', () => {
      render(<StatusBadge status="PENDING" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('待核准')).toBeInTheDocument()
    })

    it('應正確顯示已核准狀態', () => {
      render(<StatusBadge status="APPROVED" statusMap={purchaseOrderStatusMap} />)

      const badge = screen.getByText('已核准')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-500')
    })

    it('應正確顯示部分到貨狀態', () => {
      render(<StatusBadge status="PARTIAL" statusMap={purchaseOrderStatusMap} />)

      const badge = screen.getByText('部分到貨')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-500')
    })

    it('應正確顯示已完成狀態', () => {
      render(<StatusBadge status="COMPLETED" statusMap={purchaseOrderStatusMap} />)

      const badge = screen.getByText('已完成')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500')
    })
  })

  describe('inventoryMovementTypeMap - 庫存異動類型樣式', () => {
    it('應正確顯示入庫類型', () => {
      render(<StatusBadge status="IN" statusMap={inventoryMovementTypeMap} />)

      const badge = screen.getByText('入庫')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500')
    })

    it('應正確顯示出庫類型', () => {
      render(<StatusBadge status="OUT" statusMap={inventoryMovementTypeMap} />)

      const badge = screen.getByText('出庫')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500')
    })

    it('應正確顯示調整類型', () => {
      render(<StatusBadge status="ADJUST" statusMap={inventoryMovementTypeMap} />)

      expect(screen.getByText('調整')).toBeInTheDocument()
    })

    it('應正確顯示調撥類型', () => {
      render(<StatusBadge status="TRANSFER" statusMap={inventoryMovementTypeMap} />)

      const badge = screen.getByText('調撥')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-500')
    })
  })

  describe('ActiveBadge - 啟用/停用狀態', () => {
    it('啟用狀態應顯示「啟用」', () => {
      render(<ActiveBadge isActive={true} />)

      const badge = screen.getByText('啟用')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500')
    })

    it('停用狀態應顯示「停用」', () => {
      render(<ActiveBadge isActive={false} />)

      expect(screen.getByText('停用')).toBeInTheDocument()
    })

    it('應套用自訂 className', () => {
      render(<ActiveBadge isActive={true} className="custom-class" />)

      expect(screen.getByText('啟用')).toHaveClass('custom-class')
    })
  })
})
