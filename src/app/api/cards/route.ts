import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const cardSchema = z.object({
  name:         z.string().min(1, 'Nome obrigatório'),
  brand:        z.string().optional(),
  closing_day:  z.number().int().min(1).max(31),
  due_day:      z.number().int().min(1).max(31),
  limit_amount: z.number().positive().optional().nullable(),
  color:        z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = cardSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { error, data } = await supabase
    .from('cards')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('cards')
    .select('id, name, closing_day')
    .is('deleted_at', null)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}