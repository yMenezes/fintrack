import { Suspense } from 'react'
import { SummaryCards, SummaryCardsSkeleton } from '@/components/dashboard/SummaryCards'
import { CashFlowChart, CashFlowChartSkeleton } from '@/components/dashboard/CashFlowChart'
import { CategoryBreakdown, CategoryBreakdownSkeleton } from '@/components/dashboard/CategoryBreakdown'
import { UpcomingRecurring, UpcomingRecurringSkeleton } from '@/components/dashboard/UpcomingRecurring'
import { RecentTransactions, RecentTransactionsSkeleton } from '@/components/dashboard/RecentTransactions'
import { MonthlySummary, MonthlySummarySkeleton } from '@/components/dashboard/MonthlySummary'
import { BillsSummaryCard, BillsSummaryCardSkeleton } from '@/components/dashboard/BillsSummaryCard'
import { getCategoryBreakdownData, getCashFlowHistory } from '@/components/dashboard/queries'
import { PeriodNavigator } from '@/components/ui/period-navigator'

async function CategoryBreakdownWrapper({ month, year }: { month?: string; year?: string }) {
  const baseDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : undefined
  const data = await getCategoryBreakdownData(baseDate)
  return <CategoryBreakdown data={data} baseDate={baseDate} />
}

async function CashFlowChartWrapper({ month, year }: { month?: string; year?: string }) {
  const baseDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : undefined
  const data = await getCashFlowHistory(baseDate)
  return <CashFlowChart data={data} />
}

export const revalidate = 3600

export default function DashboardPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const rawMonth = typeof searchParams?.month === 'string' ? searchParams.month : undefined
  const rawYear = typeof searchParams?.year === 'string' ? searchParams.year : undefined
  const periodType = typeof searchParams?.period_type === 'string' ? searchParams.period_type : 'monthly'
  const quarter = typeof searchParams?.quarter === 'string' ? Number(searchParams.quarter) : undefined
  const dateFrom = typeof searchParams?.date_from === 'string' ? searchParams.date_from : undefined
  const dateTo = typeof searchParams?.date_to === 'string' ? searchParams.date_to : undefined

  // Derive effective month/year from period_type (monthly/quarterly/annual/custom)
  let month = rawMonth
  let year = rawYear

  if (periodType === 'quarterly') {
    // if quarter provided, compute start month; otherwise fall back to rawMonth
    if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1
      month = String(startMonth).padStart(2, '0')
      year = rawYear ?? String(new Date().getFullYear())
    }
  } else if (periodType === 'annual') {
    year = rawYear ?? String(new Date().getFullYear())
    month = '01'
  } else if (periodType === 'custom') {
    if (dateFrom) {
      const [fromYear, fromMonth] = dateFrom.split('-')
      month = fromMonth
      year = fromYear
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Acompanhe sua vida financeira</p>
          </div>
          <div>
            <PeriodNavigator />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards month={month} year={year} />
      </Suspense>

      {/* Row: Category Breakdown (2/3) + Contas (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Suspense fallback={<CategoryBreakdownSkeleton />}>
            <CategoryBreakdownWrapper month={month} year={year} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<BillsSummaryCardSkeleton />}>
            <BillsSummaryCard month={month} year={year} />
          </Suspense>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <Suspense fallback={<CashFlowChartSkeleton />}>
        <CashFlowChartWrapper month={month} year={year} />
      </Suspense>

      {/* Bottom row: Recent Transactions + Monthly Summary + Upcoming Recurring (1/3 each) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Suspense fallback={<RecentTransactionsSkeleton />}>
          <RecentTransactions month={month} year={year} />
        </Suspense>
        <Suspense fallback={<MonthlySummarySkeleton />}>
          <MonthlySummary month={month} year={year} />
        </Suspense>
        <Suspense fallback={<UpcomingRecurringSkeleton />}>
          <UpcomingRecurring month={month} year={year} />
        </Suspense>
      </div>
    </div>
  )
}
