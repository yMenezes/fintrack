"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useState } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { useTransactionPanel } from "@/providers/TransactionPanelProvider";

type Transaction = {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  purchase_date: string;
  type: string;
  notes: string | null;
  cards:              { id: string; name: string; color: string } | null
  categories:         { id: string; name: string; icon: string; color: string } | null
  people:             { id: string; name: string } | null
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
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const { open } = useTransactionPanel();

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
    router.refresh();
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
        {[
          {
            label: "Total do período",
            value: total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          },
          { label: "Lançamentos", value: transactions.length },
          {
            label: "Média por compra",
            value: average.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className="text-lg font-medium">{m.value}</p>
          </div>
        ))}
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
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeBadge.className}`}
                        >
                          {typeBadge.label}
                        </span>
                        {t.cards && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">
                              ·
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t.cards.name}
                            </span>
                          </>
                        )}
                        {t.categories && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">
                              ·
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t.categories.name}
                            </span>
                          </>
                        )}
                        {t.people && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">
                              ·
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t.people.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Valor + parcelas com animação */}
                    <div className="flex items-center gap-1">
                      <div className="text-right transition-all duration-200 group-hover:translate-x-[-4px] group-hover:opacity-60">
                        <p className="text-sm font-medium">
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

                      {/* Ações — aparecem no hover */}
                      <div className="flex gap-1 opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => open(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
