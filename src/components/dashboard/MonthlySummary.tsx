import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

type SummaryData = {
  expenses: number
  recurring: number
  scheduled: number
}

async function getMonthlySummaryData(): Promise<SummaryData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()

  const [expensesResult, recurringResult, scheduledResult] = await Promise.all([
    supabase
      .from('installments')
      .select('amount, transactions!inner(status)')
      .eq('transactions.status', 'posted')
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear),

    supabase
      .from('recurring_transactions')
      .select('total_amount')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null),

    supabase
      .from('transactions')
      .select('total_amount')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_for', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lte('scheduled_for', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDayOfMonth}`),
  ])

  const expenses = (expensesResult.data ?? []).reduce((sum, item) => sum + item.amount, 0)
  const recurring = (recurringResult.data ?? []).reduce((sum, item: any) => sum + item.total_amount, 0)
  const scheduled = (scheduledResult.data ?? []).reduce((sum, item: any) => sum + item.total_amount, 0)

  return { expenses, recurring, scheduled }
}

export async function MonthlySummary() {
  const { expenses, recurring, scheduled } = await getMonthlySummaryData()

  const items = [
    { label: 'Saídas', value: expenses, color: '#ef4444' },
    { label: 'Contas recorrentes', value: recurring, color: '#f97316' },
    { label: 'Programados', value: scheduled, color: '#3b82f6' },
  ]

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold mb-5">Resumo do mês</h3>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MonthlySummarySkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="h-6 w-36 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
