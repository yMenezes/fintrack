"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/add-button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { RecurringIncomeFormDialog } from "./RecurringIncomeFormDialog";
import type { RecurringIncome } from "@/types/database";

const INCOME_SOURCE_LABELS: Record<string, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  investment: 'Investimento',
  gift: 'Presente',
  other: 'Outro',
}

type RecurringIncomeItem = RecurringIncome & {
  categories: { id: string; name: string; icon: string; color: string } | null;
  people: { id: string; name: string } | null;
};

type PaginationResponse = {
  data: RecurringIncomeItem[];
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

export function RecurringIncomeList() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<RecurringIncomeItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringIncomeItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RecurringIncomeItem | null>(null);

  const pageLabel = useMemo(() => Math.ceil(pagination.total / pagination.limit) || 1, [pagination.total, pagination.limit]);

  const fetchedPageRef = useRef<number | null>(null);
  useEffect(() => {
    if (fetchedPageRef.current === page) return;
    fetchedPageRef.current = page;
    fetchRecurringIncome()
  }, [page])

  async function fetchRecurringIncome() {
    setLoading(true)
    try {
      const res = await fetch(`/api/recurring-income?page=${page}&limit=10`)
      const data: PaginationResponse = await res.json()
      setItems(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching recurring income:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditRecurring(undefined)
    setFormOpen(true)
  }

  function openEdit(item: RecurringIncomeItem) {
    setEditRecurring(item)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/recurring-income/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    setPage(1)
    await fetchRecurringIncome()
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <AddButton label="Adicionar entrada recorrente" onClick={openCreate} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma entrada recorrente encontrada</p>
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
                        {item.categories?.icon ?? <TrendingUp className="h-4 w-4" />}
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
                          <span className="text-[10px] font-medium rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                            {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-xs text-muted-foreground">· {INCOME_SOURCE_LABELS[item.source] || item.source}</span>
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
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <span className="text-xs text-muted-foreground">
                Página {page} de {pageLabel}
              </span>

              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasMore || loading}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      <RecurringIncomeFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditRecurring(undefined)
        }}
        recurring={editRecurring}
        onSaved={async () => {
          setPage(1)
          await fetchRecurringIncome()
        }}
      />

      {deleteTarget && (
        <DeleteDialog
          title="Excluir entrada recorrente"
          description={`Tem certeza que deseja excluir "${deleteTarget.description}"? Isto não pode ser desfeito.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          open={true} />
      )}
    </>
  )
}
