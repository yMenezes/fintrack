import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { NewRecurringButton } from './NewRecurringButton'

type RecurringItem = {
  id: string
  description: string
  total_amount: number
  day_of_month: number
  category_color: string | null
  category_icon: string | null
}

export async function UpcomingRecurring() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const [recurringRes, cardsRes, catsRes, peopleRes] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('id, description, total_amount, day_of_month, categories(color, icon)')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null)
      .order('day_of_month', { ascending: true })
      .limit(5),
    supabase.from('cards').select('id, name').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('categories').select('id, name, icon').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('people').select('id, name').is('deleted_at', null).eq('user_id', user.id),
  ])

  const items: RecurringItem[] = (recurringRes.data ?? []).map((item: any) => ({
    id: item.id,
    description: item.description,
    total_amount: item.total_amount,
    day_of_month: item.day_of_month,
    category_color: item.categories?.color ?? null,
    category_icon: item.categories?.icon ?? null,
  }))

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Próximas contas recorrentes</h3>
        {items.length > 0 && (
          <Link href="/recurring" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground flex-1 flex items-center">
          Nenhuma conta recorrente cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Day badge */}
              <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-200/50 dark:border-blue-800/50">
                <span className="text-base font-bold leading-none text-blue-600 dark:text-blue-400">{item.day_of_month}</span>
                <span className="text-[10px] leading-none text-blue-600/60 dark:text-blue-400/60">dia</span>
              </div>
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.description}</p>
                {item.category_icon && (
                  <p className="text-xs text-muted-foreground">{item.category_icon}</p>
                )}
              </div>
              {/* Amount */}
              <span className="text-sm font-semibold tabular-nums flex-shrink-0">
                {formatCurrency(item.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <NewRecurringButton
        cards={cardsRes.data ?? []}
        categories={catsRes.data ?? []}
        people={peopleRes.data ?? []}
      />
    </div>
  )
}

export function UpcomingRecurringSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm h-full flex flex-col">
      <div className="h-6 w-52 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="flex flex-col gap-4 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-10 bg-muted rounded-xl animate-pulse" />
    </div>
  )
}
