'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartWrapper } from './chart-wrapper'

interface BarChartProps {
  title: string
  description?: string
  data: Record<string, unknown>[]
  xKey: string
  bars: {
    key: string
    name: string
    color: string
  }[]
  height?: number
  layout?: 'horizontal' | 'vertical'
}

export function BarChartComponent({
  title,
  description,
  data,
  xKey,
  bars,
  height = 300,
  layout = 'horizontal',
}: BarChartProps) {
  return (
    <ChartWrapper title={title} description={description}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey={xKey} fontSize={12} />
              <YAxis fontSize={12} />
            </>
          ) : (
            <>
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey={xKey} type="category" fontSize={12} width={100} />
            </>
          )}
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
