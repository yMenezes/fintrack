'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type Props = {
  tab: string
}

export function RecurringTabs({ tab }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(newTab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newTab === 'expenses') params.delete('tab')
    else params.set('tab', newTab)
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex gap-1 mb-5 border-b border-border">
      <Link
        href={buildHref('expenses')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          tab !== 'income'
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Contas recorrentes
      </Link>
      <Link
        href={buildHref('income')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          tab === 'income'
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Receitas recorrentes
      </Link>
    </div>
  )
}
