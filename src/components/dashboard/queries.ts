import { createClient } from '@/lib/supabase/server'
import { CategoryData } from './CategoryBreakdown'
import { TrendData } from './SpendingTrend'
import { ComparisonData } from './MonthComparison'

export async function getCategoryBreakdownData(): Promise<CategoryData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get all installments this month with category info and color
  const { data: thisMonthData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, categories!inner(name, color))')
    .eq('transactions.status', 'posted')
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const categoryTotals: Record<string, { total: number; color: string }> = {}
  
  thisMonthData?.forEach((item: any) => {
    const categoryName = item.transactions?.categories?.name ?? 'Uncategorized'
    const categoryColor = item.transactions?.categories?.color ?? '#6366f1'
    
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = { total: 0, color: categoryColor }
    }
    categoryTotals[categoryName].total += item.amount
  })

  return Object.entries(categoryTotals).map(([name, { total, color }]) => ({
    name,
    value: total,
    color
  }))
}

export async function getSpendingTrendData(): Promise<TrendData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  // Get the last 6 months of data (simpler and more realistic)
  const weeks: TrendData[] = []
  const today = new Date()

  // Fetch all transactions for last 6 months
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: allData } = await supabase
    .from('installments')
    .select('amount, reference_month, reference_year, transactions!inner(status)')
    .eq('transactions.status', 'posted')

  // Group by week
  const weekMap = new Map<string, number>()

  allData?.forEach((item: any) => {
    // Create a date from reference_month/year (use first day of month as estimate)
    const date = new Date(item.reference_year, item.reference_month - 1, 1)

    // Only include if within last 6 months
    if (date >= sixMonthsAgo && date <= today) {
      // Get week starting date (Monday)
      const dayOfWeek = date.getDay()
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(date.setDate(diff))

      const weekKey = weekStart.toISOString().split('T')[0]
      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + item.amount)
    }
  })

  // Convert to sorted array
  Array.from(weekMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(-26) // Last 26 weeks
    .forEach(([dateStr, total]) => {
      const date = new Date(dateStr)
      const label = date.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' })
      weeks.push({ week: label, total })
    })

  return weeks
}

export async function getMonthComparisonData(): Promise<ComparisonData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Get categories for current month
  const { data: thisMonthData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, categories!inner(name))')
    .eq('transactions.status', 'posted')
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const thisMonthTotals: Record<string, number> = {}
  thisMonthData?.forEach((item: any) => {
    const categoryName = item.transactions?.categories?.name ?? 'Uncategorized'
    thisMonthTotals[categoryName] = (thisMonthTotals[categoryName] ?? 0) + item.amount
  })

  // Get categories for last month
  const { data: lastMonthData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, categories!inner(name))')
    .eq('transactions.status', 'posted')
    .eq('reference_month', lastMonth)
    .eq('reference_year', lastMonthYear)

  const lastMonthTotals: Record<string, number> = {}
  lastMonthData?.forEach((item: any) => {
    const categoryName = item.transactions?.categories?.name ?? 'Uncategorized'
    lastMonthTotals[categoryName] = (lastMonthTotals[categoryName] ?? 0) + item.amount
  })

  // Get all unique categories
  const allCategories = new Set([
    ...Object.keys(thisMonthTotals),
    ...Object.keys(lastMonthTotals)
  ])

  return Array.from(allCategories)
    .map(name => ({
      name,
      thisMonth: thisMonthTotals[name] ?? 0,
      lastMonth: lastMonthTotals[name] ?? 0
    }))
    .sort((a, b) => (b.thisMonth + b.lastMonth) - (a.thisMonth + a.lastMonth))
    .slice(0, 8) // Top 8 categories
}
