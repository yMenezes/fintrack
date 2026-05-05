"use client";

import { useEffect, useMemo, useState } from "react";
import { Repeat, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/add-button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { RecurringFormDialog } from "./RecurringFormDialog";
import type { RecurringTransaction } from "@/types/database";

type RecurringItem = RecurringTransaction & {
  cards: { id: string; name: string; color: string } | null;
  categories: { id: string; name: string; icon: string; color: string } | null;
  people: { id: string; name: string } | null;
};

type PaginationResponse = {
  data: RecurringItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

function formatDate(dateValue: string) {
  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RecurringList() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RecurringItem | null>(null);

  const pageLabel = useMemo(() => Math.ceil(pagination.total / pagination.limit) || 1, [pagination.total, pagination.limit]);

  useEffect(() => {
    fetchRecurring()
  }, [page])

  async function fetchRecurring() {
    setLoading(true)
    try {
      const res = await fetch(`/api/recurring-transactions?page=${page}&limit=10`)
      const data: PaginationResponse = await res.json()
      setItems(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching recurring transactions:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditRecurring(undefined)
    setFormOpen(true)
  }

  function openEdit(item: RecurringItem) {
    setEditRecurring(item)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/recurring-transactions/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    setPage(1)
    await fetchRecurring()
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <AddButton label="Adicionar recorrência" onClick={openCreate} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma recorrência encontrada</p>
                </div>
              ) : (
                items.map((item) => {
                  const isInactive = !item.active

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${isInactive ? 'border-border/70 bg-muted/40 opacity-80' : 'border-border bg-card'}`}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                        style={{ background: item.categories ? item.categories.color + '22' : 'hsl(var(--muted))' }}
                      >
                        {item.categories?.icon ?? <Repeat className="h-4 w-4" />}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{item.description}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                            {item.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Dia {item.day_of_month} · Início {formatDate(item.start_date)} · Próx. {formatDate(item.next_run_date)}
                        </span>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-medium rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            {item.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          {item.cards && <span className="text-xs text-muted-foreground">· {item.cards.name}</span>}
                          {item.categories && <span className="text-xs text-muted-foreground">· {item.categories.name}</span>}
                          {item.people && <span className="text-xs text-muted-foreground">· {item.people.name}</span>}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <div className="text-xs text-muted-foreground">
                Página {pagination.page} de {pageLabel}
                {pagination.total > 0 && ` · ${pagination.total} total`}
              </div>

              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasMore || loading}>
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <RecurringFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        recurring={editRecurring}
        onSaved={() => {
          setPage(1)
          fetchRecurring()
        }}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir recorrência"
        description={<>Tem certeza que deseja excluir <strong>{deleteTarget?.description}</strong>? Isso não remove lançamentos já criados.</>}
      />
    </>
  )
}