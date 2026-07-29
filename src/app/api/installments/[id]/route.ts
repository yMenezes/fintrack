import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { installmentUpdateSchema } from '@/lib/validations'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = installmentUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Verifica se a parcela pertence ao usuário via join
  const { data: installment } = await supabase
    .from('installments')
    .select('id, transactions!inner( user_id )')
    .eq('id', params.id)
    .eq('transactions.user_id', user.id)
    .single()

  if (!installment) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.paid !== undefined) {
    updateData.paid = parsed.data.paid
    updateData.paid_at = parsed.data.paid ? new Date().toISOString() : null
  }
  if (parsed.data.reimbursed !== undefined) {
    updateData.reimbursed = parsed.data.reimbursed
    updateData.reimbursed_at = parsed.data.reimbursed ? new Date().toISOString() : null
  }

  const { error } = await supabase
    .from('installments')
    .update(updateData)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/invoices')
  revalidatePath('/people/[id]', 'layout')
  return NextResponse.json({ success: true })
}