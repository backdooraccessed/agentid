import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function VerificationsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent verifications skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
