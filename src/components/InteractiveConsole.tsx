'use client';

import React, { useState } from 'react';
import {
  CacheOperationResult,
  HashAlgorithm,
  WorkloadPreset,
} from '../lib/types';
import { WORKLOAD_PRESETS } from '../lib/presets';
import { formatHexHash } from '../lib/hashAlgorithms';
import {
  Terminal,
  Search,
  Plus,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  Sliders,
  CheckCircle2,
  Copy,
  Activity,
} from 'lucide-react';

interface InteractiveConsoleProps {
  onGet: (key: string) => CacheOperationResult;
  onSet: (key: string, value: string, ttl?: number) => CacheOperationResult;
  onDelete: (key: string) => CacheOperationResult;
  onPopulatePreset: (preset: WorkloadPreset) => void;
  lastOperation?: CacheOperationResult;
  operationHistory: CacheOperationResult[];
  replicationFactor: number;
  onReplicationFactorChange: (r: number) => void;
  hashAlgorithm: HashAlgorithm;
  onHashAlgorithmChange: (algo: HashAlgorithm) => void;
  onOpenStepTrace: (op: CacheOperationResult) => void;
}

export const InteractiveConsole: React.FC<InteractiveConsoleProps> = ({
  onGet,
  onSet,
  onDelete,
  onPopulatePreset,
  lastOperation,
  operationHistory,
  replicationFactor,
  onReplicationFactorChange,
  hashAlgorithm,
  onHashAlgorithmChange,
  onOpenStepTrace,
}) => {
  const [activeAction, setActiveAction] = useState<'GET' | 'SET' | 'DELETE' | 'PRESET'>('GET');
  const [keyInput, setKeyInput] = useState('prod:macbook_pro_m3');
  const [valueInput, setValueInput] = useState('{"name":"MacBook Pro M3","price":1999,"stock":14}');
  const [ttlInput, setTtlInput] = useState<number>(60);
  const [useTtl, setUseTtl] = useState(false);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    if (activeAction === 'GET') {
      const res = onGet(keyInput.trim());
      onOpenStepTrace(res);
    } else if (activeAction === 'SET') {
      const res = onSet(
        keyInput.trim(),
        valueInput.trim(),
        useTtl ? ttlInput : undefined
      );
      onOpenStepTrace(res);
    } else if (activeAction === 'DELETE') {
      const res = onDelete(keyInput.trim());
      onOpenStepTrace(res);
    }
  };

  const sampleKeyChips = [
    'prod:macbook_pro_m3',
    'prod:iphone_16_pro',
    'cart:session_4812',
    'user:session_9901',
    'video:intro_consistent_hash',
    'jwt:auth_token_98214',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Query Console Form */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              Client RPC Query Console
            </h2>
            <p className="text-xs text-slate-500">
              Submit dynamic requests to observe hash resolution, routing, and replication across servers.
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveAction('GET')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                activeAction === 'GET'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GET
            </button>
            <button
              onClick={() => setActiveAction('SET')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                activeAction === 'SET'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SET
            </button>
            <button
              onClick={() => setActiveAction('DELETE')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                activeAction === 'DELETE'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DEL
            </button>
            <button
              onClick={() => setActiveAction('PRESET')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                activeAction === 'PRESET'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Presets
            </button>
          </div>
        </div>

        {/* Configuration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
              Replication Factor (R)
            </label>
            <select
              value={replicationFactor}
              onChange={(e) => onReplicationFactorChange(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 font-medium text-slate-800 text-xs focus:outline-none focus:border-slate-500"
            >
              <option value="1">R = 1 (Standalone)</option>
              <option value="2">R = 2 (1 Primary + 1 Replica)</option>
              <option value="3">R = 3 (1 Primary + 2 Replicas)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
              Hash Algorithm
            </label>
            <select
              value={hashAlgorithm}
              onChange={(e) => onHashAlgorithmChange(e.target.value as HashAlgorithm)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 font-medium text-slate-800 text-xs focus:outline-none focus:border-slate-500"
            >
              <option value="murmur3">Murmur3 (32-bit)</option>
              <option value="fnv1a">FNV-1a (32-bit)</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
            <span className="text-[10px] text-slate-500 block mb-1">Lookup Complexity</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 text-center">
              O(log M) Binary Search
            </span>
          </div>
        </div>

        {/* PRESET tab */}
        {activeAction === 'PRESET' ? (
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Workload Datasets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WORKLOAD_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block mb-1">
                      {preset.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{preset.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    onClick={() => onPopulatePreset(preset)}
                    className="cursor-pointer mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Load {preset.sampleKeys.length} Keys</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Form for GET / SET / DELETE */
          <form onSubmit={handleExecute} className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-semibold">Key</label>
                <span className="text-[10px] text-slate-400 font-mono">string</span>
              </div>
              <input
                type="text"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. prod:macbook_pro_m3"
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-slate-500 bg-white"
              />

              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className="text-[10px] text-slate-400">Quick Test:</span>
                {sampleKeyChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setKeyInput(chip)}
                    className="cursor-pointer text-[10px] font-mono bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {activeAction === 'SET' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Value Payload
                </label>
                <textarea
                  rows={2}
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-slate-500 bg-white"
                />
              </div>
            )}

            {activeAction === 'SET' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={useTtl}
                      onChange={(e) => setUseTtl(e.target.checked)}
                      className="rounded text-slate-900"
                    />
                    <span>Time-To-Live (TTL Expiry)</span>
                  </label>
                  {useTtl && (
                    <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5">
                      {ttlInput}s
                    </span>
                  )}
                </div>

                {useTtl && (
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={ttlInput}
                    onChange={(e) => setTtlInput(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-800"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Network latency simulated: ~12ms
              </span>

              <button
                type="submit"
                className="cursor-pointer px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Execute {activeAction}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Column: Execution Output */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {lastOperation ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    lastOperation.status.includes('HIT')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : lastOperation.status === 'MISS'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  {lastOperation.status}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {lastOperation.operation} "{lastOperation.key}"
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {lastOperation.latencyMs}ms
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Key Hash (Hex):</span>
                <span className="font-bold text-slate-900">{formatHexHash(lastOperation.keyHash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ring Coordinate:</span>
                <span className="text-slate-800">{lastOperation.angle.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Coordinator Server:</span>
                <span className="font-bold text-slate-900">
                  {lastOperation.primaryNode?.name} ({lastOperation.primaryNode?.ip})
                </span>
              </div>
              {lastOperation.replicaNodes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Replicas Synced:</span>
                  <span className="text-slate-700">
                    {lastOperation.replicaNodes.map((r) => r.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {lastOperation.value && (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="text-slate-500 font-mono text-[10px] block mb-1">Payload:</span>
                <pre className="font-mono text-[11px] text-slate-800 overflow-x-auto whitespace-pre-wrap">
                  {lastOperation.value}
                </pre>
              </div>
            )}

            <button
              onClick={() => onOpenStepTrace(lastOperation)}
              className="cursor-pointer w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <span>View Computational Trace ({lastOperation.traceHops.length} hops)</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 space-y-2">
            <Terminal className="w-6 h-6 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-600 text-xs">No Queries Submitted</h3>
            <p className="text-[11px] text-slate-400">
              Execute a GET or SET query on the left to inspect routing.
            </p>
          </div>
        )}

        {/* Recent Access History */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Recent RPC Transactions
          </h3>

          <div className="space-y-1 max-h-44 overflow-y-auto">
            {operationHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Empty log</p>
            ) : (
              operationHistory.slice(0, 7).map((op, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenStepTrace(op)}
                  className="cursor-pointer p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        op.status.includes('HIT')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : op.status === 'MISS'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {op.status}
                    </span>
                    <span className="font-mono text-slate-800 font-medium truncate max-w-[120px]">
                      {op.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                    <span>{op.primaryNode?.name}</span>
                    <span>{op.latencyMs}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
