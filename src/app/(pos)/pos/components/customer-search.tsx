'use client'

import { useState } from 'react'
import { User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePOSStore } from '@/stores/pos-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CustomerSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<
    Array<{ id: string; code: string; name: string; phone: string | null }>
  >([])
  const { customerId, customerName, setCustomer } = usePOSStore()

  const handleSearch = async () => {
    if (!query.trim()) return

    try {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch {
      // 搜尋失敗不處理
    }
  }

  const handleSelect = (customer: { id: string; name: string }) => {
    setCustomer(customer.id, customer.name)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const handleClear = () => {
    setCustomer(null, null)
  }

  if (customerId) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-1.5">
        <User className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{customerName}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleClear}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          選擇會員
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>搜尋會員</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="輸入會員姓名、電話或編號..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>搜尋</Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto divide-y">
            {results.map((customer) => (
              <button
                key={customer.id}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                onClick={() => handleSelect(customer)}
              >
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.code}
                  {customer.phone && ` | ${customer.phone}`}
                </p>
              </button>
            ))}
            {results.length === 0 && query && (
              <p className="text-center py-4 text-muted-foreground">沒有找到會員</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
