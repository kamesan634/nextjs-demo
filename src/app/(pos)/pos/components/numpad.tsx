'use client'

import { Button } from '@/components/ui/button'

interface NumpadProps {
  onInput: (value: string) => void
}

export function Numpad({ onInput }: NumpadProps) {
  const buttons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '.'],
  ]

  const quickAmounts = [100, 500, 1000]

  return (
    <div className="space-y-2">
      {/* 快速金額 */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onInput('exact')}>
          剛好
        </Button>
        {quickAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            className="flex-1"
            onClick={() => onInput(amount.toString())}
          >
            ${amount}
          </Button>
        ))}
      </div>

      {/* 數字鍵盤 */}
      <div className="grid grid-cols-3 gap-2">
        {buttons.flat().map((btn) => (
          <Button
            key={btn}
            variant={btn === 'C' ? 'destructive' : 'outline'}
            className="h-12 text-lg font-medium"
            onClick={() => onInput(btn)}
          >
            {btn}
          </Button>
        ))}
      </div>
    </div>
  )
}
