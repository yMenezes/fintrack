import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateInstallments } from '@/lib/installments'

const transactionSchema = z.object({
  description:        z.string().min(1),
  total_amount:       z.number().positive(),
  installments_count: z.number().int().min(1).max(24),
  purchase_date:      z.string(),
  type:               z.enum(['credit', 'debit', 'pix', 'cash']),
  card_id:            z.string().uuid().optional().nullable(),
  category_id:        z.string().uuid().optional().nullable(),
  person_id:          z.string().uuid().optional().nullable(),
  notes:              z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body   = await request.json()
  const parsed = transactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const {
    description, total_amount, installments_count,
    purchase_date, type, card_id, category_id, person_id, notes
  } = parsed.data

  // 1. Atualiza a transação
  const { error: txError } = await supabase
    .from('transactions')
    .update({
      description,
      total_amount,
      installments_count,
      purchase_date,
      type,
      card_id:     card_id     ?? null,
      category_id: category_id ?? null,
      person_id:   person_id   ?? null,
      notes:       notes       ?? null,
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  // 2. Deleta as parcelas antigas
  const { error: delError } = await supabase
    .from('installments')
    .delete()
    .eq('transaction_id', params.id)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  // 3. Busca o closing_day do cartão
  let closingDay = 1
  if (card_id) {
    const { data: card } = await supabase
      .from('cards')
      .select('closing_day')
      .eq('id', card_id)
      .single()
    if (card) closingDay = card.closing_day
  }

  // 4. Gera e insere as novas parcelas
  const installments = generateInstallments(
    params.id,
    total_amount,
    type === 'credit' ? installments_count : 1,
    new Date(purchase_date),
    closingDay
  )

  const { error: instError } = await supabase
    .from('installments')
    .insert(installments)

  if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}