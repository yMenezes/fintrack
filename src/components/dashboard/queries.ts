import { createClient } from '@/lib/supabase/server'
import { CategoryData } from './CategoryBreakdown'
import { TrendData } from './SpendingTrend'
import { ComparisonData } from './MonthComparison'

export type CashFlowSummary = {
  income: number
  expenses: number
  expensesPaid: number
  recurringTotal: number
  scheduledTotal: number
  recurringIncomeTotal: number
}

export type CashFlowHistory = {
  month: string
  year: number
  income: number
  expenses: number
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthBounds(baseDate: Date = new Date()) {
  const monthStart = toLocalDateString(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1))
  const monthEnd = toLocalDateString(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0))
  return { monthStart, monthEnd }
}

export async function getCashFlowSummary(baseDate?: Date | string): Promise<CashFlowSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = baseDate ? (baseDate instanceof Date ? baseDate : new Date(baseDate)) : new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { monthStart, monthEnd } = getMonthBounds(now)

  // Income for current month
  const { data: incomeData } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .is('deleted_at', null)

  const income = (incomeData ?? []).reduce((sum, item) => sum + item.amount, 0)

  // Total expenses (all posted installments this month)
  const { data: expensesData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, user_id)')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const expenses = (expensesData ?? []).reduce((sum, item) => sum + item.amount, 0)

  // Paid expenses only (installments where paid=true)
  const { data: expensesPaidData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, user_id)')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .eq('paid', true)
    .eq('reference_month', currentMonth)
    .eq('reference_year', currentYear)

  const expensesPaid = (expensesPaidData ?? []).reduce((sum, item) => sum + item.amount, 0)

  // Recurring transactions active for this month
  const { data: recurringData } = await supabase
    .from('recurring_transactions')
    .select('total_amount, day_of_month, start_date, end_date')
    .eq('user_id', user.id)
    .eq('active', true)
    .is('deleted_at', null)
    .lte('start_date', monthEnd)
    .or(`end_date.is.null,end_date.gte.${monthStart}`)

  let recurringTotal = 0
  recurringData?.forEach((recurring: any) => {
    const dayOfMonth = recurring.day_of_month
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      recurringTotal += recurring.total_amount
    }
  })

  // Scheduled transactions for this month
  const { data: scheduledData } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_for', monthStart)
    .lte('scheduled_for', monthEnd)
    .is('deleted_at', null)

  const scheduledTotal = (scheduledData ?? []).reduce((sum, item) => sum + item.total_amount, 0)

  // Recurring income active for this month
  const { data: recurringIncomeData } = await supabase
    .from('recurring_income')
    .select('amount, day_of_month, start_date, end_date')
    .eq('user_id', user.id)
    .eq('active', true)
    .is('deleted_at', null)
    .lte('start_date', monthEnd)
    .or(`end_date.is.null,end_date.gte.${monthStart}`)

  let recurringIncomeTotal = 0
  recurringIncomeData?.forEach((recurringIncome: any) => {
    const dayOfMonth = recurringIncome.day_of_month
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      recurringIncomeTotal += recurringIncome.amount
    }
  })

  return {
    income,
    expenses,
    expensesPaid,
    recurringTotal,
    scheduledTotal,
    recurringIncomeTotal,
  }
}

export type BillsSummary = {
  toPay: number
  paid: number
  toReceive: number
  received: number
  overdueToPay: number
  overdueToReceive: number
}

