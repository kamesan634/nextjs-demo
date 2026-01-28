/**
 * Popover 元件整合測試
 * 測試彈出框元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

// ============================================================================
// Popover 元件測試
// ============================================================================
describe('Popover 元件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染觸發按鈕', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      expect(screen.getByRole('button', { name: '開啟彈出框' })).toBeInTheDocument()
    })

    it('初始狀態下不應該顯示 PopoverContent', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      expect(screen.queryByText('彈出框內容')).not.toBeInTheDocument()
    })

    it('PopoverTrigger 應該有正確的 data-slot 屬性', () => {
      render(
        <Popover>
          <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
          <PopoverContent>內容</PopoverContent>
        </Popover>
      )

      expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'popover-trigger')
    })
  })

  describe('開啟/關閉', () => {
    it('點擊觸發按鈕應該開啟彈出框', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button', { name: '開啟彈出框' }))

      await waitFor(() => {
        expect(screen.getByText('彈出框內容')).toBeInTheDocument()
      })
    })

    it('再次點擊觸發按鈕應該關閉彈出框', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      // 開啟
      await user.click(screen.getByRole('button', { name: '開啟彈出框' }))
      await waitFor(() => {
        expect(screen.getByText('彈出框內容')).toBeInTheDocument()
      })

      // 關閉
      await user.click(screen.getByRole('button', { name: '開啟彈出框' }))
      await waitFor(() => {
        expect(screen.queryByText('彈出框內容')).not.toBeInTheDocument()
      })
    })

    it('應該支援受控的 open 狀態', async () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      expect(screen.queryByText('彈出框內容')).not.toBeInTheDocument()

      rerender(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      await waitFor(() => {
        expect(screen.getByText('彈出框內容')).toBeInTheDocument()
      })
    })

    it('應該處理 onOpenChange 事件', async () => {
      const handleOpenChange = vi.fn()
      const { user } = render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button', { name: '開啟彈出框' }))

      expect(handleOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('PopoverContent', () => {
    it('開啟後應該有正確的 data-slot 屬性', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="content">內容</PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'popover-content')
      })
    })

    it('應該支援自訂 className', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent className="custom-class" data-testid="content">
            內容
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('content')).toHaveClass('custom-class')
      })
    })

    it('應該有預設的樣式', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="content">內容</PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const content = screen.getByTestId('content')
        expect(content).toHaveClass('bg-popover', 'rounded-md', 'border', 'p-4', 'shadow-md')
      })
    })

    it('應該支援自訂 align 屬性', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent align="start" data-testid="content">
            內容
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })
    })

    it('應該支援自訂 sideOffset 屬性', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent sideOffset={10} data-testid="content">
            內容
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })
    })
  })

  describe('PopoverHeader', () => {
    it('應該正確渲染標頭', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader data-testid="header">標頭內容</PopoverHeader>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'popover-header')
      })
    })

    it('應該有 flex 和 gap 樣式', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader data-testid="header">標頭內容</PopoverHeader>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        const header = screen.getByTestId('header')
        expect(header).toHaveClass('flex', 'flex-col', 'gap-1')
      })
    })

    it('應該支援自訂 className', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader className="custom-header" data-testid="header">
              標頭內容
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('header')).toHaveClass('custom-header')
      })
    })
  })

  describe('PopoverTitle', () => {
    it('應該正確渲染標題', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverTitle data-testid="title">彈出框標題</PopoverTitle>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('彈出框標題')).toBeInTheDocument()
        expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'popover-title')
      })
    })

    it('應該有 font-medium 樣式', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverTitle data-testid="title">標題</PopoverTitle>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveClass('font-medium')
      })
    })

    it('應該支援自訂 className', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverTitle className="custom-title" data-testid="title">
              標題
            </PopoverTitle>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('title')).toHaveClass('custom-title')
      })
    })
  })

  describe('PopoverDescription', () => {
    it('應該正確渲染描述', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverDescription data-testid="desc">這是描述文字</PopoverDescription>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('這是描述文字')).toBeInTheDocument()
        expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'popover-description')
      })
    })

    it('應該有 text-muted-foreground 樣式', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverDescription data-testid="desc">描述</PopoverDescription>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('desc')).toHaveClass('text-muted-foreground')
      })
    })

    it('應該支援自訂 className', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverDescription className="custom-desc" data-testid="desc">
              描述
            </PopoverDescription>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('desc')).toHaveClass('custom-desc')
      })
    })
  })

  describe('PopoverAnchor', () => {
    it('應該正確渲染錨點', () => {
      render(
        <Popover>
          <PopoverAnchor data-testid="anchor">錨點</PopoverAnchor>
          <PopoverTrigger asChild>
            <Button>開啟</Button>
          </PopoverTrigger>
          <PopoverContent>內容</PopoverContent>
        </Popover>
      )

      expect(screen.getByTestId('anchor')).toBeInTheDocument()
      expect(screen.getByTestId('anchor')).toHaveAttribute('data-slot', 'popover-anchor')
    })
  })

  describe('完整彈出框組合', () => {
    it('應該正確渲染完整的彈出框結構', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>標題</PopoverTitle>
              <PopoverDescription>這是一段描述文字</PopoverDescription>
            </PopoverHeader>
            <div>主要內容區域</div>
          </PopoverContent>
        </Popover>
      )

      await user.click(screen.getByRole('button', { name: '開啟彈出框' }))

      await waitFor(() => {
        expect(screen.getByText('標題')).toBeInTheDocument()
        expect(screen.getByText('這是一段描述文字')).toBeInTheDocument()
        expect(screen.getByText('主要內容區域')).toBeInTheDocument()
      })
    })
  })

  describe('預設開啟狀態', () => {
    it('應該支援 defaultOpen', async () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <Button>開啟彈出框</Button>
          </PopoverTrigger>
          <PopoverContent>彈出框內容</PopoverContent>
        </Popover>
      )

      await waitFor(() => {
        expect(screen.getByText('彈出框內容')).toBeInTheDocument()
      })
    })
  })
})
