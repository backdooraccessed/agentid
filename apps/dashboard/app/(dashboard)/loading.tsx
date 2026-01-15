import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
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
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="p-4">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 border-2 border-gray-200" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-2 border-gray-200">
                <Skeleton className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 border-2 border-gray-200" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-2 border-gray-200">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
