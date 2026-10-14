'use client';

import dynamic from 'next/dynamic';

const CacheRingApp = dynamic(() => import('../components/CacheRingApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
      <div className="flex flex-col items-center gap-3" suppressHydrationWarning>
        <div className="w-9 h-9 rounded-full border-2 border-neutral-200 border-t-blue-600 animate-spin" suppressHydrationWarning />
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase" suppressHydrationWarning>
          Loading Cluster Topology...
        </span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <CacheRingApp />;
}

