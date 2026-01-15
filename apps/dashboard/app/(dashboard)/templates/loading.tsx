import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TemplatesLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Templates grid skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2">
                {[...Array(2)].map((_, j) => (
                  <Skeleton key={j} className="h-6 w-20 rounded-full" />
                ))}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
