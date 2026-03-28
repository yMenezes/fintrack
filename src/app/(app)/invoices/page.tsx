import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePage } from '@/components/invoices/InvoicePage'
import { InvoicePageSkeleton } from '@/components/invoices/InvoicePageSkeleton'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now   = new Date()
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year  = Number(searchParams.year  ?? now.getFullYear())

  const [installmentsRes, cardsRes] = await Promise.all([
    supabase
      .from('installments')
      .select(`
        id, number, amount, paid,
        transactions!inner (
          id, description, installments_count,
          purchase_date, type, card_id,
          cards      ( id, name, color, closing_day, due_day ),
          categories ( id, name, icon, color )
        )
      `)
      .eq('reference_month', month)
      .eq('reference_year',  year)
      .eq('transactions.user_id', user.id)
      .order('created_at', { ascending: true }),

    supabase
      .from('cards')
      .select('id, name, color')
      .is('deleted_at', null)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  return (
    <Suspense fallback={<InvoicePageSkeleton />}>
      <InvoicePage
        initialInstallments={(installmentsRes.data ?? []) as any}
        cards={cardsRes.data ?? []}
        month={month}
        year={year}
      />
    </Suspense>
  )
}