'use client'

import { useEffect, useRef, useState } from 'react'
import { useTransactionPanel } from '@/providers/TransactionPanelProvider'
import { TransactionForm } from './TransactionForm'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Card     = { id: string; name: string; closing_day: number }
type Category = { id: string; name: string; icon: string }
type Person   = { id: string; name: string }

export function TransactionPanel() {
  const { isOpen, close, transaction } = useTransactionPanel()
  const [rendered, setRendered] = useState(false)
  const [visible, setVisible]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const [cards, setCards]         = useState<Card[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [people, setPeople]       = useState<Person[]>([])

  useEffect(() => {
    if (!isOpen) return
    async function load() {
      const [cardsRes, catsRes, peopleRes] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/categories'),
        fetch('/api/people'),
      ])
      const [cardsData, catsData, peopleData] = await Promise.all([
        cardsRes.json(),
        catsRes.json(),
        peopleRes.json(),
      ])
      setCards(cardsData)
      setCategories(catsData)
      setPeople(peopleData)
    }
    load()
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (isOpen) {
      timerRef.current = setTimeout(() => setRendered(true), 0)
      timerRef.current = setTimeout(() => setVisible(true), 10)
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 0)
      timerRef.current = setTimeout(() => setRendered(false), 360)
    }
    return () => clearTimeout(timerRef.current)
  }, [isOpen])

  if (!rendered) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={close}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background border-l border-border sm:w-[440px]"
        style={{
          transform:  visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium">
            {transaction ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TransactionForm
            onSuccess={close}
            transaction={transaction}
            cards={cards}
            categories={categories}
            people={people}
          />
        </div>
      </div>
    </>
  )
}