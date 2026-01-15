import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
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
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Two column layout skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-36" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-36" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
