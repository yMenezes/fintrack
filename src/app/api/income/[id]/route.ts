import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { incomeUpdateSchema } from '@/lib/validations'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = incomeUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data: currentIncome, error: fetchError } = await supabase
    .from('income')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !currentIncome) {
    return NextResponse.json({ error: 'Entrada não encontrada' }, { status: 404 })
  }

  const resolvedStatus = parsed.data.status ?? currentIncome.status
  const resolvedScheduledFor =
    parsed.data.scheduled_for !== undefined
      ? parsed.data.scheduled_for
      : currentIncome.scheduled_for
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from('income')
    .update({
      ...parsed.data,
      status: resolvedStatus,
      scheduled_for: resolvedStatus === 'scheduled' ? resolvedScheduledFor : null,
      received_at: resolvedStatus === 'received' ? (currentIncome.received_at ?? nowIso) : null,
      updated_at: nowIso,
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/transactions')
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { error } = await supabase
    .from('income')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/transactions')
  return NextResponse.json({ success: true })
}
