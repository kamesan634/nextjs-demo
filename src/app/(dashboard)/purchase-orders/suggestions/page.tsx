import { Suspense } from 'react'
import { getPurchaseSuggestions } from '@/actions/purchase-suggestions'
import { PageHeader } from '@/components/layout'
import { FormLoading } from '@/components/forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SuggestionTable } from './suggestion-table'

export const metadata = {
  title: '採購建議',
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    warehouseId?: string
    categoryId?: string
  }>
}

/**
 * 採購建議頁
 */
export default async function SuggestionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const warehouseId = params.warehouseId
  const categoryId = params.categoryId

  return (
    <div className="space-y-6">
      <PageHeader title="採購建議" description="基於庫存狀況和補貨點自動生成採購建議" />

      <Suspense fallback={<FormLoading message="載入採購建議中..." />}>
        <SuggestionData page={page} warehouseId={warehouseId} categoryId={categoryId} />
      </Suspense>
    </div>
  )
}

async function SuggestionData({
  page,
  warehouseId,
  categoryId,
}: {
  page: number
  warehouseId?: string
  categoryId?: string
}) {
  const result = await getPurchaseSuggestions({
    page,
    pageSize: 20,
    warehouseId,
    categoryId,
  })

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總建議數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{result.summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">緊急補貨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{result.summary.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高優先級</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{result.summary.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">預估金額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${result.summary.estimatedCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <SuggestionTable data={result.data} pagination={result.pagination} />
    </>
  )
}
