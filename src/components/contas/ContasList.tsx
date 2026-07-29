'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddButton } from '@/components/ui/add-button'
import { useTransactionPanel } from '@/providers/TransactionPanelProvider'
import { IncomeFormDialog } from '@/components/income/IncomeFormDialog'
import { ContaRow, type ContaItem } from './ContaRow'

type PaginationResponse = {
  data: ContaItem[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

type Props = {
  status: 'pending' | 'done'
}

export function ContasList({ status }: Props) {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ContaItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const { open: openTransactionPanel, onRefresh } = useTransactionPanel()

  const fetchedKeyRef = useRef<string | null>(null)

  async function fetchContas() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contas?status=${status}&page=${page}&limit=20`)
      const data: PaginationResponse = await res.json()
      setItems(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching contas:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [status])

  useEffect(() => {
    const key = `${status}:${page}`
    if (fetchedKeyRef.current === key) return
    fetchedKeyRef.current = key
    fetchContas()
  }, [status, page])

  useEffect(() => {
    onRefresh(() => {
      setPage(1)
      fetchedKeyRef.current = null
      fetchContas()
    })
  }, [onRefresh])

  async function handleToggle(item: ContaItem) {
    if (item.kind === 'expense' && item.transactionId) {
      await fetch(`/api/transactions/${item.transactionId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: true }),
      })
    } else if (item.kind === 'income') {
      await fetch(`/api/income/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'received' }),
      })
    }
    fetchedKeyRef.current = null
    fetchContas()
  }

  const pageLabel = Math.ceil(pagination.total / pagination.limit) || 1

  return (
    <>
      <div className="flex flex-col gap-4">
        {status === 'pending' && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddButton label="Nova conta a pagar" onClick={() => openTransactionPanel()} />
            <AddButton label="Nova conta a receber" onClick={() => setIncomeDialogOpen(true)} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {status === 'pending' ? 'Nenhuma conta pendente' : 'Nenhuma conta concluída'}
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <ContaRow
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    done={status === 'done'}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1 || loading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">Página {page} de {pageLabel}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((c) => c + 1)} disabled={!pagination.hasMore || loading}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      <IncomeFormDialog
        open={incomeDialogOpen}
        onClose={() => setIncomeDialogOpen(false)}
        onSaved={() => {
          setPage(1)
          fetchedKeyRef.current = null
          fetchContas()
        }}
      />
    </>
  )
}
