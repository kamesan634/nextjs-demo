/**
 * Tabs 元件整合測試
 * 測試標籤頁切換元件的渲染和互動
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from '@/components/ui/tabs'

// ============================================================================
// Tabs 元件測試
// ============================================================================
describe('Tabs 元件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染標籤頁結構', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: '標籤 1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: '標籤 2' })).toBeInTheDocument()
      expect(screen.getByText('內容 1')).toBeInTheDocument()
    })

    it('Tabs 應該有正確的 data-slot 屬性', () => {
      const { container } = render(
        <Tabs defaultValue="tab1" data-testid="tabs">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      const tabs = container.querySelector('[data-slot="tabs"]')
      expect(tabs).toBeInTheDocument()
    })

    it('TabsList 應該有正確的 data-slot 屬性', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs-list')).toHaveAttribute('data-slot', 'tabs-list')
    })

    it('TabsTrigger 應該有正確的 data-slot 屬性', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              標籤 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('trigger')).toHaveAttribute('data-slot', 'tabs-trigger')
    })

    it('TabsContent 應該有正確的 data-slot 屬性', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content">
            內容 1
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'tabs-content')
    })
  })

  describe('預設值', () => {
    it('應該顯示預設選中的標籤內容', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      // 預設選中的標籤
      expect(screen.getByRole('tab', { name: '標籤 2' })).toHaveAttribute('data-state', 'active')
      expect(screen.getByText('內容 2')).toBeVisible()
    })

    it('未選中的標籤應該有 inactive 狀態', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByRole('tab', { name: '標籤 2' })).toHaveAttribute('data-state', 'inactive')
    })
  })

  describe('使用者交互', () => {
    it('點擊標籤應該切換內容', async () => {
      const { user } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      // 初始狀態
      expect(screen.getByRole('tab', { name: '標籤 1' })).toHaveAttribute('data-state', 'active')

      // 點擊第二個標籤
      await user.click(screen.getByRole('tab', { name: '標籤 2' }))

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: '標籤 2' })).toHaveAttribute('data-state', 'active')
        expect(screen.getByRole('tab', { name: '標籤 1' })).toHaveAttribute(
          'data-state',
          'inactive'
        )
      })
    })

    it('應該處理 onValueChange 事件', async () => {
      const handleValueChange = vi.fn()
      const { user } = render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      await user.click(screen.getByRole('tab', { name: '標籤 2' }))

      expect(handleValueChange).toHaveBeenCalledWith('tab2')
    })

    it('disabled 標籤不應該可以點擊', async () => {
      const handleValueChange = vi.fn()
      const { user } = render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              標籤 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      const disabledTab = screen.getByRole('tab', { name: '標籤 2' })
      expect(disabledTab).toBeDisabled()

      await user.click(disabledTab)

      expect(handleValueChange).not.toHaveBeenCalled()
    })
  })

  describe('方向', () => {
    it('預設應該是水平方向', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      const tabs = container.querySelector('[data-slot="tabs"]')
      expect(tabs).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('應該支援垂直方向', () => {
      const { container } = render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      const tabs = container.querySelector('[data-slot="tabs"]')
      expect(tabs).toHaveAttribute('data-orientation', 'vertical')
    })
  })

  describe('TabsList variants', () => {
    it('預設 variant 應該有 bg-muted 樣式', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs-list')).toHaveClass('bg-muted')
    })

    it('line variant 應該有 bg-transparent 樣式', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="line" data-testid="tabs-list">
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs-list')).toHaveClass('bg-transparent')
    })

    it('tabsListVariants 應該返回正確的類名', () => {
      const defaultClasses = tabsListVariants({ variant: 'default' })
      expect(defaultClasses).toContain('bg-muted')

      const lineClasses = tabsListVariants({ variant: 'line' })
      expect(lineClasses).toContain('bg-transparent')
    })
  })

  describe('樣式', () => {
    it('應該支援自訂 className', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs" data-testid="tabs">
          <TabsList className="custom-list" data-testid="tabs-list">
            <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">
              標籤 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content" data-testid="content">
            內容 1
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs')).toHaveClass('custom-tabs')
      expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list')
      expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger')
      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })

    it('TabsList 應該有 inline-flex 和 items-center 樣式', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('tabs-list')).toHaveClass('inline-flex', 'items-center')
    })

    it('TabsTrigger 應該有基礎樣式', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="trigger">
              標籤 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      const trigger = screen.getByTestId('trigger')
      expect(trigger).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('TabsContent 應該有 outline-none 樣式', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="content">
            內容 1
          </TabsContent>
        </Tabs>
      )

      expect(screen.getByTestId('content')).toHaveClass('outline-none')
    })
  })

  describe('無障礙性', () => {
    it('應該有正確的 ARIA 屬性', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      const tabList = screen.getByRole('tablist')
      expect(tabList).toBeInTheDocument()

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)

      const tabPanel = screen.getByRole('tabpanel')
      expect(tabPanel).toBeInTheDocument()
    })

    it('標籤應該有 aria-selected 屬性', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByRole('tab', { name: '標籤 1' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: '標籤 2' })).toHaveAttribute('aria-selected', 'false')
    })

    it('標籤面板應該與標籤關聯', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
        </Tabs>
      )

      const tab = screen.getByRole('tab', { name: '標籤 1' })
      const tabPanel = screen.getByRole('tabpanel')

      const tabControlsId = tab.getAttribute('aria-controls')
      expect(tabPanel).toHaveAttribute('id', tabControlsId)
    })
  })

  describe('受控模式', () => {
    it('應該支援受控的 value', async () => {
      render(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">標籤 1</TabsTrigger>
            <TabsTrigger value="tab2">標籤 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">內容 1</TabsContent>
          <TabsContent value="tab2">內容 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByRole('tab', { name: '標籤 2' })).toHaveAttribute('data-state', 'active')
    })
  })
})
