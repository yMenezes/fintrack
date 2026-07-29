'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type Props = {
  status: string
}

export function ContasTabs({ status }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function buildHref(newStatus: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus === 'pending') params.delete('status')
    else params.set('status', newStatus)
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex gap-1 mb-5 border-b border-border">
      <Link
        href={buildHref('pending')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          status !== 'done'
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Pendentes
      </Link>
      <Link
        href={buildHref('done')}
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          status === 'done'
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Concluídas
      </Link>
    </div>
  )
}
