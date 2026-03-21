"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import { CardFormDialog } from "./CardFormDialog";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/add-button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { deleteCard } from "@/lib/actions/cards";

type Card = {
  id: string;
  name: string;
  brand: string | null;
  closing_day: number;
  due_day: number;
  limit_amount: number | null;
  color: string;
};

export function CardList({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);

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
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
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
        ))}

        {/* Adicionar */}
        <AddButton label="Adicionar cartão" onClick={openCreate} />
      </div>

      <CardFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        card={editCard}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir cartão"
        description={
          <>
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>
            ? Transações vinculadas não serão afetadas.
          </>
        }
      />
    </>
  );
}
