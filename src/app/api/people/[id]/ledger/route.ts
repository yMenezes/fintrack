import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type LedgerItem = {
  id: string
  transactionId: string
  description: string
  amount: number
  cardName: string | null
  number: number
  installmentsCount: number
  referenceMonth: number
  referenceYear: number
  overdue: boolean
  reimbursedAt: string | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') === 'done' ? 'done' : 'pending'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit
  const reimbursed = status === 'done'

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  const selectClause = 'id, amount, number, reference_month, reference_year, reimbursed_at, transaction_id, transactions!inner( id, person_id, user_id, status, deleted_at, description, installments_count, card_id, cards ( id, name, color ) )'

  const countQuery = supabase
    .from('installments')
    .select('id, transactions!inner( person_id, user_id, status, deleted_at )', { count: 'exact', head: true })
    .eq('transactions.person_id', params.id)
    .eq('transactions.user_id', user.id)
    .eq('transactions.status', 'posted')
    .is('transactions.deleted_at', null)
    .eq('reimbursed', reimbursed)

  let dataQuery = supabase
    .from('installments')
    .select(selectClause)
    .eq('transactions.person_id', params.id)
    .eq('transactions.user_id', user.id)
    .eq('transactions.status', 'posted')
    .is('transactions.deleted_at', null)
    .eq('reimbursed', reimbursed)

  dataQuery = status === 'pending'
    ? dataQuery
        .order('reference_year', { ascending: true })
        .order('reference_month', { ascending: true })
        .order('number', { ascending: true })
    : dataQuery.order('reimbursed_at', { ascending: false })

  const { count: total } = await countQuery
  const { data, error } = await dataQuery.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items: LedgerItem[] = (data ?? []).map((inst: any) => {
    const tx = firstOrNull(inst.transactions)
    const card = firstOrNull(tx?.cards)
    return {
      id: inst.id,
      transactionId: inst.transaction_id,
      description: tx?.description ?? '',
      amount: inst.amount,
      cardName: card?.name ?? null,
      number: inst.number,
      installmentsCount: tx?.installments_count ?? 1,
      referenceMonth: inst.reference_month,
      referenceYear: inst.reference_year,
      overdue:
        inst.reference_year < currentYear ||
        (inst.reference_year === currentYear && inst.reference_month < currentMonth),
      reimbursedAt: inst.reimbursed_at,
    }
  })

  const totalCount = total ?? 0

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: (page * limit) < totalCount,
    },
  })
}
