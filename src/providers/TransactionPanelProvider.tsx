'use client'

import { createContext, useContext, useState } from 'react'

type Transaction = {
  id:                 string
  description:        string
  total_amount:       number
  installments_count: number
  purchase_date:      string
  type:               string
  notes:              string | null
  cards:              { id: string } | null
  categories:         { id: string } | null
  people:             { id: string } | null
}

type TransactionPanelContextType = {
  isOpen:      boolean
  transaction: Transaction | null
  open:        (transaction?: Transaction) => void
  close:       () => void
}

const TransactionPanelContext = createContext<TransactionPanelContextType | null>(null)

export function TransactionPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)

  function open(transaction?: Transaction) {
    setTransaction(transaction ?? null)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setTransaction(null)
  }

  return (
    <TransactionPanelContext.Provider value={{ isOpen, transaction, open, close }}>
      {children}
    </TransactionPanelContext.Provider>
  )
}

export function useTransactionPanel() {
  const ctx = useContext(TransactionPanelContext)
  if (!ctx) throw new Error('useTransactionPanel deve ser usado dentro de TransactionPanelProvider')
  return ctx
}