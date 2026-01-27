'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCoupon } from '@/actions/promotions'

/**
 * 新增優惠券頁面
 */
export default function NewCouponPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // 表單狀態
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [perUserLimit, setPerUserLimit] = useState('1')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  // 生成隨機優惠碼
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCode(result)
  }

  // 複製優惠碼
  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('優惠碼已複製')
    }
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || !name || !discountValue || !startDate || !endDate) {
      toast.error('請填寫必要欄位')
      return
    }

    setSubmitting(true)

    const result = await createCoupon({
      code,
      name,
      description: description || undefined,
      discountType,
      discountValue: Number(discountValue),
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      startDate,
      endDate,
      isActive,
    })

    setSubmitting(false)

    if (result.success) {
      toast.success(result.message)
      router.push('/promotions?tab=coupons')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/promotions?tab=coupons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">新增優惠券</h1>
          <p className="text-sm text-muted-foreground">建立新的優惠券</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：基本資訊 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">優惠碼 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="例：SAVE20"
                      className="font-mono"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      產生
                    </Button>
                    {code && (
                      <Button type="button" variant="ghost" size="icon" onClick={copyCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">優惠券名稱 *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：新會員折扣"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">說明</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="輸入優惠券說明..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>折扣設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">折扣方式 *</Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">百分比折扣</SelectItem>
                        <SelectItem value="FIXED">固定金額</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      折扣值 * {discountType === 'PERCENTAGE' ? '(%)' : '(NT$)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'PERCENTAGE' ? '10' : '100'}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minPurchase">最低消費金額</Label>
                    <Input
                      id="minPurchase"
                      type="number"
                      min="0"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">訂單需滿此金額才能使用</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">最高折扣金額</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="不限"
                    />
                    <p className="text-xs text-muted-foreground">折扣金額上限（百分比折扣適用）</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：期間與限制 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>有效期間</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">開始日期 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">結束日期 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>使用限制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">總使用次數限制</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="不限"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perUserLimit">每人使用次數</Label>
                  <Input
                    id="perUserLimit"
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>立即啟用</Label>
                    <p className="text-sm text-muted-foreground">建立後立即生效</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? '處理中...' : '建立優惠券'}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/promotions?tab=coupons">取消</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
