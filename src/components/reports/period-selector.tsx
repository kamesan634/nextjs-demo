'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface PeriodSelectorProps {
  onChange: (startDate: string, endDate: string) => void
}

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'custom'

/**
 * 期間選擇器
 */
export function PeriodSelector({ onChange }: PeriodSelectorProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handlePeriodChange = (value: PeriodType) => {
    setPeriodType(value)

    const today = new Date()
    let start: Date
    const end: Date = today

    switch (value) {
      case 'today':
        start = today
        break
      case 'week':
        start = new Date(today)
        start.setDate(today.getDate() - 7)
        break
      case 'month':
        start = new Date(today)
        start.setMonth(today.getMonth() - 1)
        break
      case 'quarter':
        start = new Date(today)
        start.setMonth(today.getMonth() - 3)
        break
      case 'custom':
        return
      default:
        start = today
    }

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    setStartDate(startStr)
    setEndDate(endStr)
    onChange(startStr, endStr)
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      onChange(startDate, endDate)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={periodType} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="選擇期間" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">今天</SelectItem>
          <SelectItem value="week">本週</SelectItem>
          <SelectItem value="month">本月</SelectItem>
          <SelectItem value="quarter">本季</SelectItem>
          <SelectItem value="custom">自訂期間</SelectItem>
        </SelectContent>
      </Select>

      {periodType === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              選擇日期
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">結束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={handleCustomDateApply} className="w-full">
                套用
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
