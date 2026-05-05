'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'tx_processed'

// Dispara o processamento uma única vez por dia, compartilhado entre todas as abas.
// localStorage (ao contrário de sessionStorage) é compartilhado entre abas do mesmo domínio,
// impedindo que duas abas abertas simultaneamente disparem requests duplicados.
export function TransactionProcessor() {
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (localStorage.getItem(STORAGE_KEY) === today) return

    localStorage.setItem(STORAGE_KEY, today)
    fetch('/api/process-transactions', { method: 'POST' }).catch(() => {
      // Limpa a flag para tentar novamente na próxima navegação se falhar
      localStorage.removeItem(STORAGE_KEY)
    })
  }, [])

  return null
}
