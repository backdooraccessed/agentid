import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SettingsLoading() {
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

      {/* Profile card skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
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
        </CardContent>
      </Card>

      {/* Domain verification skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Danger zone skeleton */}
      <Card className="overflow-hidden border-red-500/20">
        <CardHeader className="bg-red-500/5 border-b border-red-500/10">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-2/3 mb-4" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
