import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPersonDebtSummary } from '@/lib/person-ledger'
import { formatCurrency } from '@/lib/utils'
import { PersonLedgerTabs } from '@/components/people/PersonLedgerTabs'
import { PersonLedgerList } from '@/components/people/PersonLedgerList'

type SearchParams = {
  status?: string
}

export default async function PersonLedgerPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: person } = await supabase
    .from('people')
    .select('id, name, relationship')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!person) notFound()

  const summary = await getPersonDebtSummary(params.id)
  const status = searchParams.status === 'done' ? 'done' : 'pending'

  const tiles = [
    {
      label: 'Total devido',
      value: summary.totalOwed,
      bgClass: 'from-rose-500/10 to-rose-500/5 border-rose-200/50 dark:border-rose-800/50',
      textClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Vencido',
      value: summary.overdueTotal,
      bgClass: 'from-red-500/10 to-red-500/5 border-red-200/50 dark:border-red-800/50',
      textClass: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Deste mês',
      value: summary.thisMonthTotal,
      bgClass: 'from-blue-500/10 to-blue-500/5 border-blue-200/50 dark:border-blue-800/50',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/people" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Pessoas
      </Link>

      <h1 className="mb-1 text-lg font-medium">{person.name}</h1>
      {person.relationship && (
        <p className="mb-6 text-sm text-muted-foreground">{person.relationship}</p>
      )}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`bg-gradient-to-br rounded-xl border p-4 ${tile.bgClass}`}
          >
            <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
            <p className={`text-xl font-bold mt-2 ${tile.textClass}`}>
              {formatCurrency(tile.value)}
            </p>
          </div>
        ))}
      </div>

      <PersonLedgerTabs status={status} />
      <PersonLedgerList personId={person.id} status={status} />
    </div>
  )
}
