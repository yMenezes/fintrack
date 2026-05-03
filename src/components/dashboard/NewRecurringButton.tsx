'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'
import { RecurringFormDialog } from '@/components/recurring/RecurringFormDialog'

type Card = { id: string; name: string }
type Category = { id: string; name: string; icon: string }
type Person = { id: string; name: string }

type Props = {
  cards: Card[]
  categories: Category[]
  people: Person[]
}

export function NewRecurringButton({ cards, categories, people }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova conta recorrente
      </button>

      <TransactionDataProvider cards={cards} categories={categories} people={people}>
        <RecurringFormDialog open={open} onClose={() => setOpen(false)} />
      </TransactionDataProvider>
    </>
  )
}
