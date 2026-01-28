'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface OpenShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  storeId: string
}

export function OpenShiftDialog({ open, onOpenChange, userId, storeId }: OpenShiftDialogProps) {
  const [openingCash, setOpeningCash] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleOpen = async () => {
    setIsProcessing(true)

    try {
      const { openShift } = await import('@/actions/cashier-shifts')

      const result = await openShift({
        userId,
        storeId,
        openingCash: parseFloat(openingCash) || 0,
      })

      if (result.success) {
        toast.success('班別已開啟')
        onOpenChange(false)
      } else {
        toast.error(result.message || '開啟班別失敗')
      }
    } catch {
      toast.error('操作失敗')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>開班</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>開班現金</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="請輸入抽屜中的現金金額"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleOpen} disabled={isProcessing}>
            {isProcessing ? '處理中...' : '確認開班'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
