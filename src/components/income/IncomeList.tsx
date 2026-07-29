'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { IncomeFormDialog } from '@/components/income/IncomeFormDialog'
import { INCOME_SOURCE_LABELS, type IncomeSource, type IncomeStatus } from '@/types/database'

type IncomeItem = {
  id: string
  description: string
  amount: number
  date: string
  source: IncomeSource
  status: IncomeStatus
  scheduled_for: string | null
  notes: string | null
  category_id: string | null
  person_id: string | null
  categories: { id: string; name: string; icon: string; color: string } | null
  people: { id: string; name: string } | null
}

type Props = {
  month: string
  year: string
  categoryId?: string
  personId?: string
  source?: string
  periodType?: string
  quarter?: string
  dateFrom?: string
  dateTo?: string
  refreshTrigger?: number
  onRefreshReady?: (fn: () => void) => void
}

function groupByDate(items: IncomeItem[]) {
  const groups: Record<string, IncomeItem[]> = {}
  for (const item of items) {
    const key = item.date
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function IncomeList({ month, year, categoryId, personId, source, periodType, quarter, dateFrom, dateTo, refreshTrigger, onRefreshReady }: Props) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<IncomeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [deleteTarget, setDeleteTarget] = useState<IncomeItem | null>(null)
  const [editTarget, setEditTarget] = useState<IncomeItem | null>(null)

  const fetchIncome = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month, year, page: String(page), limit: '10' })
      if (periodType) params.append('period_type', periodType)
      if (quarter) params.append('quarter', quarter)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (categoryId) params.append('category_id', categoryId)
      if (personId)   params.append('person_id', personId)
      if (source)     params.append('source', source)

      const res = await fetch(`/api/income?${params}`)
      const result = await res.json()
      setItems(result.data ?? [])
      setPagination(result.pagination ?? { page: 1, limit: 10, total: 0, hasMore: false })
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [month, year, page, categoryId, personId, source, periodType, quarter, dateFrom, dateTo])

  useEffect(() => { fetchIncome() }, [fetchIncome, refreshTrigger])

  useEffect(() => {
    onRefreshReady?.(() => { setPage(1); fetchIncome() })
  }, [onRefreshReady, fetchIncome])

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/income/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    router.refresh()
    fetchIncome()
  }

  const total = items.reduce((acc, i) => acc + i.amount, 0)
  const groups = groupByDate(items)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Carregando entradas...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma entrada registrada neste mês</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-3 py-3 sm:px-4 sm:py-4">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Total recebido</p>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 px-3 py-3 sm:px-4 sm:py-4">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Lançamentos</p>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-400">
            {pagination.total}
          </p>
        </div>
      </div>

      {/* Lista agrupada por data */}
      {groups.map(([date, dayItems]) => (
        <div key={date} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            {formatDate(date)}
          </p>

          <div className="flex flex-col gap-1">
            {dayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                {/* Ícone de categoria ou padrão */}
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: item.categories?.color ? `${item.categories.color}22` : '#22c55e22' }}
                >
                  {item.categories ? (
                    <span>{item.categories.icon}</span>
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0 overflow-hidden">
                    <span className="text-xs px-1.5 py-0.5 rounded shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {INCOME_SOURCE_LABELS[item.source]}
                    </span>
                    {item.status === 'scheduled' && (
                      <span className="text-xs px-1.5 py-0.5 rounded shrink-0 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                        Agendado
                      </span>
                    )}
                    {(item.categories || item.people) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {[item.categories?.name, item.people?.name].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  +{formatCurrency(item.amount)}
                </p>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditTarget(item)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Paginação */}
      {(page > 1 || pagination.hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {pagination.page} · {pagination.total} total
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore || loading}
          >
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Dialog de edição */}
      <IncomeFormDialog
        open={!!editTarget}
        income={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); fetchIncome() }}
      />

      {/* Dialog de exclusão */}
      <DeleteDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        title="Excluir entrada"
        description={`Tem certeza que deseja excluir a entrada "${deleteTarget?.description}"?`}
      />
    </div>
  )
}
