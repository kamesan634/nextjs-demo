'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { customerSchema, type CustomerFormData } from '@/lib/validations/business'
import { createCustomer, updateCustomer } from '@/actions/customers'
import type { Decimal } from '@prisma/client/runtime/library'

interface Level {
  id: string
  code: string
  name: string
  discountRate: Decimal
  pointsMultiplier: Decimal
}

interface Customer {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  gender: string | null
  birthday: Date | null
  address: string | null
  levelId: string
  totalPoints: number
  availablePoints: number
  notes: string | null
  isActive: boolean
}

interface CustomerFormProps {
  customer?: Customer
  levels: Level[]
  generatedCode?: string
}

/**
 * 會員表單元件
 */
export function CustomerForm({ customer, levels, generatedCode }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!customer

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: customer?.code || generatedCode || '',
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      gender: (customer?.gender as 'M' | 'F' | 'O' | null) || null,
      birthday: customer?.birthday ? format(new Date(customer.birthday), 'yyyy-MM-dd') : '',
      address: customer?.address || '',
      levelId: customer?.levelId || levels[0]?.id || '',
      totalPoints: customer?.totalPoints || 0,
      availablePoints: customer?.availablePoints || 0,
      notes: customer?.notes || '',
      isActive: customer?.isActive ?? true,
    },
  })

  const onSubmit = async (data: CustomerFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCustomer(customer.id, data)
        : await createCustomer(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/customers')
        router.refresh()
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof CustomerFormData, {
              message: messages[0],
            })
          })
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 基本資料 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資料</CardTitle>
              <CardDescription>會員的基本資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>會員編號 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="C00001" disabled={isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="請輸入姓名" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性別</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="請選擇性別" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">男</SelectItem>
                          <SelectItem value="F">女</SelectItem>
                          <SelectItem value="O">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="levelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>會員等級 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="請選擇會員等級" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name} ({Number(level.discountRate) * 100}% 折扣)
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">啟用狀態</FormLabel>
                      <FormDescription>停用後會員將無法使用相關功能</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 聯絡資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>聯絡資訊</CardTitle>
              <CardDescription>會員的聯絡方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手機號碼</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0912345678" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>手機號碼必須唯一，用於會員識別</FormDescription>
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
                      <Input
                        type="email"
                        {...field}
                        placeholder="example@email.com"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地址</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="請輸入地址" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備註</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="會員備註..."
                        rows={4}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* 點數資訊（僅編輯時顯示） */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>點數資訊</CardTitle>
              <CardDescription>
                會員的點數狀態（僅供參考，如需調整請使用點數調整功能）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">累計點數</div>
                  <div className="text-2xl font-bold">
                    {form.watch('totalPoints').toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">可用點數</div>
                  <div className="text-2xl font-bold">
                    {form.watch('availablePoints').toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 提交按鈕 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '處理中...' : isEditing ? '更新會員' : '建立會員'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
