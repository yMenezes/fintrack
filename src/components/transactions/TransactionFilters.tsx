'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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
  const [open, setOpen] = useState(false)

  const now   = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year  = Number(searchParams.get('year')  ?? now.getFullYear())

  // Local state — preenchido a partir da URL ao abrir o modal
  const [localCard,     setLocalCard]     = useState('all')
  const [localCategory, setLocalCategory] = useState('all')
  const [localType,     setLocalType]     = useState('all')
  const [localPerson,   setLocalPerson]   = useState('all')

  const activeCount = [
    searchParams.get('card_id'),
    searchParams.get('category_id'),
    searchParams.get('type'),
    searchParams.get('person_id'),
  ].filter(Boolean).length

  function openModal() {
    setLocalCard(searchParams.get('card_id')     ?? 'all')
    setLocalCategory(searchParams.get('category_id') ?? 'all')
    setLocalType(searchParams.get('type')        ?? 'all')
    setLocalPerson(searchParams.get('person_id') ?? 'all')
    setOpen(true)
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString())

    if (localCard !== 'all')     params.set('card_id',     localCard)
    else                          params.delete('card_id')

    if (localCategory !== 'all') params.set('category_id', localCategory)
    else                          params.delete('category_id')

    if (localType !== 'all')     params.set('type',        localType)
    else                          params.delete('type')

    if (localPerson !== 'all')   params.set('person_id',   localPerson)
    else                          params.delete('person_id')

    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function clearFilters() {
    setLocalCard('all')
    setLocalCategory('all')
    setLocalType('all')
    setLocalPerson('all')
  }

  function prevMonth() {
    const d = new Date(year, month - 2)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(d.getMonth() + 1))
    params.set('year',  String(d.getFullYear()))
    router.push(`${pathname}?${params.toString()}`)
  }

  function nextMonth() {
    const d = new Date(year, month)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(d.getMonth() + 1))
    params.set('year',  String(d.getFullYear()))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      {/* Barra de filtros compacta */}
      <div className="flex items-center justify-between gap-2 mb-5">
        {/* Navegador de mês */}
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

        {/* Botão filtrar */}
        <button
          onClick={openModal}
          className="relative flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrar
          {activeCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal de filtros */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Painel */}
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold">Filtros</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selects */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Cartão</Label>
                <Select value={localCard} onValueChange={setLocalCard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os cartões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cartões</SelectItem>
                    {cards.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={localCategory} onValueChange={setLocalCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={localType} onValueChange={setLocalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Pessoa</Label>
                <Select value={localPerson} onValueChange={setLocalPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as pessoas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as pessoas</SelectItem>
                    {people.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 mt-6 pt-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
