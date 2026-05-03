'use client'

import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export type CategoryData = {
  name: string
  value: number
  color: string
}

interface CategoryBreakdownProps {
  data: CategoryData[]
}

const EMPTY_DATA = [{ name: '', value: 1, color: 'hsl(var(--muted))' }]

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const hasData = data && data.length > 0
  const chartData = hasData ? data : EMPTY_DATA
  const total = hasData ? data.reduce((sum, item) => sum + item.value, 0) : 0
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all h-full">
      <h3 className="text-lg font-semibold mb-6">Distribuição por categoria</h3>

      <div className="flex items-center gap-6">
        {/* Donut chart with center label */}
        <div className="relative flex-shrink-0 w-[220px] h-[220px]">
          <PieChart width={220} height={220}>
            <Pie
              data={chartData}
              cx={110}
              cy={110}
              innerRadius={68}
              outerRadius={105}
              dataKey="value"
              strokeWidth={hasData ? 2 : 0}
              stroke="hsl(var(--card))"
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* {hasData && (
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '13px',
                }}
              />
            )} */}
          </PieChart>
          {/* Center overlay text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
            <span className="text-xs text-muted-foreground capitalize">{monthLabel}</span>
            <span className="text-base font-bold leading-tight">{formatCurrency(total)}</span>
            <span className="text-xs text-muted-foreground">Saldo do mês</span>
          </div>
        </div>

        {/* Legend */}
        {hasData ? (
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <span className="text-sm font-semibold flex-shrink-0 tabular-nums">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação encontrada no período selecionado.
          </p>
        )}
      </div>
    </div>
  )
}

export function CategoryBreakdownSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm h-full">
      <div className="h-6 w-48 bg-muted rounded-lg animate-pulse mb-6" />
      <div className="flex items-center gap-6">
        <div className="w-[220px] h-[220px] rounded-full bg-muted animate-pulse flex-shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
