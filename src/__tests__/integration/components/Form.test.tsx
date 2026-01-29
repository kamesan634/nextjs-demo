/**
 * Form 元件整合測試
 * 測試 react-hook-form 整合的表單元件
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// 測試用的 schema
const testSchema = z.object({
  username: z.string().min(2, '使用者名稱至少需要 2 個字元'),
  email: z.string().email('請輸入有效的電子郵件'),
})

type TestFormValues = z.infer<typeof testSchema>

// 測試用的表單元件
function TestForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit?: (data: TestFormValues) => void
  defaultValues?: Partial<TestFormValues>
}) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      username: '',
      email: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit || (() => {}))} noValidate>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>使用者名稱</FormLabel>
              <FormControl>
                <Input placeholder="請輸入使用者名稱" {...field} />
              </FormControl>
              <FormDescription>這是您的顯示名稱</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電子郵件</FormLabel>
              <FormControl>
                <Input type="email" placeholder="請輸入電子郵件" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">送出</button>
      </form>
    </Form>
  )
}

// ============================================================================
// Form 元件測試
// ============================================================================
describe('Form 元件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染表單結構', () => {
      render(<TestForm />)

      expect(screen.getByLabelText('使用者名稱')).toBeInTheDocument()
      expect(screen.getByLabelText('電子郵件')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
    })

    it('應該渲染 FormLabel 元件', () => {
      render(<TestForm />)

      const usernameLabel = screen.getByText('使用者名稱')
      expect(usernameLabel).toBeInTheDocument()
      expect(usernameLabel).toHaveAttribute('data-slot', 'form-label')
    })

    it('應該渲染 FormDescription 元件', () => {
      render(<TestForm />)

      const description = screen.getByText('這是您的顯示名稱')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'form-description')
    })

    it('FormItem 應該有正確的 data-slot 屬性', () => {
      const { container } = render(<TestForm />)

      const formItems = container.querySelectorAll('[data-slot="form-item"]')
      expect(formItems.length).toBe(2)
    })

    it('FormControl 應該有正確的 data-slot 屬性', () => {
      const { container } = render(<TestForm />)

      const formControls = container.querySelectorAll('[data-slot="form-control"]')
      expect(formControls.length).toBe(2)
    })
  })

  describe('預設值', () => {
    it('應該正確顯示預設值', () => {
      render(
        <TestForm
          defaultValues={{
            username: '測試使用者',
            email: 'test@example.com',
          }}
        />
      )

      expect(screen.getByLabelText('使用者名稱')).toHaveValue('測試使用者')
      expect(screen.getByLabelText('電子郵件')).toHaveValue('test@example.com')
    })
  })

  describe('使用者交互', () => {
    it('應該允許使用者輸入', async () => {
      const { user } = render(<TestForm />)

      const usernameInput = screen.getByLabelText('使用者名稱')
      await user.type(usernameInput, 'testuser')

      expect(usernameInput).toHaveValue('testuser')
    })

    it('應該在輸入無效資料時顯示錯誤訊息', async () => {
      const { user } = render(<TestForm />)

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('使用者名稱至少需要 2 個字元')).toBeInTheDocument()
      })
    })

    it('應該在輸入無效電子郵件時顯示錯誤訊息', async () => {
      const { user, container } = render(<TestForm />)

      // 先填入有效的使用者名稱（避免兩個錯誤同時出現）
      const usernameInput = screen.getByLabelText('使用者名稱')
      await user.type(usernameInput, 'validuser')

      // 使用一個明顯無效的 email 格式（不含 @）
      const emailInput = screen.getByLabelText('電子郵件')
      await user.type(emailInput, 'notanemail')

      // 讓 input 失去焦點
      await user.tab()

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(
        () => {
          // 驗證錯誤訊息應該出現（使用 form-message slot 來確認有錯誤）
          const formMessages = container.querySelectorAll('[data-slot="form-message"]')
          expect(formMessages.length).toBeGreaterThan(0)
        },
        { timeout: 3000 }
      )
    })

    it('錯誤訊息應該有正確的 data-slot 屬性', async () => {
      const { user, container } = render(<TestForm />)

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        const formMessage = container.querySelector('[data-slot="form-message"]')
        expect(formMessage).toBeInTheDocument()
      })
    })

    it('應該在輸入有效資料後清除錯誤訊息', async () => {
      const { user } = render(<TestForm />)

      // 先觸發錯誤
      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('使用者名稱至少需要 2 個字元')).toBeInTheDocument()
      })

      // 輸入有效值
      const usernameInput = screen.getByLabelText('使用者名稱')
      await user.type(usernameInput, 'validuser')

      await waitFor(() => {
        expect(screen.queryByText('使用者名稱至少需要 2 個字元')).not.toBeInTheDocument()
      })
    })
  })

  describe('表單提交', () => {
    it('應該在驗證通過後呼叫 onSubmit', async () => {
      const handleSubmit = vi.fn()
      const { user } = render(<TestForm onSubmit={handleSubmit} />)

      const usernameInput = screen.getByLabelText('使用者名稱')
      const emailInput = screen.getByLabelText('電子郵件')

      await user.type(usernameInput, 'testuser')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          {
            username: 'testuser',
            email: 'test@example.com',
          },
          expect.anything()
        )
      })
    })

    it('驗證失敗時不應該呼叫 onSubmit', async () => {
      const handleSubmit = vi.fn()
      const { user } = render(<TestForm onSubmit={handleSubmit} />)

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('使用者名稱至少需要 2 個字元')).toBeInTheDocument()
      })

      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })

  describe('無障礙性', () => {
    it('輸入框應該有正確的 aria-describedby 屬性', () => {
      render(<TestForm />)

      const usernameInput = screen.getByLabelText('使用者名稱')
      expect(usernameInput).toHaveAttribute('aria-describedby')
    })

    it('錯誤狀態時輸入框應該有 aria-invalid 屬性', async () => {
      const { user } = render(<TestForm />)

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        const usernameInput = screen.getByLabelText('使用者名稱')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('Label 應該與輸入框正確關聯', () => {
      render(<TestForm />)

      const usernameLabel = screen.getByText('使用者名稱')
      const usernameInput = screen.getByLabelText('使用者名稱')

      expect(usernameLabel).toHaveAttribute('for', usernameInput.id)
    })
  })

  describe('樣式', () => {
    it('FormItem 應該有 grid gap 樣式', () => {
      const { container } = render(<TestForm />)

      const formItem = container.querySelector('[data-slot="form-item"]')
      expect(formItem).toHaveClass('grid', 'gap-2')
    })

    it('FormDescription 應該有正確的文字樣式', () => {
      render(<TestForm />)

      const description = screen.getByText('這是您的顯示名稱')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('錯誤訊息應該有 destructive 文字顏色', async () => {
      const { user } = render(<TestForm />)

      const submitButton = screen.getByRole('button', { name: '送出' })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('使用者名稱至少需要 2 個字元')
        expect(errorMessage).toHaveClass('text-destructive')
      })
    })
  })
})
