import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

type TopCategory = {
  name: string
  total: number
  percentage: number
}

async function getTopCategories(): Promise<TopCategory[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get all installments this month with category info
  const { data: thisMonthData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(categories!inner(name))')
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const categoryTotals: Record<string, number> = {}
  thisMonthData?.forEach((item: any) => {
    const categoryName = item.transactions?.categories?.name ?? 'Uncategorized'
    categoryTotals[categoryName] = (categoryTotals[categoryName] ?? 0) + item.amount
  })

  const totalSpent = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  return Object.entries(categoryTotals)
    .map(([name, total]) => ({
      name,
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

export async function TopCategories() {
  const categories = await getTopCategories()

  if (categories.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-xl font-semibold mb-4">Top categorias este mês</h3>
        <p className="text-muted-foreground text-center py-8">Nenhum gasto registrado este mês</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
      <h3 className="text-xl font-semibold mb-6">Top 10 categorias este mês</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/70">
            <tr>
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Categoria</th>
              <th className="text-right py-4 px-4 font-semibold text-muted-foreground">Total</th>
              <th className="text-right py-4 px-4 font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4 font-medium">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{getEmojiForIndex(index)}</span>
                    {category.name}
                  </span>
                </td>
                <td className="text-right py-4 px-4 font-semibold text-foreground">
                  {formatCurrency(category.total)}
                </td>
                <td className="text-right py-4 px-4">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {category.percentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getEmojiForIndex(index: number): string {
  const emojis = ['🥇', '🥈', '🥉', '💵', '🛍️', '🛒', '🎉', '🍔', '🛏️', '🎱']
  return emojis[index % emojis.length]
}

export function TopCategoriesSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm">
      <div className="h-7 w-40 bg-muted rounded-lg animate-pulse mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-5 w-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-5 w-28 bg-muted rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
