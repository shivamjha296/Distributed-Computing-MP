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
  Zap,
  Search,
  PlusCircle,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
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
    'cart:user_batch_d17',
    'user:session_9901',
    'video:dc_lecture',
    'jwt:auth_token_98214',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Query Console Form */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              Client Cache Query Console
            </h2>
            <p className="text-xs text-slate-500">
              Submit dynamic requests to demonstrate Consistent Hashing routing and replication.
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveAction('GET')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeAction === 'GET'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              GET
            </button>
            <button
              onClick={() => setActiveAction('SET')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeAction === 'SET'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              SET
            </button>
            <button
              onClick={() => setActiveAction('DELETE')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeAction === 'DELETE'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              DEL
            </button>
            <button
              onClick={() => setActiveAction('PRESET')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeAction === 'PRESET'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Presets
            </button>
          </div>
        </div>

        {/* Distributed Configuration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1 text-[11px] flex items-center gap-1">
              <Shield className="w-3 h-3 text-indigo-600" />
              Replication Factor (R)
            </label>
            <select
              value={replicationFactor}
              onChange={(e) => onReplicationFactorChange(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">R = 1 (No Replicas)</option>
              <option value="2">R = 2 (1 Primary + 1 Replica)</option>
              <option value="3">R = 3 (1 Primary + 2 Replicas)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1 text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Hash Algorithm
            </label>
            <select
              value={hashAlgorithm}
              onChange={(e) => onHashAlgorithmChange(e.target.value as HashAlgorithm)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="murmur3">Murmur3 (32-bit)</option>
              <option value="fnv1a">FNV-1a (32-bit)</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
            <span className="text-[10px] text-slate-500 block mb-1">Architecture</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center">
              Dynamo Ring + VNodes
            </span>
          </div>
        </div>

        {/* If PRESETS is selected */}
        {activeAction === 'PRESET' ? (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1-Click Realistic Workload Datasets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WORKLOAD_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mb-1">
                      {preset.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{preset.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    onClick={() => onPopulatePreset(preset)}
                    className="cursor-pointer mt-3 w-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Load {preset.sampleKeys.length} Keys
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Form for GET / SET / DELETE */
          <form onSubmit={handleExecute} className="space-y-4 pt-1 text-xs">
            {/* Key Field with Quick Chips */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-semibold">Key Identifier</label>
                <span className="text-[10px] text-slate-400">Namespace recommended (e.g. prod:123)</span>
              </div>
              <input
                type="text"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="e.g. prod:macbook_pro_m3"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />

              {/* Quick Select Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium">Quick Picks:</span>
                {sampleKeyChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setKeyInput(chip)}
                    className="cursor-pointer text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Field (SET only) */}
            {activeAction === 'SET' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cached Value Payload (JSON / Text)
                </label>
                <textarea
                  rows={2}
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder='{"name": "...", "price": 100}'
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            )}

            {/* TTL Expiration (SET only) */}
            {activeAction === 'SET' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={useTtl}
                      onChange={(e) => setUseTtl(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Set Time-To-Live (TTL Expiration)</span>
                  </label>
                  {useTtl && (
                    <span className="font-mono font-bold text-indigo-600 bg-white border border-indigo-200 rounded px-2 py-0.5">
                      {ttlInput} seconds
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
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                  />
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Step-by-step routing tracer will automatically open on execution.
              </span>

              <button
                type="submit"
                className={`cursor-pointer px-5 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
                  activeAction === 'GET'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                    : activeAction === 'SET'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }`}
              >
                <span>Execute {activeAction}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right Column: Execution Result & Live Hop Breakdown */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {lastOperation ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                    lastOperation.status.includes('HIT')
                      ? 'bg-emerald-100 text-emerald-800'
                      : lastOperation.status === 'MISS'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {lastOperation.status}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {lastOperation.operation} "{lastOperation.key}"
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                {lastOperation.latencyMs}ms
              </span>
            </div>

            {/* Successor & Hash metadata */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Key Hash:</span>
                <code className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {formatHexHash(lastOperation.keyHash)}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ring Angle:</span>
                <span className="font-semibold text-slate-800">{lastOperation.angle.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Primary Server:</span>
                <span className="font-bold text-slate-900">
                  {lastOperation.primaryNode?.name} ({lastOperation.primaryNode?.ip})
                </span>
              </div>
              {lastOperation.replicaNodes.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Replica Nodes:</span>
                  <span className="font-medium text-slate-700">
                    {lastOperation.replicaNodes.map((r) => r.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Returned Value (if GET HIT) */}
            {lastOperation.value && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                <span className="font-semibold text-emerald-900 block mb-1">Payload Content:</span>
                <pre className="font-mono text-[11px] text-emerald-800 bg-white p-2 rounded-lg border border-emerald-100 overflow-x-auto whitespace-pre-wrap">
                  {lastOperation.value}
                </pre>
              </div>
            )}

            {/* Quick Button to Open Detailed Trace */}
            <button
              onClick={() => onOpenStepTrace(lastOperation)}
              className="cursor-pointer w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-indigo-200"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              View Step-by-Step Hop Tracer ({lastOperation.traceHops.length} hops)
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center text-slate-400 space-y-2">
            <Terminal className="w-8 h-8 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-600 text-sm">No Queries Executed Yet</h3>
            <p className="text-xs text-slate-400">
              Submit a GET or SET query on the left to see live consistent hashing resolution.
            </p>
          </div>
        )}

        {/* Recent Operations Log */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Recent Cluster Access Log
          </h3>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {operationHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">History empty</p>
            ) : (
              operationHistory.slice(0, 7).map((op, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenStepTrace(op)}
                  className="cursor-pointer p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        op.status.includes('HIT')
                          ? 'bg-emerald-100 text-emerald-800'
                          : op.status === 'MISS'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {op.status}
                    </span>
                    <span className="font-mono text-slate-800 font-medium truncate max-w-[120px]">
                      {op.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span>{op.primaryNode?.name}</span>
                    <span className="font-mono">{op.latencyMs}ms</span>
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
