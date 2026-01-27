/**
 * Button 元件整合測試
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button 元件', () => {
  it('應該正確渲染按鈕文字', () => {
    render(<Button>點擊我</Button>)
    expect(screen.getByRole('button', { name: '點擊我' })).toBeInTheDocument()
  })

  it('應該處理點擊事件', async () => {
    const handleClick = vi.fn()
    const { user } = render(<Button onClick={handleClick}>點擊</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('應該支援 disabled 狀態', () => {
    render(<Button disabled>禁用按鈕</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('應該套用不同的 variant', () => {
    const { rerender } = render(<Button variant="default">預設</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')

    rerender(<Button variant="destructive">危險</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">外框</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')

    rerender(<Button variant="ghost">透明</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
  })

  it('應該套用不同的 size', () => {
    const { rerender } = render(<Button size="default">預設大小</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')

    rerender(<Button size="sm">小按鈕</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')

    rerender(<Button size="lg">大按鈕</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')

    rerender(<Button size="icon">圖示</Button>)
    expect(screen.getByRole('button')).toHaveClass('size-9')
  })

  it('應該支援 asChild 模式', () => {
    render(
      <Button asChild>
        <a href="/test">連結按鈕</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: '連結按鈕' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('應該在禁用狀態下不觸發點擊', async () => {
    const handleClick = vi.fn()
    const { user } = render(
      <Button disabled onClick={handleClick}>
        禁用
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
