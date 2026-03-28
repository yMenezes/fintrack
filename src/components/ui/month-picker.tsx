'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function MonthPicker() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const now   = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year  = Number(searchParams.get('year')  ?? now.getFullYear())

  function updateParams(newMonth: number, newYear: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(newMonth))
    params.set('year',  String(newYear))
    router.push(`${pathname}?${params.toString()}`)
  }

  function prevMonth() {
    const d = new Date(year, month - 2)
    updateParams(d.getMonth() + 1, d.getFullYear())
  }

  function nextMonth() {
    const d = new Date(year, month)
    updateParams(d.getMonth() + 1, d.getFullYear())
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      <button 
        onClick={prevMonth} 
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[110px] text-center text-xs font-medium">
        {MONTHS[month - 1]} {year}
      </span>
      <button 
        onClick={nextMonth} 
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
