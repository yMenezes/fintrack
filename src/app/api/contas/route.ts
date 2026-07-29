import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type CategoryRef = { id: string; name: string; icon: string; color: string } | null
type PersonRef = { id: string; name: string } | null

type ContaItem = {
  id: string
  kind: 'expense' | 'income'
  description: string
  amount: number
  dueDate: string | null
  completedAt: string | null
  overdue: boolean
  transactionId?: string
  category: CategoryRef
  person: PersonRef
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') === 'done' ? 'done' : 'pending'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20')))

  const today = new Date().toISOString().split('T')[0]
  let items: ContaItem[] = []

  if (status === 'pending') {
    const [scheduledExpenses, unpaidInstallments, scheduledIncome] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, description, total_amount, scheduled_for, purchase_date, category_id, person_id, categories ( id, name, icon, color ), people ( id, name )')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .eq('installments_count', 1)
        .is('deleted_at', null)
        .limit(100),

      supabase
        .from('installments')
        .select('id, amount, transaction_id, transactions!inner( id, status, user_id, installments_count, description, scheduled_for, purchase_date, category_id, person_id, categories ( id, name, icon, color ), people ( id, name ) )')
        .eq('transactions.status', 'posted')
        .eq('transactions.user_id', user.id)
        .eq('transactions.installments_count', 1)
        .eq('paid', false)
        .limit(100),

      supabase
        .from('income')
        .select('id, description, amount, scheduled_for, category_id, person_id, categories ( id, name, icon, color ), people ( id, name )')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .is('deleted_at', null)
        .limit(100),
    ])

    const expenseFromScheduled: ContaItem[] = (scheduledExpenses.data ?? []).map((tx: any) => ({
      id: tx.id,
      kind: 'expense',
      description: tx.description,
      amount: tx.total_amount,
      dueDate: tx.scheduled_for ?? tx.purchase_date,
      completedAt: null,
      overdue: (tx.scheduled_for ?? tx.purchase_date) < today,
      transactionId: tx.id,
      category: firstOrNull(tx.categories),
      person: firstOrNull(tx.people),
    }))

    const expenseFromUnpaid: ContaItem[] = (unpaidInstallments.data ?? []).map((inst: any) => {
      const tx = firstOrNull(inst.transactions)
      const dueDate = tx?.scheduled_for ?? tx?.purchase_date ?? today
      return {
        id: inst.id,
        kind: 'expense',
        description: tx?.description ?? '',
        amount: inst.amount,
        dueDate,
        completedAt: null,
        overdue: dueDate < today,
        transactionId: inst.transaction_id,
        category: firstOrNull(tx?.categories),
        person: firstOrNull(tx?.people),
      }
    })

    const incomeFromScheduled: ContaItem[] = (scheduledIncome.data ?? []).map((inc: any) => ({
      id: inc.id,
      kind: 'income',
      description: inc.description,
      amount: inc.amount,
      dueDate: inc.scheduled_for,
      completedAt: null,
      overdue: inc.scheduled_for < today,
      category: firstOrNull(inc.categories),
      person: firstOrNull(inc.people),
    }))

    items = [...expenseFromScheduled, ...expenseFromUnpaid, ...incomeFromScheduled]
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  } else {
    const [paidInstallments, receivedIncome] = await Promise.all([
      supabase
        .from('installments')
        .select('id, amount, paid_at, transaction_id, transactions!inner( id, status, user_id, installments_count, description, category_id, person_id, categories ( id, name, icon, color ), people ( id, name ) )')
        .eq('transactions.status', 'posted')
        .eq('transactions.user_id', user.id)
        .eq('transactions.installments_count', 1)
        .eq('paid', true)
        .order('paid_at', { ascending: false })
        .limit(100),

      supabase
        .from('income')
        .select('id, description, amount, received_at, category_id, person_id, categories ( id, name, icon, color ), people ( id, name )')
        .eq('user_id', user.id)
        .eq('status', 'received')
        .is('deleted_at', null)
        .order('received_at', { ascending: false })
        .limit(100),
    ])

    const expenseDone: ContaItem[] = (paidInstallments.data ?? []).map((inst: any) => {
      const tx = firstOrNull(inst.transactions)
      return {
        id: inst.id,
        kind: 'expense',
        description: tx?.description ?? '',
        amount: inst.amount,
        dueDate: null,
        completedAt: inst.paid_at,
        overdue: false,
        transactionId: inst.transaction_id,
        category: firstOrNull(tx?.categories),
        person: firstOrNull(tx?.people),
      }
    })

    const incomeDone: ContaItem[] = (receivedIncome.data ?? []).map((inc: any) => ({
      id: inc.id,
      kind: 'income',
      description: inc.description,
      amount: inc.amount,
      dueDate: null,
      completedAt: inc.received_at,
      overdue: false,
      category: firstOrNull(inc.categories),
      person: firstOrNull(inc.people),
    }))

    items = [...expenseDone, ...incomeDone]
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  }

  const total = items.length
  const offset = (page - 1) * limit
  const pageItems = items.slice(offset, offset + limit)

  return NextResponse.json({
    data: pageItems,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  })
}
