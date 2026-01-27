'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createUser, updateUser } from '@/actions/users'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/lib/validations/auth'
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

interface UserFormProps {
  user?: {
    id: string
    username: string
    email: string
    name: string
    phone: string | null
    isActive: boolean
    roleId: string
    storeId: string | null
  }
  roleOptions: { value: string; label: string; code: string }[]
  storeOptions: { value: string; label: string }[]
}

/**
 * 使用者表單元件
 * 用於新增和編輯使用者
 */
export function UserForm({ user, roleOptions, storeOptions }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!user

  // 表單設定
  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing
      ? {
          email: user.email,
          password: '',
          name: user.name,
          phone: user.phone || '',
          roleId: user.roleId,
          storeId: user.storeId || '',
          isActive: user.isActive,
        }
      : {
          username: '',
          email: '',
          password: '',
          name: '',
          phone: '',
          roleId: '',
          storeId: '',
          isActive: true,
        },
  })

  // 表單提交處理
  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    setIsSubmitting(true)

    try {
      const result = isEditing
        ? await updateUser(user.id, data as UpdateUserFormData)
        : await createUser(data as CreateUserFormData)

      if (result.success) {
        toast.success(result.message)
        router.push('/settings/users')
        router.refresh()
      } else {
        toast.error(result.message)
        // 設定欄位錯誤
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof typeof data, {
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
        <CardTitle>{isEditing ? '編輯使用者' : '新增使用者'}</CardTitle>
        <CardDescription>
          {isEditing ? '修改使用者資料，留空密碼欄位則不變更密碼' : '填寫使用者基本資料'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 帳號 (僅新增時可編輯) */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>帳號 *</FormLabel>
                    <FormControl>
                      <Input placeholder="請輸入帳號" {...field} />
                    </FormControl>
                    <FormDescription>僅能使用英文字母、數字和底線，建立後無法修改</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 姓名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="請輸入姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 電子郵件 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電子郵件 *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="請輸入電子郵件" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 密碼 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? '密碼' : '密碼 *'}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? '留空則不變更密碼' : '請輸入密碼'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>密碼至少需要 6 個字元</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 電話 */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電話</FormLabel>
                  <FormControl>
                    <Input placeholder="請輸入電話" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 角色 */}
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 所屬門市 */}
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所屬門市</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇門市 (可不選)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">無</SelectItem>
                      {storeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 啟用狀態 */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>啟用帳號</FormLabel>
                    <FormDescription>停用的帳號將無法登入系統</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* 按鈕 */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '儲存變更' : '建立使用者'}
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
