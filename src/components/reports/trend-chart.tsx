'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartWrapper } from './chart-wrapper'

interface TrendChartProps {
  title: string
  description?: string
  data: Record<string, unknown>[]
  xKey: string
  lines: {
    key: string
    name: string
    color: string
  }[]
  height?: number
}

export function TrendChart({
  title,
  description,
  data,
  xKey,
  lines,
  height = 300,
}: TrendChartProps) {
  return (
    <ChartWrapper title={title} description={description}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
            labelFormatter={(label) => `${label}`}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
