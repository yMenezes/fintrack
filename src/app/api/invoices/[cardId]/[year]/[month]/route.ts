import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type {
  Card,
  Category,
  Transaction,
  Installment,
} from '@/types/database'

type Params = { cardId: string; year: string; month: string }

// Tipos compostos para a resposta com relacionamentos
type TransactionWithRelations = Transaction & {
  cards: Card[] | null
  categories: Category[] | null
}

type InstallmentWithRelations = Installment & {
  transactions: TransactionWithRelations[] | null
}

type InstallmentForPatch = {
  id: string
  transactions: Array<{
    card_id: string | null
    user_id: string
  }>
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { cardId, year, month } = params
  const isAll = cardId === 'all'

  // Paginação
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  // Busca total de parcelas
  let countQuery = supabase
    .from('installments')
    .select('id', { count: 'exact', head: true })
    .eq('transactions.status', 'posted')
    .eq('reference_month', Number(month))
    .eq('reference_year',  Number(year))

  if (!isAll) {
    countQuery = countQuery.eq('transactions.card_id', cardId)
  }

  const { count: total } = await countQuery

  // Busca parcelas do mês com dados da transação
  let query = supabase
    .from('installments')
    .select(`
      id,
      number,
      amount,
      paid,
      reference_month,
      reference_year,
      transactions (
        id,
        description,
        installments_count,
        purchase_date,
        type,
        card_id,
        cards     ( id, name, color, closing_day, due_day ),
        categories ( id, name, icon, color )
      )
    `)
    .eq('transactions.status', 'posted')
    .eq('reference_month', Number(month))
    .eq('reference_year',  Number(year))
    .order('created_at', { ascending: true })

  // Filtra por cartão se não for "all"
  if (!isAll) {
    query = query.eq('transactions.card_id', cardId)
  }

  const { data, error } = await query.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtra resultados onde a transação pertence ao usuário e tem cartão válido
  const filtered = (data as InstallmentWithRelations[] ?? []).filter((i) => {
    if (isAll) return true
    const tx = i.transactions?.[0]
    return tx?.cards && tx.cards.length > 0
  })

  const totalCount = total ?? 0
  const hasMore = (page * limit) < totalCount

  return NextResponse.json({
    data: filtered,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore,
    },
  })
}

// Marcar todas as parcelas do mês/cartão como pagas ou não pagas
export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { cardId, year, month } = params
  const { paid } = await request.json()

  // Busca os IDs das parcelas do mês/cartão
  const { data: installments } = await supabase
    .from('installments')
    .select('id, transactions!inner( card_id, user_id )')
    .eq('reference_month', Number(month))
    .eq('reference_year',  Number(year))
    .eq('transactions.user_id', user.id)

  if (!installments?.length) return NextResponse.json({ updated: 0 })

  const ids = (installments as InstallmentForPatch[])
    .filter((i) => {
      const tx = i.transactions[0]
      return cardId === 'all' || tx?.card_id === cardId
    })
    .map((i) => i.id)

  const { error } = await supabase
    .from('installments')
    .update({ paid })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: ids.length })
}