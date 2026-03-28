import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CardList } from '@/components/cards/CardList'
import { CardListSkeleton } from '@/components/cards/CardListSkeleton'

export default async function CartoesPage() {
  const supabase = await createClient()
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Cartões</h1>
      <Suspense fallback={<CardListSkeleton />}>
        <CardList cards={cards ?? []} />
      </Suspense>
    </div>
  )
}