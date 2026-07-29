'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonLedgerRow, type LedgerItem } from './PersonLedgerRow'

type PaginationResponse = {
  data: LedgerItem[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

type Props = {
  personId: string
  status: 'pending' | 'done'
}

export function PersonLedgerList({ personId, status }: Props) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<LedgerItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)

  const fetchedKeyRef = useRef<string | null>(null)

  async function fetchLedger() {
    setLoading(true)
    try {
      const res = await fetch(`/api/people/${personId}/ledger?status=${status}&page=${page}&limit=20`)
      const data: PaginationResponse = await res.json()
      setItems(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching person ledger:', error)
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
    fetchLedger()
  }, [status, page])

  async function handleToggle(item: LedgerItem) {
    await fetch(`/api/installments/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reimbursed: true }),
    })
    fetchedKeyRef.current = null
    fetchLedger()
    router.refresh()
  }

  const pageLabel = Math.ceil(pagination.total / pagination.limit) || 1

  return (
    <div className="flex flex-col gap-4">
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
                  {status === 'pending' ? 'Nenhuma parcela pendente' : 'Nenhuma parcela reembolsada'}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <PersonLedgerRow key={item.id} item={item} done={status === 'done'} onToggle={handleToggle} />
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
  )
}
