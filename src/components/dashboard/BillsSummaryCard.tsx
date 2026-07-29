import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getBillsSummary } from './queries'

export async function BillsSummaryCard({ month, year }: { month?: string; year?: string }) {
  const baseDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : undefined
  const { toPay, paid, toReceive, received, overdueToPay } = await getBillsSummary(baseDate)

  const items = [
    { label: 'A pagar', value: toPay, color: '#ef4444' },
    { label: 'Já pago', value: paid, color: '#f97316' },
    { label: 'A receber', value: toReceive, color: '#3b82f6' },
    { label: 'Já recebido', value: received, color: '#10b981' },
  ]

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Contas</h3>
        {overdueToPay > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {formatCurrency(overdueToPay)} vencido
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>

      <Link
        href="/contas"
        className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Ver contas →
      </Link>
    </div>
  )
}

export function BillsSummaryCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="h-6 w-24 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-4 w-20 mx-auto bg-muted rounded animate-pulse" />
    </div>
  )
}
