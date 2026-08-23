import React from 'react';
import { cn } from '../../utils/formatters';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-800/60 border border-white/5', className)}
      {...props}
    />
  );
}

export function MeetingCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function MeetingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 lg:col-span-2 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function StatsWidgetSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

export default Skeleton;
