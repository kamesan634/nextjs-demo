import { z } from 'zod'

/**
 * 自訂報表驗證 Schema
 */

export const createCustomReportSchema = z.object({
  name: z.string().min(1, '請輸入報表名稱').max(100, '報表名稱長度不能超過 100 字元'),
  description: z.string().max(500).optional().nullable(),
  queryDefinition: z.object({
    dataSource: z.enum(['orders', 'products', 'customers', 'inventory', 'purchase_orders']),
    fields: z.array(z.string()).min(1, '請至少選擇一個欄位'),
    filters: z.array(
      z.object({
        field: z.string(),
        operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in']),
        value: z.unknown(),
      })
    ),
    groupBy: z.array(z.string()).optional(),
    orderBy: z
      .array(
        z.object({
          field: z.string(),
          direction: z.enum(['asc', 'desc']),
        })
      )
      .optional(),
    limit: z.number().int().min(1).max(10000).optional(),
  }),
  chartConfig: z
    .object({
      type: z.enum(['bar', 'line', 'pie', 'table']),
      xField: z.string().optional(),
      yField: z.string().optional(),
      title: z.string().optional(),
    })
    .optional()
    .nullable(),
  isPublic: z.boolean(),
})

export const updateCustomReportSchema = createCustomReportSchema

export type CreateCustomReportFormData = z.infer<typeof createCustomReportSchema>
export type UpdateCustomReportFormData = z.infer<typeof updateCustomReportSchema>
