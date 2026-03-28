/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'

type SearchParams = {
  month?:       string
  year?:        string
  card_id?:     string
  category_id?: string
  person_id?:   string
  type?:        string
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now   = new Date()
  const month = searchParams.month ?? String(now.getMonth() + 1)
  const year  = searchParams.year  ?? String(now.getFullYear())

  // Query de transações com filtros
  let query = supabase
    .from('transactions')
    .select(`
      id,
      description,
      total_amount,
      installments_count,
      purchase_date,
      type,
      notes,
      cards       ( id, name, color ),
      categories  ( id, name, icon, color ),
      people      ( id, name )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('purchase_date', { ascending: false })

  if (searchParams.card_id)     query = query.eq('card_id',     searchParams.card_id)
  if (searchParams.category_id) query = query.eq('category_id', searchParams.category_id)
  if (searchParams.person_id)   query = query.eq('person_id',   searchParams.person_id)
  if (searchParams.type)        query = query.eq('type',        searchParams.type)

  const from = `${year}-${month.padStart(2, '0')}-01`
  const to   = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
  query = query.gte('purchase_date', from).lte('purchase_date', to)

  // Busca paralela
  const [{ data: transactions }, cardsRes, catsRes, peopleRes] = await Promise.all([
    query,
    supabase.from('cards').select('id, name').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('categories').select('id, name, icon').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('people').select('id, name').is('deleted_at', null).eq('user_id', user.id),
  ])

  return (
    <TransactionDataProvider 
      cards={cardsRes.data ?? []}
      categories={catsRes.data ?? []}
      people={peopleRes.data ?? []}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 text-lg font-medium">Lançamentos</h1>
        <TransactionFilters
          cards={cardsRes.data ?? []}
          categories={catsRes.data ?? []}
          people={peopleRes.data ?? []}
        />
        <TransactionList transactions={(transactions ?? []) as any} />
      </div>
    </TransactionDataProvider>
  )
}