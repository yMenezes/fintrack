'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type Transaction = {
  id:                 string
  description:        string
  total_amount:       number
  installments_count: number
  purchase_date:      string
  type:               string
  status:             'posted' | 'scheduled' | 'cancelled'
  scheduled_for:      string | null
  posted_at:          string | null
  cancelled_at:       string | null
  schedule_source:    'manual' | 'recurring'
  notes:              string | null
  card_id:            string | null
  category_id:        string | null
  person_id:          string | null
  cards:              { id: string } | null
  categories:         { id: string } | null
  people:             { id: string } | null
}

type TransactionPanelContextType = {
  isOpen:      boolean
  transaction: Transaction | null
  mode:        'create' | 'edit'
  open:        (transaction?: Transaction) => void
  close:       () => void
  onRefresh:   (callback: () => void) => void
  refresh:     () => void
}

const TransactionPanelContext = createContext<TransactionPanelContextType | null>(null)

export function TransactionPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [mode, setMode]               = useState<'create' | 'edit'>('create')
  const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null)

  function open(transaction?: Transaction) {
    if (transaction) {
      setTransaction(transaction)
      setMode('edit')
    } else {
      setTransaction(null)
      setMode('create')
    }
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setTransaction(null)
    setMode('create')
  }

  const onRefresh = useCallback((callback: () => void) => {
    setRefreshCallback(() => callback)
  }, [])

  const refresh = useCallback(() => {
    refreshCallback?.()
  }, [refreshCallback])

  return (
    <TransactionPanelContext.Provider value={{ isOpen, transaction, mode, open, close, onRefresh, refresh }}>
      {children}
    </TransactionPanelContext.Provider>
  )
}

export function useTransactionPanel() {
  const ctx = useContext(TransactionPanelContext)
  if (!ctx) throw new Error('useTransactionPanel deve ser usado dentro de TransactionPanelProvider')
  return ctx
}