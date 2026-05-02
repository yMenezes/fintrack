'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export type CategoryData = {
  name: string
  value: number
  color: string
}

interface CategoryBreakdownProps {
  data: CategoryData[]
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Gastos por categoria</h3>
          <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(total)}</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={120}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            animationDuration={600}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              color: 'var(--foreground)',
              padding: '8px 12px'
            }}
            labelStyle={{
              color: 'var(--foreground)',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
            itemStyle={{
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: '500'
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px'
            } as React.CSSProperties}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: '500' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function CategoryBreakdownSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 shadow-sm">
      <div className="h-7 w-40 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-6" />
      <div className="h-80 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}
