import { z } from 'zod'

const TRANSACTION_STATUS = ['posted', 'scheduled', 'cancelled'] as const
const TRANSACTION_SCHEDULE_SOURCE = ['manual', 'recurring'] as const

// ──────────────────────────────────────────────────────────────
// CARDS
// ──────────────────────────────────────────────────────────────

export const cardCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  brand: z.string().optional(),
  closing_day: z.number().int().min(1).max(31, 'Fechamento deve ser 1-31'),
  due_day: z.number().int().min(1).max(31, 'Vencimento deve ser 1-31'),
  limit_amount: z.number().min(0, 'Limite não pode ser negativo').optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex válida').default('#6366f1'),
})

export const cardUpdateSchema = cardCreateSchema.partial()

export type CardInput = z.infer<typeof cardCreateSchema>
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>

// ──────────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  icon: z.string().optional().default('📦'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex válida').optional().default('#6366f1'),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export type CategoryInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>

// ──────────────────────────────────────────────────────────────
// PEOPLE
// ──────────────────────────────────────────────────────────────

export const personCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  relationship: z.string().optional(),
})

export const personUpdateSchema = personCreateSchema.partial()

export type PersonInput = z.infer<typeof personCreateSchema>
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>

// ──────────────────────────────────────────────────────────────
// RECURRING TRANSACTIONS
// ──────────────────────────────────────────────────────────────

const recurringTransactionFieldsSchema = {
  description: z.string().min(1, 'Descrição obrigatória'),
  total_amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['credit', 'debit', 'pix', 'cash']),
  day_of_month: z.number().int().min(1).max(31, 'Dia deve ser entre 1 e 31'),
  start_date: z.string().date('Data inicial inválida'),
  end_date: z.string().date('Data final inválida').optional().nullable(),
  next_run_date: z.string().date('Próxima execução inválida'),
  last_run_date: z.string().date('Última execução inválida').optional().nullable(),
  active: z.boolean().default(true),
  card_id: z.string().uuid('ID do cartão inválido').optional().nullable(),
  category_id: z.string().uuid('ID da categoria inválido').optional().nullable(),
  person_id: z.string().uuid('ID da pessoa inválido').optional().nullable(),
  notes: z.string().optional().nullable(),
}

export const recurringTransactionCreateSchema = z.object(recurringTransactionFieldsSchema).superRefine((data, ctx) => {
  if (data.end_date && data.end_date < data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_date'],
      message: 'Data final deve ser igual ou posterior à data inicial',
    })
  }

  if (data.next_run_date < data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['next_run_date'],
      message: 'Próxima execução deve ser igual ou posterior à data inicial',
    })
  }
})

export const recurringTransactionUpdateSchema = z.object(recurringTransactionFieldsSchema).partial()

export type RecurringTransactionInput = z.infer<typeof recurringTransactionCreateSchema>
export type RecurringTransactionUpdateInput = z.infer<typeof recurringTransactionUpdateSchema>

// ──────────────────────────────────────────────────────────────
// TRANSACTIONS
// ──────────────────────────────────────────────────────────────

const todayIsoDate = () => new Date().toISOString().split('T')[0]

export const transactionStatusSchema = z.enum(TRANSACTION_STATUS)
export const transactionScheduleSourceSchema = z.enum(TRANSACTION_SCHEDULE_SOURCE)

const transactionFieldsSchema = {
  description: z.string().min(1, 'Descrição obrigatória'),
  total_amount: z.number().positive('Valor deve ser positivo'),
  installments_count: z.number().int().min(1).max(60, 'Limite de parcelas: 1-60'),
  purchase_date: z.string().date('Data inválida'),
  type: z.enum(['credit', 'debit', 'pix', 'cash']),
  status: transactionStatusSchema.default('posted'),
  scheduled_for: z.string().date('Data agendada inválida').optional().nullable(),
  schedule_source: transactionScheduleSourceSchema.default('manual'),
  card_id: z.string().uuid('ID do cartão inválido').optional().nullable(),
  category_id: z.string().uuid('ID da categoria inválido').optional().nullable(),
  person_id: z.string().uuid('ID da pessoa inválido').optional().nullable(),
  notes: z.string().optional().nullable(),
}

export const transactionCreateSchema = z.object(transactionFieldsSchema).superRefine((data, ctx) => {
  if (data.status === 'scheduled') {
    const effectiveScheduledFor = data.scheduled_for ?? data.purchase_date

    if (effectiveScheduledFor < todayIsoDate()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduled_for'], message: 'Data agendada deve ser hoje ou no futuro' })
    }

    if (data.purchase_date !== effectiveScheduledFor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['purchase_date'], message: 'Data da compra deve совпidir com a data agendada' })
    }
  }
})

export const transactionUpdateSchema = z.object(transactionFieldsSchema).partial()

export type TransactionInput = z.infer<typeof transactionCreateSchema>
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>

// ──────────────────────────────────────────────────────────────
// INSTALLMENTS
// ──────────────────────────────────────────────────────────────

export const installmentUpdateSchema = z.object({
  paid: z.boolean(),
})

export type InstallmentUpdateInput = z.infer<typeof installmentUpdateSchema>
