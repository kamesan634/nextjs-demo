'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ExportButtonProps {
  url: string
  filename: string
}

/**
 * 報表匯出按鈕
 */
export function ExportButton({ url, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('匯出失敗')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('報表匯出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('匯出失敗，請稍後再試')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? '匯出中...' : '匯出報表'}
    </Button>
  )
}
