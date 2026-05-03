"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState, useEffect, useCallback } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { useTransactionPanel } from "@/providers/TransactionPanelProvider";

type Transaction = {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  purchase_date: string;
  type: string;
  status: 'posted' | 'scheduled' | 'cancelled';
  scheduled_for: string | null;
  posted_at: string | null;
  cancelled_at: string | null;
  schedule_source: 'manual' | 'recurring';
  notes: string | null;
  card_id:            string | null;
  category_id:        string | null;
  person_id:          string | null;
  cards:              { id: string; name: string; color: string } | null
  categories:         { id: string; name: string; icon: string; color: string } | null
  people:             { id: string; name: string } | null
};

type TransactionListProps = {
  month: string;
  year: string;
  cardId?: string;
  categoryId?: string;
  personId?: string;
  type?: string;
};

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  credit: {
    label: "Crédito",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
  debit: {
    label: "Débito",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  pix: {
    label: "Pix",
    className:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  },
  cash: {
    label: "Dinheiro",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.purchase_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

export function TransactionList({
  month,
  year,
  cardId,
  categoryId,
  personId,
  type,
}: TransactionListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false });
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const { open, onRefresh, refresh } = useTransactionPanel();

  // Fetch transações com useCallback para poder refazer depois
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month);
      params.append('year', year);
      params.append('page', String(page));
      params.append('limit', '10');
      
      if (cardId) params.append('card_id', cardId);
      if (categoryId) params.append('category_id', categoryId);
      if (personId) params.append('person_id', personId);
      if (type) params.append('type', type);

      const response = await fetch(`/api/transactions?${params.toString()}`);
      const result = await response.json();
      
      setTransactions(result.data || []);
      setPagination(result.pagination || { page: 1, limit: 10, total: 0, hasMore: false });
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setTransactions([]);
      setPagination({ page: 1, limit: 10, total: 0, hasMore: false });
    } finally {
      setLoading(false);
    }
  }, [month, year, page, cardId, categoryId, personId, type]);

  // Registrar função de refetch no painel
  useEffect(() => {
    onRefresh(() => {
      setPage(1);
      setRefreshVersion(v => v + 1);
    });
  }, [onRefresh]);

  // Buscar transações quando page, filtros ou refreshVersion mudam
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshVersion]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
    refresh();
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Carregando lançamentos...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum lançamento encontrado
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Use os filtros ou adicione um novo lançamento
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);

  // Métricas do período
  const total = transactions.reduce((acc, t) => acc + t.total_amount, 0);
  const average = total / transactions.length;

  return (
    <>
      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 px-3 py-3 sm:px-4 sm:py-4 overflow-hidden">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Total do período</p>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-400 truncate">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-3 py-3 sm:px-4 sm:py-4 overflow-hidden">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Lançamentos</p>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-emerald-600 dark:text-emerald-400">
            {pagination.total}
          </p>
        </div>
        <div className="rounded-xl border border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5 px-3 py-3 sm:px-4 sm:py-4 overflow-hidden">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Média</p>
          <p className="text-sm sm:text-xl font-bold mt-1 sm:mt-2 text-purple-600 dark:text-purple-400 truncate">
            {average.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Lista agrupada por data */}
      <div className="flex flex-col">
        {groups.map(([date, items]) => (
          <div key={date}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-1 py-2 mt-2">
              {formatDate(date)}
            </p>
            <div className="flex flex-col gap-1.5">
              {items.map((t) => {
                const typeBadge = TYPE_LABELS[t.type] ?? TYPE_LABELS.credit;
                return (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-border/80"
                  >
                    {/* Ícone da categoria */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                      style={{ background: t.categories ? t.categories.color + '22' : 'hsl(var(--muted))' }}
                    >
                      {t.categories?.icon ?? '📦'}
                    </div>

                    {/* Info principal */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {t.description}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0 overflow-hidden">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                        {t.status === 'scheduled' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                            Agendado
                          </span>
                        )}
                        {(t.cards || t.categories || t.people) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {[t.cards?.name, t.categories?.name, t.people?.name].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor + parcelas + ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="text-right sm:transition-all sm:duration-200 sm:group-hover:translate-x-[-4px] sm:group-hover:opacity-60">
                        <p className="text-sm font-medium tabular-nums">
                          {t.total_amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.installments_count > 1
                            ? `${t.installments_count}x`
                            : "1x"}
                        </p>
                      </div>

                      {/* Ações — hover no desktop, sempre visível no mobile */}
                      <div className="flex gap-0.5 sm:opacity-0 sm:translate-x-2 sm:transition-all sm:duration-200 sm:group-hover:opacity-100 sm:group-hover:translate-x-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => open(t)}
                        >
                          <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir lançamento"
        description={
          <>
            Tem certeza que deseja excluir{" "}
            <strong>{deleteTarget?.description}</strong>? Todas as parcelas
            vinculadas também serão removidas.
          </>
        }
      />
    </>
  );
}
