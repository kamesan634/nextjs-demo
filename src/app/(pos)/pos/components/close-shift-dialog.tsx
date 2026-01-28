'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface CloseShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftId: string
}

export function CloseShiftDialog({ open, onOpenChange, shiftId }: CloseShiftDialogProps) {
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClose = async () => {
    setIsProcessing(true)

    try {
      const { closeShift } = await import('@/actions/cashier-shifts')

      const result = await closeShift(shiftId, {
        closingCash: parseFloat(closingCash) || 0,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success('班別已結束')
        onOpenChange(false)
      } else {
        toast.error(result.message || '結束班別失敗')
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
          <DialogTitle>結班</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>結班現金</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              placeholder="請輸入抽屜中的現金金額"
            />
          </div>

          <div>
            <Label>備註</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="選填" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleClose} disabled={isProcessing}>
            {isProcessing ? '處理中...' : '確認結班'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
