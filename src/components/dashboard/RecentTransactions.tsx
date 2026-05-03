import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type TransactionItem = {
  id: string
  description: string
  total_amount: number
  purchase_date: string
  category_icon: string | null
  category_name: string | null
}

async function getRecentTransactions(): Promise<TransactionItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const { data } = await supabase
    .from('transactions')
    .select('id, description, total_amount, purchase_date, categories(name, icon)')
    .eq('user_id', user.id)
    .eq('status', 'posted')
    .order('purchase_date', { ascending: false })
    .limit(5)

  return (data ?? []).map((item: any) => ({
    id: item.id,
    description: item.description,
    total_amount: item.total_amount,
    purchase_date: item.purchase_date,
    category_icon: item.categories?.icon ?? null,
    category_name: item.categories?.name ?? null,
  }))
}

function formatRelativeDate(dateStr: string): string {
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export async function RecentTransactions() {
  const transactions = await getRecentTransactions()

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Movimentações recentes</h3>
        <Link href="/transactions" className="text-xs text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhuma movimentação encontrada.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/40">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {/* Category icon */}
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                {tx.category_icon ?? '📦'}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.category_name ?? 'Sem categoria'} · {formatRelativeDate(tx.purchase_date)}
                </p>
              </div>
              {/* Amount */}
              <span className="text-sm font-semibold text-red-500 dark:text-red-400 flex-shrink-0 tabular-nums">
                – {formatCurrency(tx.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RecentTransactionsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
