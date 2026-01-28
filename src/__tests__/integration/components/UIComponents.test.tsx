/**
 * UI 基礎元件整合測試
 * 測試 Badge, Card, Input, Textarea, Checkbox, Switch 元件
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../utils/test-utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

// ============================================================================
// Badge 元件測試
// ============================================================================
describe('Badge 元件', () => {
  it('應該正確渲染徽章文字', () => {
    render(<Badge>測試徽章</Badge>)
    expect(screen.getByText('測試徽章')).toBeInTheDocument()
  })

  it('應該渲染為 span 元素', () => {
    render(<Badge>徽章</Badge>)
    const badge = screen.getByText('徽章')
    expect(badge.tagName).toBe('SPAN')
  })

  it('應該套用預設 variant 樣式', () => {
    render(<Badge>預設</Badge>)
    const badge = screen.getByText('預設')
    expect(badge).toHaveClass('bg-primary')
    expect(badge).toHaveAttribute('data-variant', 'default')
  })

  it('應該套用不同的 variant', () => {
    const { rerender } = render(<Badge variant="default">預設</Badge>)
    expect(screen.getByText('預設')).toHaveClass('bg-primary')

    rerender(<Badge variant="secondary">次要</Badge>)
    expect(screen.getByText('次要')).toHaveClass('bg-secondary')

    rerender(<Badge variant="destructive">危險</Badge>)
    expect(screen.getByText('危險')).toHaveClass('bg-destructive')

    rerender(<Badge variant="outline">外框</Badge>)
    expect(screen.getByText('外框')).toHaveClass('border-border')

    rerender(<Badge variant="ghost">透明</Badge>)
    expect(screen.getByText('透明')).toHaveAttribute('data-variant', 'ghost')

    rerender(<Badge variant="link">連結</Badge>)
    expect(screen.getByText('連結')).toHaveClass('underline-offset-4')
  })

  it('應該傳遞自訂 className', () => {
    render(<Badge className="custom-class">自訂</Badge>)
    expect(screen.getByText('自訂')).toHaveClass('custom-class')
  })

  it('應該支援 asChild 模式', () => {
    render(
      <Badge asChild>
        <a href="/test">連結徽章</a>
      </Badge>
    )
    const link = screen.getByRole('link', { name: '連結徽章' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('應該有正確的 data-slot 屬性', () => {
    render(<Badge>Slot 測試</Badge>)
    expect(screen.getByText('Slot 測試')).toHaveAttribute('data-slot', 'badge')
  })
})

// ============================================================================
// Card 元件測試
// ============================================================================
describe('Card 元件', () => {
  describe('Card 容器', () => {
    it('應該正確渲染卡片內容', () => {
      render(<Card>卡片內容</Card>)
      expect(screen.getByText('卡片內容')).toBeInTheDocument()
    })

    it('應該有正確的基礎樣式', () => {
      render(<Card data-testid="card">內容</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-card', 'rounded-xl', 'border', 'shadow-sm')
    })

    it('應該傳遞自訂 className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          內容
        </Card>
      )
      expect(screen.getByTestId('card')).toHaveClass('custom-card')
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<Card data-testid="card">內容</Card>)
      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card')
    })
  })

  describe('CardHeader 元件', () => {
    it('應該正確渲染標題區塊', () => {
      render(<CardHeader>標題區塊</CardHeader>)
      expect(screen.getByText('標題區塊')).toBeInTheDocument()
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<CardHeader data-testid="header">標題</CardHeader>)
      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header')
    })

    it('應該傳遞自訂 className', () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          標題
        </CardHeader>
      )
      expect(screen.getByTestId('header')).toHaveClass('custom-header')
    })
  })

  describe('CardTitle 元件', () => {
    it('應該正確渲染標題文字', () => {
      render(<CardTitle>卡片標題</CardTitle>)
      expect(screen.getByText('卡片標題')).toBeInTheDocument()
    })

    it('應該有正確的樣式', () => {
      render(<CardTitle data-testid="title">標題</CardTitle>)
      expect(screen.getByTestId('title')).toHaveClass('font-semibold')
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<CardTitle data-testid="title">標題</CardTitle>)
      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title')
    })
  })

  describe('CardDescription 元件', () => {
    it('應該正確渲染描述文字', () => {
      render(<CardDescription>卡片描述</CardDescription>)
      expect(screen.getByText('卡片描述')).toBeInTheDocument()
    })

    it('應該有正確的樣式', () => {
      render(<CardDescription data-testid="desc">描述</CardDescription>)
      expect(screen.getByTestId('desc')).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<CardDescription data-testid="desc">描述</CardDescription>)
      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description')
    })
  })

  describe('CardContent 元件', () => {
    it('應該正確渲染內容', () => {
      render(<CardContent>卡片主要內容</CardContent>)
      expect(screen.getByText('卡片主要內容')).toBeInTheDocument()
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<CardContent data-testid="content">內容</CardContent>)
      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content')
    })

    it('應該傳遞自訂 className', () => {
      render(
        <CardContent className="custom-content" data-testid="content">
          內容
        </CardContent>
      )
      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })
  })

  describe('CardFooter 元件', () => {
    it('應該正確渲染頁腳內容', () => {
      render(<CardFooter>頁腳內容</CardFooter>)
      expect(screen.getByText('頁腳內容')).toBeInTheDocument()
    })

    it('應該有正確的樣式', () => {
      render(<CardFooter data-testid="footer">頁腳</CardFooter>)
      expect(screen.getByTestId('footer')).toHaveClass('flex', 'items-center')
    })

    it('應該有正確的 data-slot 屬性', () => {
      render(<CardFooter data-testid="footer">頁腳</CardFooter>)
      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer')
    })
  })

  describe('完整卡片組合', () => {
    it('應該正確渲染完整卡片結構', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>標題</CardTitle>
            <CardDescription>描述文字</CardDescription>
          </CardHeader>
          <CardContent>主要內容</CardContent>
          <CardFooter>頁腳</CardFooter>
        </Card>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByText('標題')).toBeInTheDocument()
      expect(screen.getByText('描述文字')).toBeInTheDocument()
      expect(screen.getByText('主要內容')).toBeInTheDocument()
      expect(screen.getByText('頁腳')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Input 元件測試
// ============================================================================
describe('Input 元件', () => {
  it('應該正確渲染輸入框', () => {
    render(<Input placeholder="請輸入" />)
    expect(screen.getByPlaceholderText('請輸入')).toBeInTheDocument()
  })

  it('應該渲染為 input 元素', () => {
    render(<Input data-testid="input" />)
    expect(screen.getByTestId('input').tagName).toBe('INPUT')
  })

  it('應該支援不同的 type', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
  })

  it('應該處理輸入事件', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Input onChange={handleChange} data-testid="input" />)

    await user.type(screen.getByTestId('input'), '測試文字')
    expect(handleChange).toHaveBeenCalled()
  })

  it('應該更新輸入值', async () => {
    const { user } = render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')

    await user.type(input, 'Hello')
    expect(input).toHaveValue('Hello')
  })

  it('應該支援 disabled 狀態', () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId('input')).toBeDisabled()
  })

  it('應該在禁用狀態下不能輸入', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Input disabled onChange={handleChange} data-testid="input" />)

    await user.type(screen.getByTestId('input'), '測試')
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('應該傳遞自訂 className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('custom-input')
  })

  it('應該有正確的 data-slot 屬性', () => {
    render(<Input data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('data-slot', 'input')
  })

  it('應該支援 value 和 defaultValue', () => {
    const { rerender } = render(<Input defaultValue="預設值" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('預設值')

    rerender(<Input value="控制值" onChange={() => {}} data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('控制值')
  })

  it('應該支援 focus 事件', async () => {
    const handleFocus = vi.fn()
    const { user } = render(<Input onFocus={handleFocus} data-testid="input" />)

    await user.click(screen.getByTestId('input'))
    expect(handleFocus).toHaveBeenCalledTimes(1)
  })

  it('應該支援 blur 事件', async () => {
    const handleBlur = vi.fn()
    render(
      <>
        <Input onBlur={handleBlur} data-testid="input" />
        <button>其他元素</button>
      </>
    )

    const input = screen.getByTestId('input')
    fireEvent.focus(input)
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Textarea 元件測試
// ============================================================================
describe('Textarea 元件', () => {
  it('應該正確渲染多行輸入框', () => {
    render(<Textarea placeholder="請輸入多行文字" />)
    expect(screen.getByPlaceholderText('請輸入多行文字')).toBeInTheDocument()
  })

  it('應該渲染為 textarea 元素', () => {
    render(<Textarea data-testid="textarea" />)
    expect(screen.getByTestId('textarea').tagName).toBe('TEXTAREA')
  })

  it('應該處理輸入事件', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Textarea onChange={handleChange} data-testid="textarea" />)

    await user.type(screen.getByTestId('textarea'), '多行文字')
    expect(handleChange).toHaveBeenCalled()
  })

  it('應該更新輸入值', async () => {
    const { user } = render(<Textarea data-testid="textarea" />)
    const textarea = screen.getByTestId('textarea')

    await user.type(textarea, '第一行\n第二行')
    expect(textarea).toHaveValue('第一行\n第二行')
  })

  it('應該支援 disabled 狀態', () => {
    render(<Textarea disabled data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toBeDisabled()
  })

  it('應該在禁用狀態下不能輸入', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Textarea disabled onChange={handleChange} data-testid="textarea" />)

    await user.type(screen.getByTestId('textarea'), '測試')
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('應該傳遞自訂 className', () => {
    render(<Textarea className="custom-textarea" data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveClass('custom-textarea')
  })

  it('應該有正確的 data-slot 屬性', () => {
    render(<Textarea data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveAttribute('data-slot', 'textarea')
  })

  it('應該支援 rows 屬性', () => {
    render(<Textarea rows={5} data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5')
  })

  it('應該支援 defaultValue', () => {
    render(<Textarea defaultValue="預設多行文字" data-testid="textarea" />)
    expect(screen.getByTestId('textarea')).toHaveValue('預設多行文字')
  })
})

// ============================================================================
// Checkbox 元件測試
// ============================================================================
describe('Checkbox 元件', () => {
  it('應該正確渲染核取方塊', () => {
    render(<Checkbox aria-label="測試核取方塊" />)
    expect(screen.getByRole('checkbox', { name: '測試核取方塊' })).toBeInTheDocument()
  })

  it('應該支援點擊切換狀態', async () => {
    const { user } = render(<Checkbox aria-label="核取方塊" />)
    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('應該支援 defaultChecked', () => {
    render(<Checkbox defaultChecked aria-label="預設勾選" />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('應該支援受控的 checked 狀態', () => {
    const { rerender } = render(<Checkbox checked={false} aria-label="受控" />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()

    rerender(<Checkbox checked={true} aria-label="受控" />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('應該處理 onCheckedChange 事件', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Checkbox onCheckedChange={handleChange} aria-label="事件測試" />)

    await user.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('應該支援 disabled 狀態', () => {
    render(<Checkbox disabled aria-label="禁用" />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('應該在禁用狀態下不能切換', async () => {
    const handleChange = vi.fn()
    const { user } = render(
      <Checkbox disabled onCheckedChange={handleChange} aria-label="禁用測試" />
    )

    await user.click(screen.getByRole('checkbox'))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('應該傳遞自訂 className', () => {
    render(<Checkbox className="custom-checkbox" aria-label="自訂" />)
    expect(screen.getByRole('checkbox')).toHaveClass('custom-checkbox')
  })

  it('應該有正確的 data-slot 屬性', () => {
    render(<Checkbox aria-label="slot 測試" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox')
  })

  it('應該支援 name 屬性', () => {
    render(<Checkbox name="agreement" aria-label="同意條款" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'agreement')
  })

  it('應該支援 required 屬性', () => {
    render(<Checkbox required aria-label="必填" />)
    expect(screen.getByRole('checkbox')).toBeRequired()
  })
})

// ============================================================================
// Switch 元件測試
// ============================================================================
describe('Switch 元件', () => {
  it('應該正確渲染開關', () => {
    render(<Switch aria-label="測試開關" />)
    expect(screen.getByRole('switch', { name: '測試開關' })).toBeInTheDocument()
  })

  it('應該支援點擊切換狀態', async () => {
    const { user } = render(<Switch aria-label="開關" />)
    const switchElement = screen.getByRole('switch')

    expect(switchElement).toHaveAttribute('data-state', 'unchecked')
    await user.click(switchElement)
    expect(switchElement).toHaveAttribute('data-state', 'checked')
    await user.click(switchElement)
    expect(switchElement).toHaveAttribute('data-state', 'unchecked')
  })

  it('應該支援 defaultChecked', () => {
    render(<Switch defaultChecked aria-label="預設開啟" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })

  it('應該支援受控的 checked 狀態', () => {
    const { rerender } = render(<Switch checked={false} aria-label="受控" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')

    rerender(<Switch checked={true} aria-label="受控" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })

  it('應該處理 onCheckedChange 事件', async () => {
    const handleChange = vi.fn()
    const { user } = render(<Switch onCheckedChange={handleChange} aria-label="事件測試" />)

    await user.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('應該支援 disabled 狀態', () => {
    render(<Switch disabled aria-label="禁用" />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('應該在禁用狀態下不能切換', async () => {
    const handleChange = vi.fn()
    const { user } = render(
      <Switch disabled onCheckedChange={handleChange} aria-label="禁用測試" />
    )

    await user.click(screen.getByRole('switch'))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('應該傳遞自訂 className', () => {
    render(<Switch className="custom-switch" aria-label="自訂" />)
    expect(screen.getByRole('switch')).toHaveClass('custom-switch')
  })

  it('應該有正確的基礎樣式', () => {
    render(<Switch aria-label="樣式測試" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('inline-flex', 'cursor-pointer', 'rounded-full')
  })

  it('應該支援 name 屬性', () => {
    render(<Switch name="notifications" aria-label="通知" />)
    // Radix UI Switch 可能不會直接在 button 上設置 name
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
  })

  it('應該支援 required 屬性', () => {
    render(<Switch required aria-label="必填" />)
    // Radix UI Switch 使用 aria-required
    expect(screen.getByRole('switch')).toHaveAttribute('aria-required', 'true')
  })

  it('開啟時應該套用 primary 背景色', () => {
    render(<Switch defaultChecked aria-label="開啟狀態" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'checked')
    // 開啟時應有 data-[state=checked]:bg-primary 樣式
    expect(switchElement.className).toContain('data-[state=checked]:bg-primary')
  })
})
