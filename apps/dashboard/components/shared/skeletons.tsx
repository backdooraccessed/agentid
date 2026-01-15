'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Stat Card Skeleton
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// Credential Card Skeleton
export function CredentialCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-white/10" />
      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Activity Item Skeleton
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// Dashboard Page Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner Skeleton */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Credentials Page Skeleton
export function CredentialsPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CredentialCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Settings Page Skeleton
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Issuer Card Skeleton (for Directory)
export function IssuerCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-7 w-12 ml-auto" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
