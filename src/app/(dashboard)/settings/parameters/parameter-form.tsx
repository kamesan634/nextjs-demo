'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSystemParameter, updateSystemParameter } from '@/actions/system-parameters'
import {
  createSystemParameterSchema,
  updateSystemParameterSchema,
  parameterDataTypes,
  parameterCategories,
  type CreateSystemParameterFormData,
  type UpdateSystemParameterFormData,
} from '@/lib/validations/system-parameters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface ParameterFormProps {
  parameter?: {
    id: string
    code: string
    name: string
    value: string
    dataType: string
    category: string
    description: string | null
    isEditable: boolean
  }
}

const categoryLabels: Record<string, string> = {
  COMPANY: '公司設定',
  TAX: '稅務設定',
  INVENTORY: '庫存設定',
  SALES: '銷售設定',
  SECURITY: '安全設定',
}

const dataTypeLabels: Record<string, string> = {
  STRING: '文字',
  NUMBER: '數字',
  BOOLEAN: '布林',
  JSON: 'JSON',
}

export function ParameterForm({ parameter }: ParameterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!parameter

  const form = useForm<CreateSystemParameterFormData>({
    resolver: zodResolver(createSystemParameterSchema),
    defaultValues: {
      code: parameter?.code || '',
      name: parameter?.name || '',
      value: parameter?.value || '',
      dataType: (parameter?.dataType as (typeof parameterDataTypes)[number]) || 'STRING',
      category: (parameter?.category as (typeof parameterCategories)[number]) || 'COMPANY',
      description: parameter?.description || '',
      isEditable: parameter?.isEditable ?? true,
    },
  })

  const onSubmit = async (data: CreateSystemParameterFormData) => {
    setIsSubmitting(true)

    try {
      const result = isEditing
        ? await updateSystemParameter(parameter.id, data as UpdateSystemParameterFormData)
        : await createSystemParameter(data as CreateSystemParameterFormData)

      if (result.success) {
        toast.success(result.message)
        router.push('/settings/parameters')
        router.refresh()
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof CreateSystemParameterFormData, {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '編輯系統參數' : '新增系統參數'}</CardTitle>
        <CardDescription>填寫系統參數資料</CardDescription>
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
                      <FormLabel>參數代碼 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例: COMPANY_NAME" {...field} />
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
                    <FormLabel>參數名稱 *</FormLabel>
                    <FormControl>
                      <Input placeholder="請輸入參數名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>資料類型 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇資料類型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parameterDataTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {dataTypeLabels[type]}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分類 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇分類" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parameterCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>參數值 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="請輸入參數值" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormDescription>
                    {form.watch('dataType') === 'BOOLEAN' && '請輸入 true 或 false'}
                    {form.watch('dataType') === 'NUMBER' && '請輸入數字'}
                    {form.watch('dataType') === 'JSON' && '請輸入有效的 JSON 格式'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="請輸入參數描述" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isEditable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>允許編輯</FormLabel>
                    <FormDescription>不允許編輯的參數將無法修改或刪除</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '儲存變更' : '建立參數'}
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
