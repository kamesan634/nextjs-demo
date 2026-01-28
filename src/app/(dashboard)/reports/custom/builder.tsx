'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCustomReport, updateCustomReport } from '@/actions/custom-reports'
import {
  createCustomReportSchema,
  type CreateCustomReportFormData,
} from '@/lib/validations/custom-reports'
import { availableFields, type DataSource } from '@/lib/report-query-builder'

interface ReportBuilderProps {
  report?: {
    id: string
    name: string
    description: string | null
    queryDefinition: unknown
    chartConfig: unknown
    isPublic: boolean
  }
}

const dataSources: { value: DataSource; label: string }[] = [
  { value: 'orders', label: '訂單' },
  { value: 'products', label: '商品' },
  { value: 'customers', label: '客戶' },
  { value: 'inventory', label: '庫存' },
  { value: 'purchase_orders', label: '採購單' },
]

const operators = [
  { value: 'eq', label: '等於' },
  { value: 'ne', label: '不等於' },
  { value: 'gt', label: '大於' },
  { value: 'gte', label: '大於等於' },
  { value: 'lt', label: '小於' },
  { value: 'lte', label: '小於等於' },
  { value: 'contains', label: '包含' },
]

const chartTypes = [
  { value: 'table', label: '表格' },
  { value: 'bar', label: '長條圖' },
  { value: 'line', label: '折線圖' },
  { value: 'pie', label: '圓餅圖' },
]

export function ReportBuilder({ report }: ReportBuilderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>(
    (report?.queryDefinition as { dataSource?: DataSource })?.dataSource || 'orders'
  )

  const defaultQueryDef = report?.queryDefinition as
    | CreateCustomReportFormData['queryDefinition']
    | undefined

  const form = useForm<CreateCustomReportFormData>({
    resolver: zodResolver(createCustomReportSchema),
    defaultValues: {
      name: report?.name || '',
      description: report?.description || '',
      queryDefinition: defaultQueryDef || {
        dataSource: 'orders',
        fields: [],
        filters: [],
        groupBy: [],
        orderBy: [],
        limit: 100,
      },
      chartConfig: (report?.chartConfig as CreateCustomReportFormData['chartConfig']) || {
        type: 'table',
        title: '',
      },
      isPublic: report?.isPublic || false,
    },
  })

  const {
    fields: filterFields,
    append: appendFilter,
    remove: removeFilter,
  } = useFieldArray({
    control: form.control,
    name: 'queryDefinition.filters',
  })

  const onSubmit = async (data: CreateCustomReportFormData) => {
    startTransition(async () => {
      const result = report
        ? await updateCustomReport(report.id, data)
        : await createCustomReport(data, 'current-user')

      if (result.success) {
        toast.success(result.message)
        router.push('/reports/custom')
      } else {
        toast.error(result.message)
      }
    })
  }

  const currentFields = availableFields[selectedDataSource] || []

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>報表名稱</Label>
              <Input {...form.register('name')} placeholder="輸入報表名稱" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isPublic"
                checked={form.watch('isPublic')}
                onCheckedChange={(checked) => form.setValue('isPublic', checked as boolean)}
              />
              <Label htmlFor="isPublic">公開報表</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea {...form.register('description')} placeholder="輸入報表描述" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>資料查詢</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>資料來源</Label>
              <Select
                value={selectedDataSource}
                onValueChange={(value: DataSource) => {
                  setSelectedDataSource(value)
                  form.setValue('queryDefinition.dataSource', value)
                  form.setValue('queryDefinition.fields', [])
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((ds) => (
                    <SelectItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>結果限制</Label>
              <Input
                type="number"
                {...form.register('queryDefinition.limit', { valueAsNumber: true })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>選擇欄位</Label>
            <div className="flex flex-wrap gap-2">
              {currentFields.map((field) => {
                const isSelected = form.watch('queryDefinition.fields')?.includes(field.name)
                return (
                  <Button
                    key={field.name}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const current = form.getValues('queryDefinition.fields') || []
                      if (isSelected) {
                        form.setValue(
                          'queryDefinition.fields',
                          current.filter((f) => f !== field.name)
                        )
                      } else {
                        form.setValue('queryDefinition.fields', [...current, field.name])
                      }
                    }}
                  >
                    {field.label}
                  </Button>
                )
              })}
            </div>
            {form.formState.errors.queryDefinition?.fields && (
              <p className="text-sm text-destructive">
                {form.formState.errors.queryDefinition.fields.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>篩選條件</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendFilter({ field: '', operator: 'eq', value: '' })}
              >
                <Plus className="mr-1 h-4 w-4" />
                新增篩選
              </Button>
            </div>
            {filterFields.map((filter, index) => (
              <div key={filter.id} className="flex items-center gap-2">
                <Select
                  value={form.watch(`queryDefinition.filters.${index}.field`)}
                  onValueChange={(value) =>
                    form.setValue(`queryDefinition.filters.${index}.field`, value)
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="選擇欄位" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentFields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={form.watch(`queryDefinition.filters.${index}.operator`)}
                  onValueChange={(value) =>
                    form.setValue(
                      `queryDefinition.filters.${index}.operator`,
                      value as 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
                    )
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="值"
                  value={String(form.watch(`queryDefinition.filters.${index}.value`) || '')}
                  onChange={(e) =>
                    form.setValue(`queryDefinition.filters.${index}.value`, e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>圖表設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>圖表類型</Label>
              <Select
                value={form.watch('chartConfig.type') || 'table'}
                onValueChange={(value) =>
                  form.setValue('chartConfig.type', value as 'bar' | 'line' | 'pie' | 'table')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>圖表標題</Label>
              <Input {...form.register('chartConfig.title')} placeholder="輸入圖表標題" />
            </div>
          </div>
          {form.watch('chartConfig.type') !== 'table' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>X 軸欄位</Label>
                <Select
                  value={form.watch('chartConfig.xField') || ''}
                  onValueChange={(value) => form.setValue('chartConfig.xField', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇欄位" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentFields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Y 軸欄位</Label>
                <Select
                  value={form.watch('chartConfig.yField') || ''}
                  onValueChange={(value) => form.setValue('chartConfig.yField', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇欄位" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentFields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? '儲存中...' : report ? '更新報表' : '建立報表'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="button" variant="secondary">
          <Play className="mr-2 h-4 w-4" />
          預覽
        </Button>
      </div>
    </form>
  )
}
