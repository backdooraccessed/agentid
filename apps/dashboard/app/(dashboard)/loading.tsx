import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
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
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two column layout skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
