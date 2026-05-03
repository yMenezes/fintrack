import { Suspense } from 'react'
import { SummaryCards, SummaryCardsSkeleton } from '@/components/dashboard/SummaryCards'
import { CategoryBreakdown, CategoryBreakdownSkeleton } from '@/components/dashboard/CategoryBreakdown'
import { SpendingTrend, SpendingTrendSkeleton } from '@/components/dashboard/SpendingTrend'
import { MonthComparison, MonthComparisonSkeleton } from '@/components/dashboard/MonthComparison'
import { TopCategories, TopCategoriesSkeleton } from '@/components/dashboard/TopCategories'
import { getCategoryBreakdownData, getSpendingTrendData, getMonthComparisonData } from '@/components/dashboard/queries'

// Server component wrapper for CategoryBreakdown
async function CategoryBreakdownWrapper() {
  const data = await getCategoryBreakdownData()
  return <CategoryBreakdown data={data} />
}

// Server component wrapper for SpendingTrend
async function SpendingTrendWrapper() {
  const data = await getSpendingTrendData()
  return <SpendingTrend data={data} />
}

// Server component wrapper for MonthComparison
async function MonthComparisonWrapper() {
  const data = await getMonthComparisonData()
  return <MonthComparison data={data} />
}

export const revalidate = 3600 // 1 hour ISR caching

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral dos seus gastos</p>
      </div>

      {/* Summary Cards */}
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards />
      </Suspense>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Suspense fallback={<CategoryBreakdownSkeleton />}>
          <CategoryBreakdownWrapper />
        </Suspense>

        {/* Spending Trend */}
        <Suspense fallback={<SpendingTrendSkeleton />}>
          <SpendingTrendWrapper />
        </Suspense>
      </div>

      {/* Month Comparison */}
      <Suspense fallback={<MonthComparisonSkeleton />}>
        <MonthComparisonWrapper />
      </Suspense>

      {/* Top Categories */}
      <Suspense fallback={<TopCategoriesSkeleton />}>
        <TopCategories />
      </Suspense>
    </div>
  )
}
