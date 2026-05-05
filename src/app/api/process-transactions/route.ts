import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { generateInstallments } from '@/lib/installments'

// Avança um mês mantendo o dia correto (clampado ao último dia do mês destino)
function advanceByOneMonth(dateStr: string, dayOfMonth: number): string {
  const [yearStr, monthStr] = dateStr.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr) // 1-12

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // new Date(nextYear, nextMonth, 0) → último dia do mês nextMonth (1-indexed) graças ao dia 0
  const lastDay = new Date(nextYear, nextMonth, 0).getDate()
  const clampedDay = Math.min(dayOfMonth, lastDay)

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  let recurringProcessed = 0
  let scheduledProcessed = 0

  // ─── 1. Processar recorrências vencidas ──────────────────────────────────
  const { data: recurringList } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .lte('next_run_date', today)
    .is('deleted_at', null)

  for (const rt of (recurringList ?? [])) {
    let closingDay = 1
    if (rt.card_id) {
      const { data: card } = await supabase
        .from('cards')
        .select('closing_day')
        .eq('id', rt.card_id)
        .single()
      if (card) closingDay = card.closing_day
    }

    let currentDate = rt.next_run_date
    let lastProcessed: string | null = rt.last_run_date

    // Gera uma transaction para cada mês que ficou em atraso
    while (currentDate <= today) {
      if (rt.end_date && currentDate > rt.end_date) break

      // Proteção anti-duplicata: chave exata por UUID do recorrente + data
      const { count: existing } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('recurring_transaction_id', rt.id)
        .eq('purchase_date', currentDate)
        .is('deleted_at', null)

      if ((existing ?? 0) > 0) {
        currentDate = advanceByOneMonth(currentDate, rt.day_of_month)
        continue
      }

      const installmentsCount = rt.type === 'credit' ? (rt.installments_count ?? 1) : 1

      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          description: rt.description,
          total_amount: rt.total_amount,
          installments_count: installmentsCount,
          purchase_date: currentDate,
          type: rt.type,
          status: 'posted',
          posted_at: now,
          scheduled_for: null,
          cancelled_at: null,
          schedule_source: 'recurring',
          recurring_transaction_id: rt.id,
          card_id: rt.card_id,
          category_id: rt.category_id,
          person_id: rt.person_id,
          notes: rt.notes,
        })
        .select()
        .single()

      if (tx) {
        const installments = generateInstallments(
          tx.id,
          rt.total_amount,
          installmentsCount,
          new Date(currentDate),
          closingDay,
        )
        const { error: instError } = await supabase.from('installments').insert(installments)
        if (instError) {
          // Rollback: remove a transaction para não deixar órfã sem parcelas
          await supabase.from('transactions').delete().eq('id', tx.id)
        } else {
          lastProcessed = currentDate
          recurringProcessed++
        }
      }

      currentDate = advanceByOneMonth(currentDate, rt.day_of_month)
    }

    // Atualiza a recorrência com a próxima data futura
    const shouldDeactivate = !!(rt.end_date && currentDate > rt.end_date)

    await supabase
      .from('recurring_transactions')
      .update({
        last_run_date: lastProcessed,
        next_run_date: currentDate,
        active: shouldDeactivate ? false : rt.active,
        updated_at: now,
      })
      .eq('id', rt.id)
      .eq('user_id', user.id)
  }

  // ─── 2. Publicar transações agendadas cuja data chegou ──────────────────
  const { data: scheduledList } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .lte('scheduled_for', today)
    .is('deleted_at', null)

  for (const tx of (scheduledList ?? [])) {
    // Proteção anti-duplicata: parcelas já existem → outro request já processou
    const { count: existingInstallments } = await supabase
      .from('installments')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_id', tx.id)

    if ((existingInstallments ?? 0) > 0) {
      // Parcelas existem mas status pode ainda estar 'scheduled' (crash em execução anterior)
      await supabase
        .from('transactions')
        .update({ status: 'posted', posted_at: now, updated_at: now })
        .eq('id', tx.id)
        .eq('user_id', user.id)
        .eq('status', 'scheduled') // no-op se já estiver posted
      continue
    }

    let closingDay = 1
    if (tx.card_id) {
      const { data: card } = await supabase
        .from('cards')
        .select('closing_day')
        .eq('id', tx.card_id)
        .single()
      if (card) closingDay = card.closing_day
    }

    const installmentsCount = tx.type === 'credit' ? tx.installments_count : 1
    const purchaseDate = new Date(tx.scheduled_for ?? tx.purchase_date)

    const installments = generateInstallments(
      tx.id,
      tx.total_amount,
      installmentsCount,
      purchaseDate,
      closingDay,
    )
    const { error: instError } = await supabase.from('installments').insert(installments)
    if (instError) continue // mantém status 'scheduled' para tentar novamente depois

    await supabase
      .from('transactions')
      .update({
        status: 'posted',
        posted_at: now,
        updated_at: now,
      })
      .eq('id', tx.id)
      .eq('user_id', user.id)

    scheduledProcessed++
  }

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/recurring')

  return NextResponse.json({ recurringProcessed, scheduledProcessed })
}
