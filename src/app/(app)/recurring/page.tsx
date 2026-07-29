import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'
import { RecurringList } from '@/components/recurring/RecurringList'
import { RecurringTabs } from '@/components/recurring/RecurringTabs'
import { RecurringListSkeleton } from '@/components/recurring/RecurringListSkeleton'
import { RecurringIncomeList } from '@/components/recurring-income/RecurringIncomeList'

type SearchParams = {
  tab?: string
}

async function RecurringContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tab = searchParams.tab === 'income' ? 'income' : 'expenses'

  const [cardsRes, catsRes, peopleRes] = await Promise.all([
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
        <h1 className="mb-2 text-lg font-medium">Recorrências</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Cadastre regras que geram lançamentos futuros de forma repetida.
        </p>

        <RecurringTabs tab={tab} />

        {tab === 'income' ? <RecurringIncomeList /> : <RecurringList />}
      </div>
    </TransactionDataProvider>
  )
}

export default function RecurringPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <Suspense fallback={<RecurringListSkeleton />}>
      <RecurringContent searchParams={searchParams} />
    </Suspense>
  )
}
