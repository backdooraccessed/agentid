import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 border-4 border-gray-200" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Profile card skeleton */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 border-2 border-gray-200" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Domain verification skeleton */}
      <div className="border-4 border-black bg-white">
        <div className="bg-gray-50 border-b-4 border-black p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 border-2 border-gray-200" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Danger zone skeleton */}
      <div className="border-4 border-red-500 bg-white">
        <div className="bg-red-50 border-b-4 border-red-500 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 border-2 border-red-200" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-4 w-2/3 mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
