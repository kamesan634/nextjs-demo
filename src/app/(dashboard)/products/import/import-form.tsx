'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { importProducts } from '@/actions/product-import'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ImportError {
  row: number
  message: string
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: ImportError[]
}

export function ImportForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('請選擇 Excel 檔案 (.xlsx 或 .xls)')
        return
      }
      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('請先選擇檔案')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await importProducts(formData)

      if (res.success && res.data) {
        setResult(res.data)
        toast.success(res.message)
      } else {
        toast.error(res.message || '匯入失敗')
      }
    } catch {
      toast.error('匯入過程發生錯誤')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>匯入商品</CardTitle>
          <CardDescription>
            上傳 Excel 檔案以批次匯入商品資料。已存在的商品 (依 SKU 比對) 將會更新。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <a href="/api/products/template" download>
                <Download className="mr-2 h-4 w-4" />
                下載匯入範本
              </a>
            </Button>
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {selectedFile ? (
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">點擊選擇檔案或拖曳檔案至此</p>
                <p className="text-sm text-muted-foreground mt-1">支援 .xlsx, .xls 格式</p>
              </div>
            )}
          </div>

          <Button onClick={handleImport} disabled={!selectedFile || isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? '匯入中...' : '開始匯入'}
          </Button>
        </CardContent>
      </Card>

      {/* 匯入結果 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>匯入結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">總筆數</p>
                <p className="text-2xl font-bold">{result.total}</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">成功</p>
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">失敗</p>
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              </div>
            </div>

            {result.failed === 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>匯入完成</AlertTitle>
                <AlertDescription>所有商品資料已成功匯入。</AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>部分資料匯入失敗</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-sm">
                        第 {err.row} 行：{err.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
