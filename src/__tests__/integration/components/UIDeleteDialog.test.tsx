/**
 * UI DeleteDialog 元件整合測試
 * 測試 src/components/ui/delete-dialog.tsx 的刪除確認對話框元件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import { DeleteDialog } from '@/components/ui/delete-dialog'

// ============================================================================
// DeleteDialog 元件測試
// ============================================================================
describe('DeleteDialog 元件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('開啟時應該正確渲染對話框', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('關閉時不應該渲染對話框', () => {
      render(<DeleteDialog open={false} onOpenChange={() => {}} onConfirm={async () => {}} />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('應該顯示預設標題', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByText('確認刪除')).toBeInTheDocument()
      })
    })

    it('應該顯示預設描述', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByText(/確定要刪除此項目嗎？此操作無法復原/)).toBeInTheDocument()
      })
    })

    it('應該顯示預設按鈕文字', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
      })
    })
  })

  describe('自訂 Props', () => {
    it('應該顯示自訂標題', async () => {
      render(
        <DeleteDialog
          open={true}
          onOpenChange={() => {}}
          onConfirm={async () => {}}
          title="確定要刪除此商品？"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('確定要刪除此商品？')).toBeInTheDocument()
      })
    })

    it('應該顯示自訂描述', async () => {
      render(
        <DeleteDialog
          open={true}
          onOpenChange={() => {}}
          onConfirm={async () => {}}
          description="刪除後將無法恢復商品資料，請謹慎操作。"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('刪除後將無法恢復商品資料，請謹慎操作。')).toBeInTheDocument()
      })
    })

    it('應該顯示自訂確認按鈕文字', async () => {
      render(
        <DeleteDialog
          open={true}
          onOpenChange={() => {}}
          onConfirm={async () => {}}
          confirmText="確定刪除"
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '確定刪除' })).toBeInTheDocument()
      })
    })

    it('應該顯示自訂取消按鈕文字', async () => {
      render(
        <DeleteDialog
          open={true}
          onOpenChange={() => {}}
          onConfirm={async () => {}}
          cancelText="返回"
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
      })
    })
  })

  describe('使用者交互', () => {
    it('點擊確認按鈕應該執行 onConfirm', async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined)
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalledTimes(1)
      })
    })

    it('點擊取消按鈕應該呼叫 onOpenChange(false)', async () => {
      const handleOpenChange = vi.fn()
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={handleOpenChange} onConfirm={async () => {}} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('取消按鈕不應該執行 onConfirm', async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined)
      const handleOpenChange = vi.fn()
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={handleOpenChange} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      expect(handleConfirm).not.toHaveBeenCalled()
    })
  })

  describe('載入狀態', () => {
    it('執行 onConfirm 時應該顯示載入狀態', async () => {
      let resolvePromise: () => void
      const handleConfirm = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve
          })
      )
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(screen.getByText('處理中...')).toBeInTheDocument()
      })

      // 完成處理
      resolvePromise!()

      await waitFor(() => {
        expect(screen.queryByText('處理中...')).not.toBeInTheDocument()
      })
    })

    it('載入中應該禁用確認按鈕', async () => {
      let resolvePromise: () => void
      const handleConfirm = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve
          })
      )
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: '處理中...' })
        expect(confirmButton).toBeDisabled()
      })

      resolvePromise!()
    })

    it('載入中應該禁用取消按鈕', async () => {
      let resolvePromise: () => void
      const handleConfirm = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve
          })
      )
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: '取消' })
        expect(cancelButton).toBeDisabled()
      })

      resolvePromise!()
    })
  })

  describe('錯誤處理', () => {
    it('onConfirm 失敗時應該結束載入狀態', async () => {
      // Mock console.error to suppress expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const handleConfirm = vi.fn().mockRejectedValue(new Error('刪除失敗'))
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        // 即使失敗，也應該結束載入狀態
        expect(screen.queryByText('處理中...')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('樣式', () => {
    it('確認按鈕應該有 destructive 樣式', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: '刪除' })
        expect(confirmButton).toHaveClass('bg-destructive')
      })
    })
  })

  describe('無障礙性', () => {
    it('應該使用 alertdialog role', async () => {
      render(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('標題應該有正確的結構', async () => {
      render(
        <DeleteDialog
          open={true}
          onOpenChange={() => {}}
          onConfirm={async () => {}}
          title="確認刪除商品"
        />
      )

      await waitFor(() => {
        const title = screen.getByText('確認刪除商品')
        expect(title).toBeInTheDocument()
      })
    })
  })

  describe('受控模式', () => {
    it('應該根據 open prop 控制顯示狀態', async () => {
      const { rerender } = render(
        <DeleteDialog open={false} onOpenChange={() => {}} onConfirm={async () => {}} />
      )

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      rerender(<DeleteDialog open={true} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      rerender(<DeleteDialog open={false} onOpenChange={() => {}} onConfirm={async () => {}} />)

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('同步 onConfirm', () => {
    it('應該支援同步的 onConfirm 函數', async () => {
      const handleConfirm = vi.fn()
      const { user } = render(
        <DeleteDialog open={true} onOpenChange={() => {}} onConfirm={handleConfirm} />
      )

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalledTimes(1)
      })
    })
  })
})
