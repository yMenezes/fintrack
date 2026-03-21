import { createClient } from '@/lib/supabase/server'
import { CardList } from '@/components/cards/CardList'

export default async function CartoesPage() {
  const supabase = await createClient()
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Cartões</h1>
      <CardList cards={cards ?? []} />
    </div>
  )
}