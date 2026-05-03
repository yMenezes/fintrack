import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react'

type SummaryMetrics = {
  totalThisMonth: number
  totalLastMonth: number
  averagePerDay: number
  topCategory: string | null
  scheduledThisMonthTotal: number
  scheduledThisMonthCount: number
}

async function getDashboardSummary(): Promise<SummaryMetrics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Total this month
  const { data: thisMonthData } = await supabase
    .from('installments')
    .select('amount')
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const totalThisMonth = (thisMonthData ?? []).reduce((sum, item) => sum + item.amount, 0)

  // Total last month
  const { data: lastMonthData } = await supabase
    .from('installments')
    .select('amount')
    .eq('reference_month', lastMonth)
    .eq('reference_year', lastMonthYear)

  const totalLastMonth = (lastMonthData ?? []).reduce((sum, item) => sum + item.amount, 0)

  // Average per day this month
  const daysInMonth = now.getDate()
  const averagePerDay = totalThisMonth / daysInMonth

  // Top category this month
  const { data: topCategoryData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(category_id, categories!inner(name))')
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const categoryTotals: Record<string, number> = {}
  topCategoryData?.forEach((item: any) => {
    const categoryName = item.transactions?.categories?.name ?? 'Uncategorized'
    categoryTotals[categoryName] = (categoryTotals[categoryName] ?? 0) + item.amount
  })

  const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  // Scheduled expenses for this month
  const { data: scheduledData } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('status', 'scheduled')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('scheduled_for', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
    .lte('scheduled_for', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`)

  const scheduledThisMonthTotal = (scheduledData ?? []).reduce((sum, item) => sum + item.total_amount, 0)
  const scheduledThisMonthCount = scheduledData?.length ?? 0

  return {
    totalThisMonth,
    totalLastMonth,
    averagePerDay,
    topCategory,
    scheduledThisMonthTotal,
    scheduledThisMonthCount,
  }
}

export async function SummaryCards() {
  const { totalThisMonth, totalLastMonth, averagePerDay, topCategory, scheduledThisMonthTotal, scheduledThisMonthCount } = await getDashboardSummary()

  const trend = totalThisMonth > totalLastMonth ? 'up' : totalThisMonth < totalLastMonth ? 'down' : 'stable'
  const trendPercent = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total This Month */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-6 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Gastos este mês</p>
            <p className="text-4xl font-bold mt-3 text-blue-600 dark:text-blue-400">{formatCurrency(totalThisMonth)}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {trend === 'up' && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                  <ArrowUp className="w-4 h-4" />
                  {Math.abs(trendPercent).toFixed(1)}% vs mês passado
                </span>
              )}
              {trend === 'down' && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                  <ArrowDown className="w-4 h-4" />
                  {Math.abs(trendPercent).toFixed(1)}% vs mês passado
                </span>
              )}
              {trend === 'stable' && (
                <span className="text-muted-foreground">Mesmo que mês passado</span>
              )}
            </p>
          </div>
          <div className="opacity-10">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Average Per Day */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-200/50 dark:border-purple-800/50 p-6 hover:shadow-md transition-all">
        <p className="text-sm font-medium text-muted-foreground">Média diária</p>
        <p className="text-4xl font-bold mt-3 text-purple-600 dark:text-purple-400">{formatCurrency(averagePerDay)}</p>
        <p className="text-xs text-muted-foreground mt-3">Projeção: <span className="font-semibold text-foreground">{formatCurrency(averagePerDay * 30)}</span></p>
      </div>

      {/* Top Category */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 p-6 hover:shadow-md transition-all">
        <p className="text-sm font-medium text-muted-foreground">Categoria principal</p>
        <p className="text-2xl font-bold mt-3 truncate text-emerald-600 dark:text-emerald-400">{topCategory ?? 'N/A'}</p>
        <p className="text-xs text-muted-foreground mt-3">Este mês</p>
      </div>

      {/* Scheduled */}
      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-200/50 dark:border-amber-800/50 p-6 hover:shadow-md transition-all">
        <p className="text-sm font-medium text-muted-foreground">Gastos programados</p>
        <p className="text-3xl font-bold mt-3 text-amber-600 dark:text-amber-400">{scheduledThisMonthCount}</p>
        <p className="text-xs text-muted-foreground mt-3">
          {formatCurrency(scheduledThisMonthTotal)} previstos neste mês
        </p>
      </div>
    </div>
  )
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6">
          <div className="flex flex-col gap-4">
            <div className="h-4 w-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
