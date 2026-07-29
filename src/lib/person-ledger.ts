import { createClient } from '@/lib/supabase/server'

export type PersonDebtSummary = {
  totalOwed: number
  overdueTotal: number
  thisMonthTotal: number
}

export async function getPersonDebtSummary(personId: string): Promise<PersonDebtSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data } = await supabase
    .from('installments')
    .select('amount, reference_month, reference_year, transactions!inner(person_id, user_id, status, deleted_at)')
    .eq('transactions.person_id', personId)
    .eq('transactions.user_id', user.id)
    .eq('transactions.status', 'posted')
    .is('transactions.deleted_at', null)
    .eq('reimbursed', false)

  const pending = data ?? []

  const totalOwed = pending.reduce((sum, item: any) => sum + item.amount, 0)

  const overdueTotal = pending
    .filter((item: any) =>
      item.reference_year < currentYear ||
      (item.reference_year === currentYear && item.reference_month < currentMonth)
    )
    .reduce((sum, item: any) => sum + item.amount, 0)

  const thisMonthTotal = pending
    .filter((item: any) => item.reference_year === currentYear && item.reference_month === currentMonth)
    .reduce((sum, item: any) => sum + item.amount, 0)

  return { totalOwed, overdueTotal, thisMonthTotal }
}
