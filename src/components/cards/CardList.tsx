'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, CreditCard, Plus } from 'lucide-react'
import { CardFormDialog } from './CardFormDialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteCard } from '@/lib/actions/cards'

type Card = {
  id:           string
  name:         string
  brand:        string | null
  closing_day:  number
  due_day:      number
  limit_amount: number | null
  color:        string
}

export function CardList({ cards }: { cards: Card[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen]       = useState(false)
  const [editCard, setEditCard]       = useState<Card | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null)

  function openCreate() {
    setEditCard(undefined)
    setFormOpen(true)
  }

  function openEdit(card: Card) {
    setEditCard(card)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteCard(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {cards.map(card => (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {/* Ícone com cor do cartão */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: card.color + '22' }}
            >
              <CreditCard
                className="h-4 w-4"
                style={{ color: card.color }}
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium leading-tight">{card.name}</span>
              <span className="text-xs text-muted-foreground">
                {card.brand ? `${card.brand} · ` : ''}fecha dia {card.closing_day}
              </span>
            </div>

            {/* Limite + vencimento */}
            <div className="hidden sm:flex flex-col items-end mr-2">
              {card.limit_amount && (
                <span className="text-sm font-medium">
                  {card.limit_amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                vence dia {card.due_day}
              </span>
            </div>

            {/* Ações */}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(card)}>
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
        <button
          onClick={openCreate}
          className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
            <Plus className="h-4 w-4" />
          </div>
          Adicionar cartão
        </button>
      </div>

      <CardFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        card={editCard}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
              Transações vinculadas não serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}