import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { transactionPaySchema } from '@/lib/validations'
import { generateInstallments } from '@/lib/installments'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = transactionPaySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { paid } = parsed.data

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !transaction) {
    return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
  }

  if (transaction.status === 'cancelled') {
    return NextResponse.json({ error: 'Transação cancelada não pode ser marcada como paga' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()

  if (transaction.status === 'scheduled') {
    if (!paid) {
      return NextResponse.json({ error: 'Nada a desmarcar em uma transação agendada' }, { status: 400 })
    }

    let closingDay = 1
    if (transaction.card_id) {
      const { data: card } = await supabase
        .from('cards')
        .select('closing_day')
        .eq('id', transaction.card_id)
        .single()
      if (card) closingDay = card.closing_day
    }

    const installmentsCount = transaction.type === 'credit' ? transaction.installments_count : 1
    const purchaseDate = new Date(transaction.scheduled_for ?? transaction.purchase_date)

    const installments = generateInstallments(
      transaction.id,
      transaction.total_amount,
      installmentsCount,
      purchaseDate,
      closingDay,
    ).map((installment) => ({ ...installment, paid: true, paid_at: nowIso }))

    const { error: instError } = await supabase.from('installments').insert(installments)
    if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })

    const { data: updatedTx, error: txError } = await supabase
      .from('transactions')
      .update({ status: 'posted', posted_at: nowIso, updated_at: nowIso })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    revalidatePath('/invoices')
    revalidatePath('/contas')
    revalidatePath('/dashboard')

    return NextResponse.json({ transaction: updatedTx, installments })
  }

  // status === 'posted'
  const { data: updatedInstallments, error: instError } = await supabase
    .from('installments')
    .update({ paid, paid_at: paid ? nowIso : null })
    .eq('transaction_id', params.id)
    .select()

  if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })

  revalidatePath('/invoices')
  revalidatePath('/contas')
  revalidatePath('/dashboard')

  return NextResponse.json({ transaction, installments: updatedInstallments ?? [] })
}
