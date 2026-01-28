'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPriceRule, deletePriceRule } from '@/actions/price-rules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog, ActiveBadge } from '@/components/forms'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface PriceRule {
  id: string
  ruleType: string
  minQuantity: number | null
  memberLevelId: string | null
  price: number
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  memberLevel: {
    id: string
    code: string
    name: string
  } | null
}

interface MemberLevel {
  id: string
  code: string
  name: string
}

interface PriceRuleFormProps {
  productId: string
  priceRules: PriceRule[]
  memberLevels: MemberLevel[]
}

const ruleTypeLabels: Record<string, string> = {
  QUANTITY: '數量折扣',
  MEMBER_LEVEL: '會員等級價',
  PROMOTION: '促銷價',
}

export function PriceRuleForm({ productId, priceRules, memberLevels }: PriceRuleFormProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [newRule, setNewRule] = useState({
    ruleType: 'QUANTITY' as string,
    minQuantity: 10,
    memberLevelId: '',
    price: 0,
    startDate: '',
    endDate: '',
  })

  const handleAdd = async () => {
    try {
      const result = await createPriceRule({
        productId,
        ruleType: newRule.ruleType as 'QUANTITY' | 'MEMBER_LEVEL' | 'PROMOTION',
        minQuantity: newRule.ruleType === 'QUANTITY' ? newRule.minQuantity : null,
        memberLevelId: newRule.ruleType === 'MEMBER_LEVEL' ? newRule.memberLevelId : null,
        price: newRule.price,
        startDate: newRule.startDate || null,
        endDate: newRule.endDate || null,
        isActive: true,
      })

      if (result.success) {
        toast.success(result.message)
        setIsAdding(false)
        setNewRule({
          ruleType: 'QUANTITY',
          minQuantity: 10,
          memberLevelId: '',
          price: 0,
          startDate: '',
          endDate: '',
        })
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('新增價格規則失敗')
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deletePriceRule(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 現有規則 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>價格規則</CardTitle>
            <CardDescription>管理此商品的各種價格規則</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="mr-2 h-4 w-4" />
            新增規則
          </Button>
        </CardHeader>
        <CardContent>
          {priceRules.length === 0 && !isAdding && (
            <p className="text-muted-foreground text-center py-8">尚無價格規則</p>
          )}

          <div className="space-y-3">
            {priceRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between border rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <Badge>{ruleTypeLabels[rule.ruleType]}</Badge>
                  <div>
                    {rule.ruleType === 'QUANTITY' && (
                      <p className="text-sm">購買 {rule.minQuantity} 件以上</p>
                    )}
                    {rule.ruleType === 'MEMBER_LEVEL' && (
                      <p className="text-sm">會員等級: {rule.memberLevel?.name || '-'}</p>
                    )}
                    {rule.ruleType === 'PROMOTION' && <p className="text-sm">促銷價格</p>}
                    {(rule.startDate || rule.endDate) && (
                      <p className="text-xs text-muted-foreground">
                        {rule.startDate ? new Date(rule.startDate).toLocaleDateString('zh-TW') : ''}
                        {' ~ '}
                        {rule.endDate ? new Date(rule.endDate).toLocaleDateString('zh-TW') : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">${rule.price.toLocaleString()}</span>
                  <ActiveBadge isActive={rule.isActive} />
                  <DeleteDialog
                    title="確定要刪除此價格規則嗎？"
                    description="此操作無法復原。"
                    onConfirm={() => handleDelete(rule.id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 新增規則表單 */}
          {isAdding && (
            <div className="border rounded-lg p-4 mt-4 space-y-4 bg-muted/50">
              <h4 className="font-medium">新增價格規則</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>規則類型</Label>
                  <Select
                    value={newRule.ruleType}
                    onValueChange={(v) => setNewRule((prev) => ({ ...prev, ruleType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUANTITY">數量折扣</SelectItem>
                      <SelectItem value="MEMBER_LEVEL">會員等級價</SelectItem>
                      <SelectItem value="PROMOTION">促銷價</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRule.ruleType === 'QUANTITY' && (
                  <div>
                    <Label>最低數量</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newRule.minQuantity}
                      onChange={(e) =>
                        setNewRule((prev) => ({
                          ...prev,
                          minQuantity: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                )}

                {newRule.ruleType === 'MEMBER_LEVEL' && (
                  <div>
                    <Label>會員等級</Label>
                    <Select
                      value={newRule.memberLevelId}
                      onValueChange={(v) => setNewRule((prev) => ({ ...prev, memberLevelId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇會員等級" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>價格</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newRule.price}
                    onChange={(e) =>
                      setNewRule((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div>
                  <Label>開始日期</Label>
                  <Input
                    type="date"
                    value={newRule.startDate}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>結束日期</Label>
                  <Input
                    type="date"
                    value={newRule.endDate}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdd}>確認新增</Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
