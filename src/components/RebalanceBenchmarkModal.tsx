'use client';

import React, { useState } from 'react';
import { PhysicalNode } from '../lib/types';
import { runComparativeBenchmark, BenchmarkRunResult } from '../lib/benchmark';
import confetti from 'canvas-confetti';
import {
  BarChart2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  TrendingDown,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RebalanceBenchmarkViewProps {
  nodes: PhysicalNode[];
}

export const RebalanceBenchmarkView: React.FC<RebalanceBenchmarkViewProps> = ({ nodes }) => {
  const [action, setAction] = useState<'ADD_NODE' | 'REMOVE_NODE'>('ADD_NODE');
  const [keyCount, setKeyCount] = useState<number>(200);
  const [vnodes, setVnodes] = useState<number>(5);
  const [result, setResult] = useState<BenchmarkRunResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  React.useEffect(() => {
    setResult(runComparativeBenchmark(nodes, 'ADD_NODE', 200, 5));
  }, []);

  const handleRunBenchmark = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = runComparativeBenchmark(nodes, action, keyCount, vnodes);
      setResult(res);
      setIsSimulating(false);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#059669', '#f59e0b'],
        });
      } catch (err) {
        // ignore
      }
    }, 400);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Empirical Rebalancing & Key Churn Benchmark
            </h2>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Consistent Hashing vs Naive Modulo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare data migration and cache invalidation rates during dynamic cluster resizing (N → N±1).
          </p>
        </div>

        {/* Benchmark Control Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setAction('ADD_NODE')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${
                action === 'ADD_NODE'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale Up (N+1)
            </button>
            <button
              onClick={() => setAction('REMOVE_NODE')}
              className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${
                action === 'REMOVE_NODE'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale Down (N-1)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Keys:</span>
            <select
              value={keyCount}
              onChange={(e) => setKeyCount(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-800 text-xs"
            >
              <option value="50">50 Keys</option>
              <option value="100">100 Keys</option>
              <option value="200">200 Keys</option>
              <option value="500">500 Keys</option>
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isSimulating}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            {isSimulating ? (
              <span className="animate-spin">⚙</span>
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run Benchmark
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Key Findings Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consistent Hashing Card */}
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/90 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    CH
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Consistent Hashing</h3>
                    <span className="text-[10px] text-emerald-800 font-semibold">
                      Ring-based Virtual Successor
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ High Cache Retention
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-slate-500 text-[11px] block">Keys Migrated (Churn)</span>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    {result.consistentMovedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {result.consistentMovedCount} of {result.keyCount} keys
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-slate-500 text-[11px] block">Keys Preserved (Retained)</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {result.consistentRetainedPercent}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ~1/(N+1) theoretical
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
                  <span>Cache Hit Continuity</span>
                  <span>{result.consistentRetainedPercent}% intact</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.consistentRetainedPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Naive Modulo Card */}
            <div className="bg-rose-50/50 rounded-2xl border border-rose-200/90 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    %N
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Naive Modulo Hashing</h3>
                    <span className="text-[10px] text-rose-800 font-semibold font-mono">
                      server = hash(k) % N
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-full border border-rose-200">
                  ⚠ Catastrophic Avalanche
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-500 text-[11px] block">Keys Migrated (Churn)</span>
                  <div className="text-2xl font-black text-rose-600 mt-0.5">
                    {result.moduloMovedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {result.moduloMovedCount} of {result.keyCount} keys
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-500 text-[11px] block">Keys Preserved (Retained)</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {result.moduloRetainedPercent}%
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    ~N/(N+1) invalidation
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
                  <span>Cache Hit Continuity</span>
                  <span>{result.moduloRetainedPercent}% intact</span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.moduloRetainedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Lesson Box */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <strong className="text-indigo-900 font-bold block text-sm">
                The Consistent Hashing Breakthrough:
              </strong>
              <p className="leading-relaxed">
                In naive modulo hashing (<code>hash % N</code>), changing the number of nodes shifts every denominator, forcing{' '}
                <strong className="text-rose-700">{result.moduloMovedPercent}%</strong> of all cached data to remap to wrong servers. This creates a massive{' '}
                <em>Cache Stampede / DB Avalanche</em> where backend databases collapse under load. Consistent Hashing limits remaps strictly to{' '}
                <strong className="text-emerald-700">{result.consistentMovedPercent}%</strong>, isolating data movement solely to the new node's adjacent interval on the ring.
              </p>
            </div>
          </div>

          {/* Sample Keys Detailed Diff Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sample Keys Migration Audit (First 25 Keys)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Test Key</th>
                    <th className="py-2.5 px-3">CH Initial Node</th>
                    <th className="py-2.5 px-3">CH New Node</th>
                    <th className="py-2.5 px-3 text-center">Consistent Hashing Status</th>
                    <th className="py-2.5 px-3">Modulo Initial</th>
                    <th className="py-2.5 px-3">Modulo New</th>
                    <th className="py-2.5 px-3 text-center">Naive Modulo Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.keySamples.map((sample, idx) => (
                    <tr
                      key={idx}
                      className={
                        sample.consistentMoved
                          ? 'bg-amber-50/30'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/40'
                      }
                    >
                      <td className="py-2 px-3 font-mono font-medium text-slate-900">
                        {sample.key}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {sample.consistentInitialNode}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {sample.consistentNewNode}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sample.consistentMoved ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            Moved to New Node
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            ✓ Unchanged
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        Server #{sample.moduloInitialNode}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        Server #{sample.moduloNewNode}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sample.moduloMoved ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                            ⚠ Invalidated / Churned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            ✓ Unchanged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
