import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { transactionUpdateSchema } from '@/lib/validations'
import { generateInstallments } from '@/lib/installments'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body   = await request.json()
  const parsed = transactionUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // 0. Fetch transação atual
  const { data: currentTx, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !currentTx) {
    return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  }

  // Determinar se precisa regenerar parcelas
  const needsRegenerate =
    parsed.data.total_amount !== undefined ||
    parsed.data.installments_count !== undefined ||
    parsed.data.purchase_date !== undefined ||
    parsed.data.type !== undefined ||
    parsed.data.card_id !== undefined ||
    parsed.data.status !== undefined

  const resolvedStatus = parsed.data.status ?? currentTx.status
  const resolvedScheduledFor =
    parsed.data.scheduled_for !== undefined
      ? parsed.data.scheduled_for
      : currentTx.scheduled_for
  const nowIso = new Date().toISOString()

  // 1. Preparar dados para update (pegar valores atuais se não fornecidos)
  const updateData = {
    description: parsed.data.description ?? currentTx.description,
    total_amount: parsed.data.total_amount ?? currentTx.total_amount,
    installments_count: parsed.data.installments_count ?? currentTx.installments_count,
    purchase_date: parsed.data.purchase_date ?? currentTx.purchase_date,
    type: parsed.data.type ?? currentTx.type,
    status: resolvedStatus,
    scheduled_for: resolvedStatus === 'scheduled' ? resolvedScheduledFor : null,
    posted_at:
      resolvedStatus === 'posted'
        ? currentTx.posted_at ?? nowIso
        : currentTx.posted_at,
    cancelled_at:
      resolvedStatus === 'cancelled'
        ? currentTx.cancelled_at ?? nowIso
        : currentTx.cancelled_at,
    schedule_source: parsed.data.schedule_source ?? currentTx.schedule_source ?? 'manual',
    card_id: parsed.data.card_id !== undefined ? parsed.data.card_id : currentTx.card_id,
    category_id: parsed.data.category_id !== undefined ? parsed.data.category_id : currentTx.category_id,
    person_id: parsed.data.person_id !== undefined ? parsed.data.person_id : currentTx.person_id,
    notes: parsed.data.notes !== undefined ? parsed.data.notes : currentTx.notes,
  }

  // 2. Atualiza a transação
  const { error: txError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  // 3. Regenerar parcelas apenas se necessário
  if (resolvedStatus === 'posted' && needsRegenerate) {
    // Fetch parcelas antigas para preservar status paid
    const { data: oldInstallments } = await supabase
      .from('installments')
      .select('number, paid')
      .eq('transaction_id', params.id)

    const oldPaidNumbers = (oldInstallments ?? [])
      .filter(i => i.paid)
      .map(i => i.number)

    // Delete antigas
    const { error: delError } = await supabase
      .from('installments')
      .delete()
      .eq('transaction_id', params.id)

    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

    // Busca o closing_day do cartão (se fornecido ou usar cartão atual)
    let closingDay = 1
    const cardId = updateData.card_id
    if (cardId) {
      const { data: card } = await supabase
        .from('cards')
        .select('closing_day')
        .eq('id', cardId)
        .single()
      if (card) closingDay = card.closing_day
    }

    // Gera novas parcelas preservando paid status
    const newInstallments = generateInstallments(
      params.id,
      updateData.total_amount,
      updateData.type === 'credit' ? updateData.installments_count : 1,
      new Date(updateData.purchase_date),
      closingDay
    )

    // Marca como paid se era pago antes (match by number)
    const installmentsWithPaid = newInstallments.map(i => ({
      ...i,
      paid: oldPaidNumbers.includes(i.number),
    }))

    const { error: instError } = await supabase
      .from('installments')
      .insert(installmentsWithPaid)

    if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })
  } else if (resolvedStatus !== 'posted') {
    // Agendado ou cancelado não deve manter parcelas ativas
    const { error: delError } = await supabase
      .from('installments')
      .delete()
      .eq('transaction_id', params.id)

    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
  }

  revalidatePath('/invoices')
  return NextResponse.json({ success: true })
}