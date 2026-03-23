'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Card     = { id: string; name: string }
type Category = { id: string; name: string; icon: string }
type Person   = { id: string; name: string }

type Props = {
  cards:      Card[]
  categories: Category[]
  people:     Person[]
}

const TYPES = [
  { value: 'credit', label: 'Crédito'  },
  { value: 'debit',  label: 'Débito'   },
  { value: 'pix',    label: 'Pix'      },
  { value: 'cash',   label: 'Dinheiro' },
]

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function TransactionFilters({ cards, categories, people }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const now   = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year  = Number(searchParams.get('year')  ?? now.getFullYear())

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  function prevMonth() {
    const d = new Date(year, month - 2)
    updateParam('month', String(d.getMonth() + 1))
    updateParam('year',  String(d.getFullYear()))
  }

  function nextMonth() {
    const d = new Date(year, month)
    updateParam('month', String(d.getMonth() + 1))
    updateParam('year',  String(d.getFullYear()))
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Navegador de mês */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
        <button onClick={prevMonth} className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[110px] text-center text-xs font-medium">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cartão */}
      <Select
        value={searchParams.get('card_id') ?? 'all'}
        onValueChange={v => updateParam('card_id', v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
          <SelectValue placeholder="Cartão" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os cartões</SelectItem>
          {cards.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Categoria */}
      <Select
        value={searchParams.get('category_id') ?? 'all'}
        onValueChange={v => updateParam('category_id', v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo */}
      <Select
        value={searchParams.get('type') ?? 'all'}
        onValueChange={v => updateParam('type', v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {TYPES.map(t => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Pessoa */}
      <Select
        value={searchParams.get('person_id') ?? 'all'}
        onValueChange={v => updateParam('person_id', v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
          <SelectValue placeholder="Pessoa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as pessoas</SelectItem>
          {people.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}