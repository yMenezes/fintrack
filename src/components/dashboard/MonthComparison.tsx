'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export type ComparisonData = {
  name: string
  thisMonth: number
  lastMonth: number
}

interface MonthComparisonProps {
  data: ComparisonData[]
}

export function MonthComparison({ data }: MonthComparisonProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const thisMonthTotal = data.reduce((sum, item) => sum + item.thisMonth, 0)
  const lastMonthTotal = data.reduce((sum, item) => sum + item.lastMonth, 0)
  const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Comparação mensal</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {change > 0 ? '📈' : change < 0 ? '📉' : '➡️'} 
            {' '}
            {change > 0 ? '+' : ''}{change.toFixed(1)}% vs mês anterior
          </p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="name" 
            stroke="var(--muted-foreground)"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            stroke="var(--muted-foreground)"
            style={{ fontSize: '12px' }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
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
            formatter={(value, entry: any) => (
              <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: '500' }}>
                {value}
              </span>
            )}
          />
          <Bar dataKey="thisMonth" fill="#3b82f6" name="Este mês" animationDuration={600} />
          <Bar dataKey="lastMonth" fill="#10b981" name="Mês passado" animationDuration={600} />
        </BarChart>
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

export function MonthComparisonSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 shadow-sm">
      <div className="h-7 w-48 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-64 bg-muted rounded animate-pulse mb-6" />
      <div className="h-80 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}
