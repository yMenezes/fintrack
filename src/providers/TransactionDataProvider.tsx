'use client'

import { createContext, useContext } from 'react'

type Card      = { id: string; name: string }
type Category  = { id: string; name: string; icon: string }
type Person    = { id: string; name: string }

type TransactionDataContextType = {
  cards:      Card[]
  categories: Category[]
  people:     Person[]
}

const TransactionDataContext = createContext<TransactionDataContextType | undefined>(undefined)

type Props = {
  cards:       Card[]
  categories:  Category[]
  people:      Person[]
  children:    React.ReactNode
}

export function TransactionDataProvider({ cards, categories, people, children }: Props) {
  return (
    <TransactionDataContext.Provider value={{ cards, categories, people }}>
      {children}
    </TransactionDataContext.Provider>
  )
}

export function useTransactionData() {
  const context = useContext(TransactionDataContext)
  if (context === undefined) {
    return { cards: [], categories: [], people: [] }
  }
  return context
}
