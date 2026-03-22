'use client'

import { createContext, useContext, useState } from 'react'

type TransactionPanelContextType = {
  isOpen: boolean
  open:   () => void
  close:  () => void
}

const TransactionPanelContext = createContext<TransactionPanelContextType | null>(null)

export function TransactionPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <TransactionPanelContext.Provider value={{
      isOpen,
      open:  () => setIsOpen(true),
      close: () => setIsOpen(false),
    }}>
      {children}
    </TransactionPanelContext.Provider>
  )
}

export function useTransactionPanel() {
  const ctx = useContext(TransactionPanelContext)
  if (!ctx) throw new Error('useTransactionPanel deve ser usado dentro de TransactionPanelProvider')
  return ctx
}