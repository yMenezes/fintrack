"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import type { Card } from "@/types/database";
import { CardFormDialog } from "./CardFormDialog";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/add-button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { deleteCard } from "@/lib/actions/cards";

type PaginationResponse = {
  data: Card[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export function CardList() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [page]);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cards?page=${page}&limit=10`);
      const data: PaginationResponse = await res.json();
      setCards(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditCard(undefined);
    setFormOpen(true);
  }

  function openEdit(card: Card) {
    setEditCard(card);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteCard(deleteTarget.id);
    setDeleteTarget(null);
    setPage(1);
    await fetchCards();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Add Button - Always Visible at Top */}
        <AddButton label="Adicionar cartão" onClick={openCreate} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {cards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum cartão encontrado</p>
                </div>
              ) : (
                cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    {/* Ícone com cor do cartão */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: card.color + "22" }}
                    >
                      <CreditCard className="h-4 w-4" style={{ color: card.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium leading-tight">
                        {card.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.brand ? `${card.brand} · ` : ""}fecha dia{" "}
                        {card.closing_day}
                      </span>
                    </div>

                    {/* Limite + vencimento */}
                    <div className="hidden sm:flex flex-col items-end mr-2">
                      {card.limit_amount && (
                        <span className="text-sm font-medium">
                          {card.limit_amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        vence dia {card.due_day}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(card)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(card)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="text-xs text-muted-foreground">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
                {pagination.total > 0 && ` · ${pagination.total} total`}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      <CardFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        card={editCard}
        onSaved={() => {
          setPage(1);
          fetchCards();
        }}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir cartão"
        description={
          <>
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
            Transações vinculadas não serão afetadas.
          </>
        }
      />
    </>
  );
}

