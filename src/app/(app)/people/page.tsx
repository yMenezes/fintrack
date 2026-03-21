import { createClient } from '@/lib/supabase/server'
import { PeopleList } from '@/components/people/PeopleList'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: people } = await supabase
    .from('people')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Pessoas</h1>
      <PeopleList people={people ?? []} />
    </div>
  )
}