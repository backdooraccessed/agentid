import { Skeleton } from '@/components/ui/skeleton';

export default function VerificationsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 border-4 border-gray-200" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 border-2 border-gray-200" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="p-4">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent verifications skeleton */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 border-2 border-gray-200" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="w-10 h-10 border-2 border-gray-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-16 ml-auto" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
