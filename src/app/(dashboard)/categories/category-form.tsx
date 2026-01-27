'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory, updateCategory } from '@/actions/categories'
import { categorySchema, type CategoryFormData } from '@/lib/validations/products'
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

interface CategoryFormProps {
  category?: {
    id: string
    code: string
    name: string
    description: string | null
    parentId: string | null
    sortOrder: number
    isActive: boolean
  }
  parentOptions: { value: string; label: string }[]
}

/**
 * 分類表單元件
 */
export function CategoryForm({ category, parentOptions }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!category

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      code: category?.code || '',
      name: category?.name || '',
      description: category?.description || '',
      parentId: category?.parentId || '',
      sortOrder: category?.sortOrder || 0,
      isActive: category?.isActive ?? true,
    },
  })

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)

    try {
      const result = isEditing
        ? await updateCategory(category.id, data)
        : await createCategory(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/categories')
        router.refresh()
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof CategoryFormData, {
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

  // 過濾掉自己 (編輯時不能選擇自己為父分類)
  const filteredParentOptions = isEditing
    ? parentOptions.filter((opt) => opt.value !== category.id)
    : parentOptions

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '編輯分類' : '新增分類'}</CardTitle>
        <CardDescription>填寫分類基本資料</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分類代碼 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: ELECTRONICS" {...field} />
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
                    <FormLabel>分類名稱 *</FormLabel>
                    <FormControl>
                      <Input placeholder="請輸入分類名稱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>上層分類</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇上層分類 (不選則為第一層)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">無 (第一層分類)</SelectItem>
                      {filteredParentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>設定此分類的上層分類，用於建立分類階層結構</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分類描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="請輸入分類描述" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序順序</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>數字越小排序越前面</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>啟用分類</FormLabel>
                    <FormDescription>停用的分類將不會出現在選項中</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '儲存變更' : '建立分類'}
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
