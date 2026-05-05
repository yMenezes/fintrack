"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recurringTransactionCreateSchema,
  type RecurringTransactionInput,
} from "@/lib/validations";
import type { RecurringTransaction } from "@/types/database";
import { useTransactionData } from "@/providers/TransactionDataProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecurringWithRelations = RecurringTransaction & {
  cards: { id: string; name: string; color: string } | null;
  categories: { id: string; name: string; icon: string; color: string } | null;
  people: { id: string; name: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  recurring?: RecurringWithRelations;
  onSaved?: () => void;
};

const today = new Date().toISOString().split('T')[0];

export function RecurringFormDialog({ open, onClose, recurring, onSaved }: Props) {
  const router = useRouter();
  const isEditing = !!recurring;
  const { cards, categories, people } = useTransactionData();
  const [helpOpen, setHelpOpen] = useState(false);

  const form = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionCreateSchema),
    defaultValues: {
      description: '',
      total_amount: 0,
      type: 'credit',
      day_of_month: 1,
      start_date: today,
      end_date: null,
      next_run_date: today,
      last_run_date: null,
      active: true,
      card_id: null,
      category_id: null,
      person_id: null,
      notes: null,
    },
  })

  const dayOfMonthValue = form.watch('day_of_month')

  function computeNextFromToday(dayOfMonth: number) {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const lastDayOfMonth = (y: number, mo: number) => new Date(y, mo + 1, 0).getDate()
      const dayThisMonth = Math.min(dayOfMonth, lastDayOfMonth(year, month))
      const candidate = new Date(year, month, dayThisMonth)

      if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return candidate.toISOString().split('T')[0]
      }

      // next month
      const nextMonth = month + 1
      const nextYear = year + Math.floor(nextMonth / 12)
      const nextMonthIndex = nextMonth % 12
      const dayNextMonth = Math.min(dayOfMonth, lastDayOfMonth(nextYear, nextMonthIndex))
      const candidate2 = new Date(nextYear, nextMonthIndex, dayNextMonth)
      return candidate2.toISOString().split('T')[0]
    } catch {
      return today
    }
  }

  useEffect(() => {
    if (!open) return

    if (isEditing && recurring) {
      form.reset({
        description: recurring.description,
        total_amount: recurring.total_amount,
        type: recurring.type,
        day_of_month: recurring.day_of_month,
        start_date: recurring.start_date.split('T')[0],
        end_date: recurring.end_date ? recurring.end_date.split('T')[0] : null,
        next_run_date: recurring.next_run_date.split('T')[0],
        last_run_date: recurring.last_run_date ? recurring.last_run_date.split('T')[0] : null,
        active: recurring.active,
        card_id: recurring.card_id,
        category_id: recurring.category_id,
        person_id: recurring.person_id,
        notes: recurring.notes,
      })
    } else {
      form.reset({
        description: '',
        total_amount: 0,
        type: 'credit',
        day_of_month: 1,
        start_date: today,
        end_date: null,
        next_run_date: today,
        last_run_date: null,
        active: true,
        card_id: null,
        category_id: null,
        person_id: null,
        notes: null,
      })
    }
  }, [open, isEditing, recurring, form])

  useEffect(() => {
    const next = computeNextFromToday(dayOfMonthValue ?? 1)
    if (form.getValues('next_run_date') !== next) {
      form.setValue('next_run_date', next, { shouldValidate: false })
    }
    if (form.getValues('start_date') !== next) {
      form.setValue('start_date', next, { shouldValidate: false })
    }
  }, [form, dayOfMonthValue])

  async function handleSubmit(data: RecurringTransactionInput) {
    try {
      const url = recurring ? `/api/recurring-transactions/${recurring.id}` : '/api/recurring-transactions'
      const method = recurring ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          next_run_date: data.start_date,
          end_date: data.end_date || null,
          last_run_date: data.last_run_date || null,
          notes: data.notes || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (errorData.error?.fieldErrors) {
          const validFields = ['description', 'total_amount', 'type', 'day_of_month', 'start_date', 'end_date', 'next_run_date', 'last_run_date', 'active', 'card_id', 'category_id', 'person_id', 'notes'] as const
          Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]: [string, any]) => {
            if (validFields.includes(key as any)) {
              form.setError(key as keyof RecurringTransactionInput, { message: msgs[0] })
            }
          })
          return
        }

        form.setError('root', { message: errorData.error ?? 'Erro ao salvar recorrência' })
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

  const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0 pr-12">
          <DialogTitle>{recurring ? 'Editar recorrência' : 'Nova recorrência'}</DialogTitle>
        </DialogHeader>

        <form id="recurring-form" onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-6 py-4 grid gap-4">
          <input type="hidden" {...form.register('next_run_date')} />
          <input type="hidden" {...form.register('start_date')} />

          <div className="grid gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Internet, aluguel, streaming..." {...form.register('description')} />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="total_amount">Valor</Label>
              <MoneyInput control={form.control} name="total_amount" id="total_amount" />
              {form.formState.errors.total_amount && <p className="text-sm text-destructive">{form.formState.errors.total_amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as RecurringTransactionInput['type'])}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Dia do mês</Label>
              <Select value={String(form.watch('day_of_month'))} onValueChange={(value) => form.setValue('day_of_month', Number(value))}>
                <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day} value={String(day)}>Dia {day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.day_of_month && <p className="text-sm text-destructive">{form.formState.errors.day_of_month.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="end_date">Data final (opcional)</Label>
              <Input id="end_date" type="date" {...form.register('end_date')} />
              {form.formState.errors.end_date && <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label>Próxima execução</Label>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Informação sobre próxima execução"
                  aria-expanded={helpOpen}
                  title="Calculada a partir do dia do mês selecionado e da data atual."
                  onClick={() => setHelpOpen((current) => !current)}
                  onMouseEnter={() => setHelpOpen(true)}
                  onMouseLeave={() => setHelpOpen(false)}
                  onFocus={() => setHelpOpen(true)}
                  onBlur={() => setHelpOpen(false)}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="relative">
                <Input value={computeNextFromToday(form.watch('day_of_month'))} readOnly />
                {helpOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 max-w-[280px] rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    Calculada a partir do dia do mês selecionado e da data atual.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>Cartão</Label>
              <Select value={form.watch('card_id') ?? 'none'} onValueChange={(value) => form.setValue('card_id', value === 'none' ? null : value)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cartão</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={form.watch('category_id') ?? 'none'} onValueChange={(value) => form.setValue('category_id', value === 'none' ? null : value)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.icon} {category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Pessoa</Label>
              <Select value={form.watch('person_id') ?? 'none'} onValueChange={(value) => form.setValue('person_id', value === 'none' ? null : value)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem pessoa</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={String(form.watch('active'))} onValueChange={(value) => form.setValue('active', value === 'true')}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" placeholder="Opcional" {...form.register('notes')} />
          </div>

          {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>Cancelar</Button>
          <Button type="submit" form="recurring-form" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}