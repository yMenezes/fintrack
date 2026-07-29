'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { incomeCreateSchema, type IncomeInput } from '@/lib/validations'
import { INCOME_SOURCES, INCOME_SOURCE_LABELS, type Income } from '@/types/database'
import { useTransactionData } from '@/providers/TransactionDataProvider'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import {
  Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog'
import { PeopleFormDialog } from '@/components/people/PeopleFormDialog'

type IncomeWithRelations = Income & {
  categories: { id: string; name: string; icon: string; color: string } | null
  people:     { id: string; name: string } | null
}

type Props = {
  open: boolean
  onClose: () => void
  income?: Pick<IncomeWithRelations, 'id' | 'description' | 'amount' | 'date' | 'source' | 'status' | 'scheduled_for' | 'category_id' | 'person_id' | 'notes'>
  onSaved?: () => void
}

const today = new Date().toISOString().split('T')[0]

export function IncomeFormDialog({ open, onClose, income, onSaved }: Props) {
  const router = useRouter()
  const isEditing = !!income
  const { categories, people } = useTransactionData()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [personDialogOpen, setPersonDialogOpen] = useState(false)
  const [extraCategory, setExtraCategory] = useState<{ id: string; name: string; icon: string } | null>(null)
  const [extraPerson, setExtraPerson] = useState<{ id: string; name: string } | null>(null)

  const categoryOptions = extraCategory && !categories.some((c) => c.id === extraCategory.id) ? [...categories, extraCategory] : categories
  const personOptions = extraPerson && !people.some((p) => p.id === extraPerson.id) ? [...people, extraPerson] : people

  const form = useForm<IncomeInput>({
    resolver: zodResolver(incomeCreateSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: today,
      source: 'other',
      status: 'received',
      scheduled_for: null,
      category_id: null,
      person_id: null,
      notes: null,
    },
  })

  const statusValue = form.watch('status')
  const dateValue = form.watch('date')
  const isScheduled = statusValue === 'scheduled'

  useEffect(() => {
    if (!open) return

    if (isEditing && income) {
      form.reset({
        description: income.description,
        amount: income.amount,
        date: income.date.split('T')[0],
        source: income.source,
        status: income.status,
        scheduled_for: income.scheduled_for,
        category_id: income.category_id,
        person_id: income.person_id,
        notes: income.notes,
      })
    } else {
      form.reset({
        description: '',
        amount: 0,
        date: today,
        source: 'other',
        status: 'received',
        scheduled_for: null,
        category_id: null,
        person_id: null,
        notes: null,
      })
    }
  }, [open, isEditing, income, form])

  useEffect(() => {
    if (isScheduled) {
      if (form.getValues('scheduled_for') !== dateValue) {
        form.setValue('scheduled_for', dateValue, { shouldValidate: false })
      }
      return
    }

    if (form.getValues('scheduled_for') !== null) {
      form.setValue('scheduled_for', null, { shouldValidate: false })
    }
  }, [isScheduled, dateValue, form])

  async function handleSubmit(data: IncomeInput) {
    try {
      const url    = income ? `/api/income/${income.id}` : '/api/income'
      const method = income ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: isScheduled ? 'scheduled' : 'received',
          scheduled_for: isScheduled ? data.date : null,
          category_id: data.category_id || null,
          person_id:   data.person_id   || null,
          notes:       data.notes       || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error?.fieldErrors) {
          const valid = ['description', 'amount', 'date', 'source', 'status', 'scheduled_for', 'category_id', 'person_id', 'notes'] as const
          Object.entries(err.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            if (valid.includes(key as any)) {
              form.setError(key as keyof IncomeInput, { message: msgs[0] })
            }
          })
          return
        }
        form.setError('root', { message: err.error ?? 'Erro ao salvar entrada' })
        return
      }

      router.refresh()
      onSaved?.()
      onClose()
      form.reset()
    } catch {
      form.setError('root', { message: 'Erro de conexão' })
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh] gap-0 p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border shrink-0 pr-8 sm:pr-12">
          <DialogTitle className="text-base sm:text-lg">{income ? 'Editar entrada' : 'Nova entrada'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Salário maio, Freela cliente X"
                className="text-sm"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <span className="text-xs sm:text-sm text-red-500">{form.formState.errors.description.message}</span>
              )}
            </div>

            {/* Agendamento */}
            <div className="space-y-1.5">
              <Label className="text-sm">Recebimento</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => form.setValue('status', 'received', { shouldValidate: true })}
                  className={`rounded-lg border py-2 text-xs transition-colors ${
                    statusValue === 'received'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Agora
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('status', 'scheduled', { shouldValidate: true })}
                  className={`rounded-lg border py-2 text-xs transition-colors ${
                    statusValue === 'scheduled'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Agendar
                </button>
              </div>
            </div>

            {/* Valor + Data */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Valor</Label>
                <MoneyInput
                  control={form.control}
                  name="amount"
                />
                {form.formState.errors.amount && (
                  <span className="text-xs sm:text-sm text-red-500">{form.formState.errors.amount.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-sm">{isScheduled ? 'Data agendada' : 'Data'}</Label>
                <Input
                  id="date"
                  type="date"
                  className="text-sm"
                  {...form.register('date')}
                />
                {form.formState.errors.date && (
                  <span className="text-xs sm:text-sm text-red-500">{form.formState.errors.date.message}</span>
                )}
              </div>
            </div>

            {/* Fonte */}
            <div className="space-y-1.5">
              <Label className="text-sm">Fonte</Label>
              <Select
                value={form.watch('source')}
                onValueChange={(v) => form.setValue('source', v as IncomeInput['source'], { shouldValidate: true })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {INCOME_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-sm">Categoria (opcional)</Label>
              <Select
                value={form.watch('category_id') ?? 'none'}
                onValueChange={(v) => {
                  if (v === '__new_category__') {
                    setCategoryDialogOpen(true)
                    return
                  }
                  form.setValue('category_id', v === 'none' ? null : v)
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="__new_category__" className="text-primary font-medium">
                    + Nova categoria
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pessoa */}
            <div className="space-y-1.5">
              <Label className="text-sm">Pessoa (opcional)</Label>
              <Select
                value={form.watch('person_id') ?? 'none'}
                onValueChange={(v) => {
                  if (v === '__new_person__') {
                    setPersonDialogOpen(true)
                    return
                  }
                  form.setValue('person_id', v === 'none' ? null : v)
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Nenhuma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma pessoa</SelectItem>
                  {personOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="__new_person__" className="text-primary font-medium">
                    + Nova pessoa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">Observações (opcional)</Label>
              <Input
                id="notes"
                placeholder="Detalhes adicionais..."
                className="text-sm"
                {...form.register('notes')}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.root.message}</p>
            )}
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border shrink-0 gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="text-sm">
              {form.formState.isSubmitting ? 'Salvando...' : income ? 'Salvar alterações' : 'Adicionar entrada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CategoryFormDialog
      open={categoryDialogOpen}
      onClose={() => setCategoryDialogOpen(false)}
      onSaved={(created) => {
        if (!created) return
        setExtraCategory(created)
        form.setValue('category_id', created.id, { shouldValidate: true })
      }}
    />
    <PeopleFormDialog
      open={personDialogOpen}
      onClose={() => setPersonDialogOpen(false)}
      onSaved={(created) => {
        if (!created) return
        setExtraPerson(created)
        form.setValue('person_id', created.id, { shouldValidate: true })
      }}
    />
    </>
  )
}
