'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createNumberingRule, updateNumberingRule } from '@/actions/numbering-rules'
import {
  createNumberingRuleSchema,
  updateNumberingRuleSchema,
  resetPeriods,
  type CreateNumberingRuleFormData,
  type UpdateNumberingRuleFormData,
} from '@/lib/validations/numbering-rules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NumberingRuleFormProps {
  rule?: {
    id: string
    code: string
    name: string
    prefix: string
    dateFormat: string | null
    sequenceLength: number
    currentSequence: number
    resetPeriod: string | null
    isActive: boolean
  }
}

const resetPeriodLabels: Record<string, string> = {
  DAILY: '每日',
  MONTHLY: '每月',
  YEARLY: '每年',
  NEVER: '不重設',
}

const dateFormatOptions = [
  { value: '', label: '不使用' },
  { value: 'YYYYMMDD', label: 'YYYYMMDD (例: 20260128)' },
  { value: 'YYYYMM', label: 'YYYYMM (例: 202601)' },
  { value: 'YYYY', label: 'YYYY (例: 2026)' },
]

export function NumberingRuleForm({ rule }: NumberingRuleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!rule

  const form = useForm<CreateNumberingRuleFormData>({
    resolver: zodResolver(createNumberingRuleSchema),
    defaultValues: {
      code: rule?.code || '',
      name: rule?.name || '',
      prefix: rule?.prefix || '',
      dateFormat: rule?.dateFormat || '',
      sequenceLength: rule?.sequenceLength || 4,
      resetPeriod: (rule?.resetPeriod as (typeof resetPeriods)[number]) || 'NEVER',
      isActive: rule?.isActive ?? true,
    },
  })

  const onSubmit = async (data: CreateNumberingRuleFormData) => {
    setIsSubmitting(true)

    try {
      const result = isEditing
        ? await updateNumberingRule(rule.id, data as UpdateNumberingRuleFormData)
        : await createNumberingRule(data as CreateNumberingRuleFormData)

      if (result.success) {
        toast.success(result.message)
        router.push('/settings/numbering-rules')
        router.refresh()
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof CreateNumberingRuleFormData, {
              message: messages[0],
            })
          })
        }
      }
    } catch {
      toast.error('操作失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 預覽編號格式
  const prefix = form.watch('prefix') || ''
  const dateFormat = form.watch('dateFormat') || ''
  const sequenceLength = form.watch('sequenceLength') || 4
  const previewNumber = `${prefix}${dateFormat ? getDatePreview(dateFormat) : ''}${'0'.repeat(sequenceLength).slice(0, -1)}1`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '編輯編號規則' : '新增編號規則'}</CardTitle>
        <CardDescription>設定單據自動編號規則</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>規則代碼 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例: ORDER" {...field} />
                      </FormControl>
                      <FormDescription>只能包含大寫英文、數字和底線</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>規則名稱 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 銷售訂單編號" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>前綴 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: SO-" {...field} />
                    </FormControl>
                    <FormDescription>只能包含大寫英文、數字和連字號</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日期格式</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇日期格式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dateFormatOptions.map((opt) => (
                          <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sequenceLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>序號長度 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resetPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>重設週期</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'NEVER'}>
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="選擇重設週期" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resetPeriods.map((period) => (
                        <SelectItem key={period} value={period}>
                          {resetPeriodLabels[period]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>序號將在選定的週期自動歸零</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 預覽 */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium mb-1">編號預覽</p>
              <code className="text-lg">{previewNumber}</code>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>啟用規則</FormLabel>
                    <FormDescription>停用的規則將無法產生編號</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '儲存變更' : '建立規則'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                取消
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function getDatePreview(format: string): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  switch (format) {
    case 'YYYYMMDD':
      return `${year}${month}${day}`
    case 'YYYYMM':
      return `${year}${month}`
    case 'YYYY':
      return year
    default:
      return ''
  }
}
