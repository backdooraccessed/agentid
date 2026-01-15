import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TeamLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Team members list skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
