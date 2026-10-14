'use client';

import React, { useState } from 'react';
import { PhysicalNode } from '../lib/types';
import { runComparativeBenchmark, BenchmarkRunResult } from '../lib/benchmark';
import { Play, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BenchmarkProps {
  nodes: PhysicalNode[];
}

export const BenchmarkPanel: React.FC<BenchmarkProps> = ({ nodes }) => {
  const [action, setAction] = useState<'ADD_NODE' | 'REMOVE_NODE'>('ADD_NODE');
  const [keyCount, setKeyCount] = useState<number>(200);
  const [result, setResult] = useState<BenchmarkRunResult | null>(() =>
    runComparativeBenchmark(nodes, 'ADD_NODE', 200, 5)
  );

  const handleRun = () => {
    const res = runComparativeBenchmark(nodes, action, keyCount, 5);
    setResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Topology Rebalance Analysis
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluate key churn during cluster scaling: Consistent Hashing vs Traditional Modulo Hashing
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scale Action */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setAction('ADD_NODE')}
              className={`px-3 py-1.5 rounded-md font-bold cursor-pointer transition-colors ${
                action === 'ADD_NODE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale Out (+1 Node)
            </button>
            <button
              onClick={() => setAction('REMOVE_NODE')}
              className={`px-3 py-1.5 rounded-md font-bold cursor-pointer transition-colors ${
                action === 'REMOVE_NODE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scale In (-1 Node)
            </button>
          </div>

          {/* Dataset Size */}
          <select
            value={keyCount}
            onChange={(e) => setKeyCount(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value={100}>100 Keys</option>
            <option value={200}>200 Keys</option>
            <option value={500}>500 Keys</option>
            <option value={1000}>1,000 Keys</option>
          </select>

          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
          >
            <Play size={13} />
            Run Simulation
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* KPI Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Consistent Hashing KPI */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Consistent Hashing Churn
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OPTIMAL
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-600">
                  {result.consistentMovedPercent}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({result.consistentMovedCount} / {result.keyCount} keys moved)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Theoretical lower bound: ~{result.theoreticalConsistentPercent}% [1/(N+1)]
              </div>
            </div>

            {/* Modulo Hashing KPI */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Modulo Hashing Churn
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  MASS CHURN
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-rose-600">
                  {result.moduloMovedPercent}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({result.moduloMovedCount} / {result.keyCount} keys moved)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Theoretical expected churn: ~{result.theoreticalModuloPercent}% [N/(N+1)]
              </div>
            </div>

            {/* Preservation Delta */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cache Miss Avoidance
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  +{(result.moduloMovedPercent - result.consistentMovedPercent).toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500">keys preserved</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                Cluster transition: {result.initialNodeCount} → {result.newNodeCount} nodes
              </div>
            </div>
          </div>

          {/* Visual Migration Progress Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Key Migration Distribution
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-800 font-bold">Consistent Hashing (Ring Topology)</span>
                  <span className="text-emerald-600 font-bold">
                    {result.consistentRetainedPercent}% retained · {result.consistentMovedPercent}% moved
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-lg overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${result.consistentRetainedPercent}%` }}
                    title="Retained Keys"
                  />
                  <div
                    className="bg-slate-300 h-full transition-all duration-300"
                    style={{ width: `${result.consistentMovedPercent}%` }}
                    title="Reassigned Keys"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-800 font-bold">Modulo Hashing (hash % N)</span>
                  <span className="text-rose-600 font-bold">
                    {result.moduloRetainedPercent}% retained · {result.moduloMovedPercent}% moved
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-lg overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${result.moduloRetainedPercent}%` }}
                    title="Retained Keys"
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${result.moduloMovedPercent}%` }}
                    title="Reassigned Keys"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sample Key Audit Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Sample Key Audit (First 20 Keys)
              </span>
              <span className="text-slate-500 font-semibold">
                {result.keySamples.length} keys sampled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Key Identifier</th>
                    <th className="py-3 px-5">Consistent Hash Route</th>
                    <th className="py-3 px-5">Consistent Status</th>
                    <th className="py-3 px-5">Modulo Hash Route</th>
                    <th className="py-3 px-5 text-right">Modulo Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {result.keySamples.map((s) => (
                    <tr key={s.key} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-5 font-bold text-slate-900">{s.key}</td>
                      <td className="py-2.5 px-5 text-slate-700 font-medium">
                        {s.consistentInitialNode}{' '}
                        <span className="text-slate-400">→</span>{' '}
                        {s.consistentNewNode}
                      </td>
                      <td className="py-2.5 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.consistentMoved
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {s.consistentMoved ? 'MIGRATED' : 'RETAINED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-5 text-slate-700 font-medium">
                        Node #{s.moduloInitialNode}{' '}
                        <span className="text-slate-400">→</span>{' '}
                        Node #{s.moduloNewNode}
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.moduloMoved
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {s.moduloMoved ? 'MIGRATED' : 'RETAINED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
