/**
 * ExportButton 元件測試
 * 測試報表匯出按鈕元件的渲染和互動
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import { ExportButton } from '@/components/reports/export-button'
import { toast } from 'sonner'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL 方法
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:mock-url')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本渲染', () => {
    it('應正確渲染按鈕', () => {
      render(<ExportButton url="/api/export" filename="report.xlsx" />)

      expect(screen.getByRole('button', { name: /匯出報表/ })).toBeInTheDocument()
    })

    it('應顯示匯出圖示', () => {
      const { container } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      // lucide-react 的 Download 圖示會渲染為 svg
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('按鈕應預設為未禁用狀態', () => {
      render(<ExportButton url="/api/export" filename="report.xlsx" />)

      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  describe('匯出功能', () => {
    it('點擊按鈕應觸發 fetch 請求', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'])),
      })

      const { user } = render(<ExportButton url="/api/export/sales" filename="sales-report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export/sales')
      })
    })

    it('匯出成功應顯示成功訊息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'])),
      })

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('報表匯出成功')
      })
    })

    it('匯出失敗應顯示錯誤訊息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('匯出失敗，請稍後再試')
      })
    })

    it('網路錯誤應顯示錯誤訊息', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('匯出失敗，請稍後再試')
      })
    })
  })

  describe('載入狀態', () => {
    it('匯出中應顯示載入狀態文字', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      // 應該顯示載入中文字
      await waitFor(() => {
        expect(screen.getByText('匯出中...')).toBeInTheDocument()
      })

      // 結束載入
      resolvePromise!({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      })

      // 等待載入結束
      await waitFor(() => {
        expect(screen.getByText(/匯出報表/)).toBeInTheDocument()
      })
    })

    it('匯出中按鈕應被禁用', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled()
      })

      // 結束載入
      resolvePromise!({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      })

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })
    })
  })

  describe('下載機制', () => {
    it('應建立下載連結並觸發下載', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/octet-stream' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      // 先 render，再 mock document 方法
      const { user } = render(<ExportButton url="/api/export" filename="sales-report.xlsx" />)

      // Mock document.createElement 只攔截 'a' 標籤
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLAnchorElement
        }
        return originalCreateElement(tagName)
      })
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as unknown as Node)
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as unknown as Node)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
        expect(mockLink.download).toBe('sales-report.xlsx')
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      })

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('Props 變化', () => {
    it('應使用提供的 URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      })

      const { user } = render(<ExportButton url="/api/custom-endpoint" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/custom-endpoint')
      })
    })

    it('使用 rerender 更新 URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      })

      const { rerender, user } = render(
        <ExportButton url="/api/v1/export" filename="report.xlsx" />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/export')
      })

      vi.clearAllMocks()

      rerender(<ExportButton url="/api/v2/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v2/export')
      })
    })
  })

  describe('邊界情況', () => {
    it('應處理空 blob 回應', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob([])),
      })

      const { user } = render(<ExportButton url="/api/export" filename="report.xlsx" />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('報表匯出成功')
      })
    })

    it('應處理特殊字元檔名', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      })

      // 先 render
      const { user } = render(
        <ExportButton url="/api/export" filename="報表_2024-01-01_銷售.xlsx" />
      )

      // 再 mock document 方法
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLAnchorElement
        }
        return originalCreateElement(tagName)
      })
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockLink.download).toBe('報表_2024-01-01_銷售.xlsx')
      })
    })
  })
})
