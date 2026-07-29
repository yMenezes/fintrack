import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { incomeCreateSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = incomeCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { status, scheduled_for, ...rest } = parsed.data
  const resolvedStatus = status ?? 'received'
  const resolvedScheduledFor = resolvedStatus === 'scheduled' ? (scheduled_for ?? rest.date) : null
  const resolvedReceivedAt = resolvedStatus === 'received' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('income')
    .insert({
      ...rest,
      user_id: user.id,
      status: resolvedStatus,
      scheduled_for: resolvedScheduledFor,
      received_at: resolvedReceivedAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/transactions')
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodType  = searchParams.get('period_type') ?? 'monthly'
  const month       = searchParams.get('month')
  const year        = searchParams.get('year')
  const quarter     = searchParams.get('quarter')
  const dateFrom    = searchParams.get('date_from')
  const dateTo      = searchParams.get('date_to')
  const source      = searchParams.get('source')
  const categoryId  = searchParams.get('category_id')
  const personId    = searchParams.get('person_id')
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit       = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10')))
  const offset      = (page - 1) * limit

  // Determinar date range baseado no period_type
  let dateRangeFrom = dateFrom
  let dateRangeTo = dateTo

  if (!dateRangeFrom || !dateRangeTo) {
    const now = new Date()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1
    const currentYear = year ? parseInt(year) : now.getFullYear()

    switch (periodType) {
      case 'monthly':
        dateRangeFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
        break

      case 'quarterly': {
        const q = quarter ? parseInt(quarter) : Math.ceil(currentMonth / 3)
        const startMonth = (q - 1) * 3 + 1
        const endMonth = q * 3
        dateRangeFrom = `${currentYear}-${String(startMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, endMonth, 0).toISOString().split('T')[0]
        break
      }

      case 'annual':
        dateRangeFrom = `${currentYear}-01-01`
        dateRangeTo = `${currentYear}-12-31`
        break

      default:
        dateRangeFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
    }
  }

  let countQuery = supabase
    .from('income')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', dateRangeFrom)
    .lte('date', dateRangeTo)

  let dataQuery = supabase
    .from('income')
    .select(`
      id, description, amount, date, source, status, scheduled_for, received_at, notes,
      category_id, person_id,
      categories ( id, name, icon, color ),
      people     ( id, name )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', dateRangeFrom)
    .lte('date', dateRangeTo)
    .order('date', { ascending: false })

  if (source)     { countQuery = countQuery.eq('source', source);           dataQuery = dataQuery.eq('source', source) }
  if (categoryId) { countQuery = countQuery.eq('category_id', categoryId);  dataQuery = dataQuery.eq('category_id', categoryId) }
  if (personId)   { countQuery = countQuery.eq('person_id', personId);      dataQuery = dataQuery.eq('person_id', personId) }

  const { count: total } = await countQuery
  const { data, error }  = await dataQuery.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalCount = total ?? 0

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore: (page * limit) < totalCount,
    },
  })
}
