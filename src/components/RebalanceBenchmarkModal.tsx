'use client';

import React, { useState } from 'react';
import { PhysicalNode } from '../lib/types';
import { runComparativeBenchmark, BenchmarkRunResult } from '../lib/benchmark';
import {
  BarChart3,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Layers,
  FileSpreadsheet,
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
    }, 250);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Empirical Key Churn Benchmark: Consistent Hashing vs Naive Modulo
            </h2>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
              Cluster Resizing Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quantifies the exact key churn and cache invalidation rates during dynamic scaling events (N → N±1).
          </p>
        </div>

        {/* Benchmark Control Bar */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 font-medium">
            <button
              onClick={() => setAction('ADD_NODE')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                action === 'ADD_NODE'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale Up (N+1)
            </button>
            <button
              onClick={() => setAction('REMOVE_NODE')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                action === 'REMOVE_NODE'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale Down (N-1)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sample Keys:</span>
            <select
              value={keyCount}
              onChange={(e) => setKeyCount(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 font-mono font-semibold text-slate-800 text-xs focus:outline-none"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isSimulating}
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            {isSimulating ? (
              <span className="animate-spin font-mono">⟳</span>
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            Run Benchmark
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-5">
          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consistent Hashing */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                    CH
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Consistent Hashing</h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Algorithm: Karger et al. (1997)
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Stable Continuity
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
                  <span className="text-slate-400 text-[10px] block">Keys Migrated (Churn)</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                    {result.consistentMovedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.consistentMovedCount} of {result.keyCount} keys
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
                  <span className="text-slate-400 text-[10px] block">Cache Retention Rate</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                    {result.consistentRetainedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~1/(N+1) theoretical
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                  <span>Cache Intact</span>
                  <span>{result.consistentRetainedPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result.consistentRetainedPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Naive Modulo */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-xs font-mono">
                    %N
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Naive Modulo Hashing</h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      server = hash(key) % N
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Cache Stampede Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
                  <span className="text-slate-400 text-[10px] block">Keys Migrated (Churn)</span>
                  <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                    {result.moduloMovedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.moduloMovedCount} of {result.keyCount} keys
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
                  <span className="text-slate-400 text-[10px] block">Cache Retention Rate</span>
                  <div className="text-xl font-bold font-mono text-slate-600 mt-0.5">
                    {result.moduloRetainedPercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~N/(N+1) invalidated
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-mono">
                  <span>Cache Intact</span>
                  <span>{result.moduloRetainedPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result.moduloRetainedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theoretical Analysis Note */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
            <strong className="text-slate-800 block text-xs mb-0.5">
              Theoretical Implication:
            </strong>
            <p className="leading-relaxed text-[11px]">
              When scaling from N to N+1 nodes, naive modulo hashing invalidates{' '}
              <strong className="text-slate-900 font-mono">{result.moduloMovedPercent}%</strong> of all cached keys because the modulo base changes for every hash. Consistent hashing confines remaps strictly to{' '}
              <strong className="text-slate-900 font-mono">{result.consistentMovedPercent}%</strong> of the keyspace, preventing simultaneous database cache stampedes.
            </p>
          </div>

          {/* Audit Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data Migration Audit (Sample First 20 Keys)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">CH Initial</th>
                    <th className="py-2 px-3">CH New</th>
                    <th className="py-2 px-3 text-center">Consistent Hashing</th>
                    <th className="py-2 px-3">Modulo Initial</th>
                    <th className="py-2 px-3">Modulo New</th>
                    <th className="py-2 px-3 text-center">Naive Modulo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {result.keySamples.slice(0, 20).map((sample, idx) => (
                    <tr key={idx} className={sample.consistentMoved ? 'bg-amber-50/20' : 'bg-white'}>
                      <td className="py-1.5 px-3 font-medium text-slate-900">
                        {sample.key}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 font-sans">
                        {sample.consistentInitialNode}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 font-sans">
                        {sample.consistentNewNode}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {sample.consistentMoved ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Rebalanced
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Preserved
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500">
                        Node #{sample.moduloInitialNode}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500">
                        Node #{sample.moduloNewNode}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {sample.moduloMoved ? (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Invalidated
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Preserved
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
