/**
 * Dialog 與 AlertDialog 元件整合測試
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

describe('Dialog 元件', () => {
  describe('對話框開啟/關閉', () => {
    it('應該在點擊觸發按鈕後開啟對話框', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟對話框</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>測試對話框</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      // 初始狀態對話框不可見
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // 點擊觸發按鈕
      await user.click(screen.getByRole('button', { name: '開啟對話框' }))

      // 對話框應該可見
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('應該在點擊關閉按鈕後關閉對話框', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟對話框</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>測試對話框</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      // 開啟對話框
      await user.click(screen.getByRole('button', { name: '開啟對話框' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // 點擊關閉按鈕 (X 按鈕)
      await user.click(screen.getByRole('button', { name: 'Close' }))

      // 對話框應該關閉
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('應該支援受控模式開啟/關閉', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false)
        return (
          <>
            <button onClick={() => setOpen(true)}>外部開啟</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>受控對話框</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </>
        )
      }

      const React = await import('react')
      const { user } = render(<TestComponent />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '外部開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('應該可以隱藏關閉按鈕', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>無關閉按鈕</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // 不應該有 Close 按鈕
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    })
  })

  describe('內容渲染', () => {
    it('應該正確渲染標題和描述', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>對話框標題</DialogTitle>
              <DialogDescription>這是對話框的描述文字</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByText('對話框標題')).toBeInTheDocument()
        expect(screen.getByText('這是對話框的描述文字')).toBeInTheDocument()
      })
    })

    it('應該正確渲染頁腳內容', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>測試</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button>確認</Button>
              <Button variant="outline">取消</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
      })
    })

    it('應該支援 DialogFooter 的 showCloseButton 屬性', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>測試</DialogTitle>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button>確認</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument()
        // Footer 中的 Close 按鈕
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
      })
    })

    it('應該渲染自訂子元素', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>表單對話框</DialogTitle>
            </DialogHeader>
            <div data-testid="custom-content">
              <input type="text" placeholder="輸入內容" />
            </div>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByTestId('custom-content')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('輸入內容')).toBeInTheDocument()
      })
    })
  })

  describe('按鈕動作', () => {
    it('應該在點擊 DialogClose 時關閉對話框', async () => {
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>測試</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">關閉對話框</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '關閉對話框' }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('應該在頁腳按鈕點擊時執行回調', async () => {
      const handleConfirm = vi.fn()
      const { user } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>開啟</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認操作</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleConfirm}>確認</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '確認' }))

      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })
})

describe('AlertDialog 元件', () => {
  describe('對話框開啟/關閉', () => {
    it('應該在點擊觸發按鈕後開啟警告對話框', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除項目</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '刪除項目' }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('應該在點擊取消按鈕後關閉警告對話框', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })

    it('應該在點擊確認按鈕後關閉警告對話框', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('內容渲染', () => {
    it('應該正確渲染標題和描述', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>開啟</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>警告標題</AlertDialogTitle>
              <AlertDialogDescription>這是一個警告描述，請確認您的操作</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByText('警告標題')).toBeInTheDocument()
        expect(screen.getByText('這是一個警告描述，請確認您的操作')).toBeInTheDocument()
      })
    })

    it('應該支援不同的 size 屬性', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>開啟</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>小型對話框</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toHaveAttribute('data-size', 'sm')
      })
    })

    it('應該渲染頁腳的取消和確認按鈕', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>開啟</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消操作</AlertDialogCancel>
              <AlertDialogAction>確認操作</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '取消操作' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '確認操作' })).toBeInTheDocument()
      })
    })
  })

  describe('按鈕動作', () => {
    it('應該在點擊確認按鈕時執行回調', async () => {
      const handleAction = vi.fn()
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
              <AlertDialogDescription>此操作無法復原</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>確認刪除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '確認刪除' }))

      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('應該在點擊取消按鈕時執行回調', async () => {
      const handleCancel = vi.fn()
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '取消' }))

      expect(handleCancel).toHaveBeenCalledTimes(1)
    })

    it('應該支援 AlertDialogAction 的 variant 屬性', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>刪除</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction variant="destructive">刪除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        const actionButton = screen.getByRole('button', { name: '刪除' })
        // Button 使用 asChild 時，樣式會合併到按鈕元素上
        expect(actionButton.className).toContain('bg-destructive')
      })
    })

    it('應該支援 AlertDialogCancel 的 variant 屬性', async () => {
      const { user } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>開啟</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>測試</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="ghost">取消</AlertDialogCancel>
              <AlertDialogAction>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      await user.click(screen.getByRole('button', { name: '開啟' }))

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: '取消' })
        // Button 使用 asChild 時，ghost variant 的樣式會合併到按鈕元素上
        expect(cancelButton.className).toContain('hover:bg-accent')
      })
    })
  })
})
