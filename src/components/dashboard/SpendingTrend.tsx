'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

export type TrendData = {
  week: string
  total: number
}

interface SpendingTrendProps {
  data: TrendData[]
}

export function SpendingTrend({ data }: SpendingTrendProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  const avgTotal = data.reduce((sum, item) => sum + item.total, 0) / data.length
  const maxTotal = Math.max(...data.map(item => item.total))

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Tendência de gastos</h3>
          <p className="text-sm text-muted-foreground mt-1">Últimas semanas · Máximo: {formatCurrency(maxTotal)}</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="week" 
            stroke="var(--muted-foreground)"
            style={{ fontSize: '12px' }}
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
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: 'var(--foreground)',
              padding: '8px 12px'
            }}
            cursor={{ stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.3 }}
            labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', fontSize: '14px' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTotal)"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Gastos"
            animationDuration={600}
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
        </AreaChart>
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

export function SpendingTrendSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 shadow-sm">
      <div className="h-7 w-48 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-64 bg-muted rounded animate-pulse mb-6" />
      <div className="h-80 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}
