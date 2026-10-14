'use client';

import React, { useState } from 'react';
import { CacheOperationResult, WorkloadPreset } from '../lib/types';
import { WORKLOAD_PRESETS } from '../lib/presets';
import { formatHexHash } from '../lib/hashAlgorithms';
import { Play, Database, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface OperationsProps {
  onGet: (key: string) => CacheOperationResult;
  onSet: (key: string, value: string) => CacheOperationResult;
  onDelete: (key: string) => CacheOperationResult;
  onPreset: (preset: WorkloadPreset) => void;
  lastOp?: CacheOperationResult;
  history: CacheOperationResult[];
  onShowTrace: (op: CacheOperationResult) => void;
}

type Method = 'GET' | 'PUT' | 'DELETE' | 'PRESET';

export const OperationsPanel: React.FC<OperationsProps> = ({
  onGet,
  onSet,
  onDelete,
  onPreset,
  lastOp,
  history,
  onShowTrace,
}) => {
  const [method, setMethod] = useState<Method>('GET');
  const [key, setKey] = useState('prod:macbook_pro_m3');
  const [value, setValue] = useState('{"name":"MacBook Pro M3","price":1999,"stock":14}');

  const sampleKeys = [
    'prod:macbook_pro_m3',
    'cart:session_4812',
    'user:session_9901',
    'flash_sale:deal_99',
  ];

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    let res: CacheOperationResult;
    if (method === 'GET') {
      res = onGet(key.trim());
    } else if (method === 'PUT') {
      res = onSet(key.trim(), value.trim());
    } else {
      res = onDelete(key.trim());
    }
    onShowTrace(res);
  };

  const getStatusBadge = (status: string) => {
    if (status.includes('HIT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          200 OK • Cache Hit
        </span>
      );
    }
    if (status === 'MISS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle size={12} />
          404 Not Found • Cache Miss
        </span>
      );
    }
    if (status === 'SET_OK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 size={12} />
          201 Created • Item Stored
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        200 OK • Item Deleted
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Command Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Method Selector Tabs - Clean, Modern Sans-Serif Buttons */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-100 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setMethod('GET')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                method === 'GET'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              GET
            </button>
            <button
              type="button"
              onClick={() => setMethod('PUT')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                method === 'PUT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              PUT
            </button>
            <button
              type="button"
              onClick={() => setMethod('DELETE')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                method === 'DELETE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              DELETE
            </button>
            <button
              type="button"
              onClick={() => setMethod('PRESET')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                method === 'PRESET'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Load Workload
            </button>
          </div>

          <div className="p-6">
            {method === 'PRESET' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 mb-2 font-medium">
                  Select a production workload dataset to test cluster key distribution:
                </p>
                {WORKLOAD_PRESETS.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{preset.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {preset.sampleKeys.length} items • {preset.description}
                      </div>
                    </div>
                    <button
                      onClick={() => onPreset(preset)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                    >
                      Load Dataset
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleExecute} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Key Identifier
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Quick picks:</span>
                      {sampleKeys.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setKey(k)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer transition-colors"
                        >
                          {k.split(':')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. user:session_101"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>

                {method === 'PUT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                      Payload (JSON / String)
                    </label>
                    <textarea
                      rows={4}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-all"
                  >
                    <Play size={13} />
                    Execute {method} Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Real-Time Response Inspector */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Response Inspector
            </span>
            {lastOp && getStatusBadge(lastOp.status)}
          </div>

          {lastOp ? (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Target Node:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {lastOp.primaryNode?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Execution Latency:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {lastOp.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">32-Bit Hash:</span>
                  <span className="font-semibold text-slate-900 font-mono mt-0.5 block">
                    {formatHexHash(lastOp.keyHash)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Ring Angle:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {lastOp.angle.toFixed(1)}°
                  </span>
                </div>
              </div>

              {lastOp.value && (
                <div>
                  <span className="text-slate-600 font-semibold text-xs block mb-1.5">
                    Payload Content:
                  </span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-xs overflow-x-auto leading-relaxed border border-slate-800">
                    {lastOp.value}
                  </pre>
                </div>
              )}

              <button
                onClick={() => onShowTrace(lastOp)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Inspect Routing Trace
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400 text-xs font-medium">
              Execute a GET, PUT, or DELETE request to view live routing metrics.
            </div>
          )}
        </div>
      </div>

      {/* Execution Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Request Execution History
          </span>
          <span className="text-xs font-medium text-slate-500">
            {history.length} logged queries
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            No queries executed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">Key</th>
                  <th className="py-3 px-5">Target Node</th>
                  <th className="py-3 px-5">Hash</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {history.slice(0, 10).map((op, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onShowTrace(op)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-5 font-bold text-slate-900">{op.operation}</td>
                    <td className="py-3 px-5 font-medium text-slate-800">{op.key}</td>
                    <td className="py-3 px-5 font-medium text-slate-600">{op.primaryNode?.name}</td>
                    <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                      {formatHexHash(op.keyHash)}
                    </td>
                    <td className="py-3 px-5">{getStatusBadge(op.status)}</td>
                    <td className="py-3 px-5 text-right font-semibold text-slate-700">
                      {op.latencyMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
