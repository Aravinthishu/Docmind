import Skeleton from '../ui/Skeleton'

export default function DocumentRowSkeleton() {
  return (
    <div className="flex items-center justify-between bg-forest-900/60 border border-forest-700 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-[18px] h-[18px] rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/5" />
        </div>
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}