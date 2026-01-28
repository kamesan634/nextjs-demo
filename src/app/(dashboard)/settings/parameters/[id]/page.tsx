import { notFound } from 'next/navigation'
import { getSystemParameter } from '@/actions/system-parameters'
import { PageHeader } from '@/components/layout'
import { ParameterForm } from '../parameter-form'

export const metadata = {
  title: '編輯系統參數',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditParameterPage({ params }: PageProps) {
  const { id } = await params
  const parameter = await getSystemParameter(id)

  if (!parameter) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="編輯系統參數"
        description={`編輯參數: ${parameter.code}`}
        backHref="/settings/parameters"
      />
      <ParameterForm parameter={parameter} />
    </div>
  )
}
