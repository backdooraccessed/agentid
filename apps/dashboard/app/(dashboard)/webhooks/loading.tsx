import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function WebhooksLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Webhooks list skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-6 w-24 rounded-full" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
