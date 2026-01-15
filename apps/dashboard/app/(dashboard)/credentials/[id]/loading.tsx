import { Skeleton } from '@/components/ui/skeleton';

export default function CredentialDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 border-4 border-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
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

      {/* Details cards skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border-4 border-black bg-white">
          <div className="bg-gray-50 border-b-4 border-black p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 border-2 border-gray-200" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
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
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity skeleton */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 border-2 border-gray-200" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
