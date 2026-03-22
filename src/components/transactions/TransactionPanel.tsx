'use client'

import { useTransactionPanel } from '@/providers/TransactionPanelProvider'
import { TransactionForm } from './TransactionForm'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TransactionPanel() {
  const { isOpen, close } = useTransactionPanel()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={close}
      />

      {/* Painel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-xl sm:w-[440px] border-l border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium">Novo lançamento</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TransactionForm onSuccess={close} />
        </div>
      </div>
    </>
  )
}