export async function getBillsSummary(baseDate?: Date | string): Promise<BillsSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = baseDate ? (baseDate instanceof Date ? baseDate : new Date(baseDate)) : new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { monthStart, monthEnd } = getMonthBounds(now)
  const today = toLocalDateString(new Date())

  const [scheduledExpensesRes, unpaidInstallmentsRes, paidInstallmentsRes, scheduledIncomeRes, receivedIncomeRes] = await Promise.all([
    // Scheduled, single-installment expenses due this month or earlier
    supabase
      .from('transactions')
      .select('total_amount, scheduled_for')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .eq('installments_count', 1)
      .lte('scheduled_for', monthEnd)
      .is('deleted_at', null),

    // Posted, unpaid, single-installment installments (any outstanding invoice month)
    supabase
      .from('installments')
      .select('amount, reference_month, reference_year, transactions!inner(status, user_id, installments_count)')
      .eq('transactions.status', 'posted')
      .eq('transactions.user_id', user.id)
      .eq('transactions.installments_count', 1)
      .eq('paid', false),

    // Paid this month (mirrors expensesPaid, restricted to single-installment bills)
    supabase
      .from('installments')
      .select('amount, transactions!inner(status, user_id, installments_count)')
      .eq('transactions.status', 'posted')
      .eq('transactions.user_id', user.id)
      .eq('transactions.installments_count', 1)
      .eq('paid', true)
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear),

    // Scheduled income due this month or earlier
    supabase
      .from('income')
      .select('amount, scheduled_for')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .lte('scheduled_for', monthEnd)
      .is('deleted_at', null),

    // Received this month
    supabase
      .from('income')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'received')
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .is('deleted_at', null),
  ])

  const scheduledExpenses = scheduledExpensesRes.data ?? []
  const scheduledIncome = scheduledIncomeRes.data ?? []

  // Only invoice months up to the current one count as "outstanding" (future installments aren't due yet)
  const outstandingInstallments = (unpaidInstallmentsRes.data ?? []).filter((item: any) =>
    item.reference_year < currentYear ||
    (item.reference_year === currentYear && item.reference_month <= currentMonth)
  )
  const overdueInstallments = outstandingInstallments.filter((item: any) =>
    item.reference_year < currentYear ||
    (item.reference_year === currentYear && item.reference_month < currentMonth)
  )

  const toPay = scheduledExpenses.reduce((sum, item: any) => sum + item.total_amount, 0)
    + outstandingInstallments.reduce((sum, item: any) => sum + item.amount, 0)

  const paid = (paidInstallmentsRes.data ?? []).reduce((sum, item: any) => sum + item.amount, 0)

  const toReceive = scheduledIncome.reduce((sum, item: any) => sum + item.amount, 0)

  const received = (receivedIncomeRes.data ?? []).reduce((sum, item: any) => sum + item.amount, 0)

  const overdueToPay = scheduledExpenses
    .filter((item: any) => item.scheduled_for < today)
    .reduce((sum, item: any) => sum + item.total_amount, 0)
    + overdueInstallments.reduce((sum, item: any) => sum + item.amount, 0)

  const overdueToReceive = scheduledIncome
    .filter((item: any) => item.scheduled_for < today)
    .reduce((sum, item: any) => sum + item.amount, 0)

  return { toPay, paid, toReceive, received, overdueToPay, overdueToReceive }
}

export async function getCashFlowHistory(baseDate?: Date | string): Promise<CashFlowHistory[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not found')

  const now = baseDate ? (baseDate instanceof Date ? baseDate : new Date(baseDate)) : new Date()
  const months: CashFlowHistory[] = []

  // Calculate date range for last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const monthStart = toLocalDateString(sixMonthsAgo)
  const monthEnd = getMonthBounds(now).monthEnd

  // Query 1: Get ALL income for last 6 months (single query)
  const { data: incomeData } = await supabase
    .from('income')
    .select('amount, date')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .is('deleted_at', null)

  // Query 2: Get ALL expenses for last 6 months (single query)
  const { data: expensesData } = await supabase
    .from('installments')
    .select('amount, reference_month, reference_year, transactions!inner(status, user_id)')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .gte('reference_year', sixMonthsAgo.getFullYear())
    .lte('reference_year', now.getFullYear())

  // Aggregate income by month in JavaScript
  const incomeByMonth: Record<string, number> = {}
  incomeData?.forEach((item: any) => {
    const date = new Date(item.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    incomeByMonth[key] = (incomeByMonth[key] ?? 0) + item.amount
  })

  // Aggregate expenses by month in JavaScript
  const expensesByMonth: Record<string, number> = {}
  expensesData?.forEach((item: any) => {
    const key = `${item.reference_year}-${String(item.reference_month).padStart(2, '0')}`
    expensesByMonth[key] = (expensesByMonth[key] ?? 0) + item.amount
  })

  // Build result for last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const key = `${year}-${String(month).padStart(2, '0')}`

    const monthName = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })
    months.push({
      month: monthName,
      year,
      income: incomeByMonth[key] ?? 0,
      expenses: expensesByMonth[key] ?? 0,
    })
  }

  return months
}

export async function getCategoryBreakdownData(baseDate?: Date | string): Promise<CategoryData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const now = baseDate ? (baseDate instanceof Date ? baseDate : new Date(baseDate)) : new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Get all installments this month with category info and color
  const { data: thisMonthData } = await supabase
    .from('installments')
    .select('amount, transactions!inner(status, user_id, categories!inner(name, color))')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
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
    .select('amount, reference_month, reference_year, transactions!inner(status, user_id)')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)

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
    .select('amount, transactions!inner(status, user_id, categories!inner(name))')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
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
    .select('amount, transactions!inner(status, user_id, categories!inner(name))')
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
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
