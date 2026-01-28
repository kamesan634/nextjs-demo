'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartWrapper } from './chart-wrapper'

interface PieChartProps {
  title: string
  description?: string
  data: { name: string; value: number }[]
  colors?: string[]
  height?: number
}

const DEFAULT_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B6B',
]

export function PieChartComponent({
  title,
  description,
  data,
  colors = DEFAULT_COLORS,
  height = 300,
}: PieChartProps) {
  return (
    <ChartWrapper title={title} description={description}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
