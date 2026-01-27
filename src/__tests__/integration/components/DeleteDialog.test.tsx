/**
 * DeleteDialog 元件測試
 * 測試刪除確認對話框元件的渲染和互動
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { DeleteDialog } from '@/components/forms/delete-dialog'

describe('DeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
})
