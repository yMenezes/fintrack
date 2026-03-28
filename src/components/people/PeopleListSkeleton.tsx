import { Skeleton } from '@/components/ui/skeleton'

export function PeopleListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          {/* Avatar */}
          <Skeleton className="h-9 w-9 rounded-full" />

          {/* Person details */}
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
