import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AuditLogsLoading() {
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

      {/* Filter bar skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Audit logs list skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
