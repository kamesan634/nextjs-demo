/**
 * FormLoading 元件測試
 * 測試表單載入中元件的渲染
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { FormLoading } from '@/components/forms/form-loading'

describe('FormLoading', () => {
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
})
