import Skeleton from '../ui/Skeleton'

export default function StatCardSkeleton() {
  return (
    <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
      <Skeleton className="w-8 h-8 rounded-lg mb-3" />
      <Skeleton className="h-6 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}