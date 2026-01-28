'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createScheduledReport } from '@/actions/scheduled-reports'
import {
  createScheduledReportSchema,
  type CreateScheduledReportFormData,
} from '@/lib/validations/scheduled-reports'
import { commonCronExpressions } from '@/lib/cron-utils'

interface ScheduleFormProps {
  reports: { id: string; name: string }[]
}

export function ScheduleForm({ reports }: ScheduleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [emailInput, setEmailInput] = useState('')

  const form = useForm<CreateScheduledReportFormData>({
    resolver: zodResolver(createScheduledReportSchema),
    defaultValues: {
      reportId: '',
      schedule: '0 8 * * *',
      recipients: [],
      format: 'EXCEL',
      isActive: true,
    },
  })

  const recipients = form.watch('recipients') || []

  const addRecipient = () => {
    if (!emailInput) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error('請輸入有效的電子郵件')
      return
    }
    if (recipients.includes(emailInput)) {
      toast.error('此電子郵件已存在')
      return
    }
    form.setValue('recipients', [...recipients, emailInput])
    setEmailInput('')
  }

  const removeRecipient = (email: string) => {
    form.setValue(
      'recipients',
      recipients.filter((r) => r !== email)
    )
  }

  const onSubmit = async (data: CreateScheduledReportFormData) => {
    startTransition(async () => {
      const result = await createScheduledReport(data)
      if (result.success) {
        toast.success(result.message)
        router.push('/reports/scheduled')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>排程設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>報表</Label>
              <Select
                value={form.watch('reportId')}
                onValueChange={(value) => form.setValue('reportId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇報表" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.reportId && (
                <p className="text-sm text-destructive">{form.formState.errors.reportId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>匯出格式</Label>
              <Select
                value={form.watch('format')}
                onValueChange={(value) => form.setValue('format', value as 'EXCEL' | 'PDF')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>執行頻率</Label>
            <Select
              value={form.watch('schedule')}
              onValueChange={(value) => form.setValue('schedule', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonCronExpressions.map((expr) => (
                  <SelectItem key={expr.value} value={expr.value}>
                    {expr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Cron 表達式: {form.watch('schedule')}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive">立即啟用排程</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>收件者</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="輸入電子郵件"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addRecipient()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addRecipient}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.formState.errors.recipients && (
            <p className="text-sm text-destructive">{form.formState.errors.recipients.message}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {recipients.map((email) => (
              <Badge key={email} variant="secondary" className="pr-1">
                {email}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-4 w-4"
                  onClick={() => removeRecipient(email)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? '建立中...' : '建立排程'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  )
}
