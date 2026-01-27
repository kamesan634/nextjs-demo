/**
 * StatusBadge 元件測試
 * 測試狀態標籤元件的渲染
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import {
  StatusBadge,
  ActiveBadge,
  orderStatusMap,
  paymentStatusMap,
  purchaseOrderStatusMap,
  inventoryMovementTypeMap,
} from '@/components/forms/status-badge'

describe('StatusBadge', () => {
  describe('基本渲染', () => {
    it('應根據狀態顯示對應標籤', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} />)

      expect(screen.getByText('待處理')).toBeInTheDocument()
    })

    it('未知狀態應顯示原始值', () => {
      render(<StatusBadge status="UNKNOWN" statusMap={orderStatusMap} />)

      expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    })

    it('應套用自訂 className', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} className="custom-class" />)

      expect(screen.getByText('待處理')).toHaveClass('custom-class')
    })
  })

  describe('orderStatusMap', () => {
    it('應正確顯示待處理狀態', () => {
      render(<StatusBadge status="PENDING" statusMap={orderStatusMap} />)

      expect(screen.getByText('待處理')).toBeInTheDocument()
    })

    it('應正確顯示已確認狀態', () => {
      render(<StatusBadge status="CONFIRMED" statusMap={orderStatusMap} />)

      expect(screen.getByText('已確認')).toBeInTheDocument()
    })

    it('應正確顯示已完成狀態', () => {
      render(<StatusBadge status="COMPLETED" statusMap={orderStatusMap} />)

      expect(screen.getByText('已完成')).toBeInTheDocument()
    })

    it('應正確顯示已取消狀態', () => {
      render(<StatusBadge status="CANCELLED" statusMap={orderStatusMap} />)

      expect(screen.getByText('已取消')).toBeInTheDocument()
    })
  })

  describe('paymentStatusMap', () => {
    it('應正確顯示未付款狀態', () => {
      render(<StatusBadge status="UNPAID" statusMap={paymentStatusMap} />)

      expect(screen.getByText('未付款')).toBeInTheDocument()
    })

    it('應正確顯示部分付款狀態', () => {
      render(<StatusBadge status="PARTIAL" statusMap={paymentStatusMap} />)

      expect(screen.getByText('部分付款')).toBeInTheDocument()
    })

    it('應正確顯示已付款狀態', () => {
      render(<StatusBadge status="PAID" statusMap={paymentStatusMap} />)

      expect(screen.getByText('已付款')).toBeInTheDocument()
    })
  })

  describe('purchaseOrderStatusMap', () => {
    it('應正確顯示草稿狀態', () => {
      render(<StatusBadge status="DRAFT" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('草稿')).toBeInTheDocument()
    })

    it('應正確顯示待核准狀態', () => {
      render(<StatusBadge status="PENDING" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('待核准')).toBeInTheDocument()
    })

    it('應正確顯示已核准狀態', () => {
      render(<StatusBadge status="APPROVED" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('已核准')).toBeInTheDocument()
    })

    it('應正確顯示部分到貨狀態', () => {
      render(<StatusBadge status="PARTIAL" statusMap={purchaseOrderStatusMap} />)

      expect(screen.getByText('部分到貨')).toBeInTheDocument()
    })
  })

  describe('inventoryMovementTypeMap', () => {
    it('應正確顯示入庫類型', () => {
      render(<StatusBadge status="IN" statusMap={inventoryMovementTypeMap} />)

      expect(screen.getByText('入庫')).toBeInTheDocument()
    })

    it('應正確顯示出庫類型', () => {
      render(<StatusBadge status="OUT" statusMap={inventoryMovementTypeMap} />)

      expect(screen.getByText('出庫')).toBeInTheDocument()
    })

    it('應正確顯示調整類型', () => {
      render(<StatusBadge status="ADJUST" statusMap={inventoryMovementTypeMap} />)

      expect(screen.getByText('調整')).toBeInTheDocument()
    })

    it('應正確顯示調撥類型', () => {
      render(<StatusBadge status="TRANSFER" statusMap={inventoryMovementTypeMap} />)

      expect(screen.getByText('調撥')).toBeInTheDocument()
    })
  })

  describe('ActiveBadge', () => {
    it('啟用狀態應顯示「啟用」', () => {
      render(<ActiveBadge isActive={true} />)

      expect(screen.getByText('啟用')).toBeInTheDocument()
    })

    it('停用狀態應顯示「停用」', () => {
      render(<ActiveBadge isActive={false} />)

      expect(screen.getByText('停用')).toBeInTheDocument()
    })

    it('應套用自訂 className', () => {
      render(<ActiveBadge isActive={true} className="custom-class" />)

      expect(screen.getByText('啟用')).toHaveClass('custom-class')
    })
  })
})
