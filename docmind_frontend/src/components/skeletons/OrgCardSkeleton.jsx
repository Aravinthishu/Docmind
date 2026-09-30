import Skeleton from '../ui/Skeleton'

export default function OrgCardSkeleton() {
  return (
    <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}