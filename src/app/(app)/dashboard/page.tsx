import { Suspense } from 'react'
import { SummaryCards, SummaryCardsSkeleton } from '@/components/dashboard/SummaryCards'
import { CategoryBreakdown, CategoryBreakdownSkeleton } from '@/components/dashboard/CategoryBreakdown'
import { UpcomingRecurring, UpcomingRecurringSkeleton } from '@/components/dashboard/UpcomingRecurring'
import { RecentTransactions, RecentTransactionsSkeleton } from '@/components/dashboard/RecentTransactions'
import { MonthlySummary, MonthlySummarySkeleton } from '@/components/dashboard/MonthlySummary'
import { getCategoryBreakdownData } from '@/components/dashboard/queries'

async function CategoryBreakdownWrapper() {
  const data = await getCategoryBreakdownData()
  return <CategoryBreakdown data={data} />
}

export const revalidate = 3600

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Acompanhe sua vida financeira</p>
      </div>

      {/* Summary Cards */}
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards />
      </Suspense>

      {/* Middle row: Category Breakdown (2/3) + Upcoming Recurring (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Suspense fallback={<CategoryBreakdownSkeleton />}>
            <CategoryBreakdownWrapper />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<UpcomingRecurringSkeleton />}>
            <UpcomingRecurring />
          </Suspense>
        </div>
      </div>

      {/* Bottom row: Recent Transactions (2/3) + Monthly Summary (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Suspense fallback={<RecentTransactionsSkeleton />}>
            <RecentTransactions />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<MonthlySummarySkeleton />}>
            <MonthlySummary />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
