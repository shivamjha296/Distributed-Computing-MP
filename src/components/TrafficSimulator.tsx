'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CacheOperationResult, PhysicalNode } from '../lib/types';
import { WORKLOAD_PRESETS } from '../lib/presets';
import {
  Activity,
  Play,
  Square,
  Zap,
  BarChart2,
  Clock,
  Radio,
} from 'lucide-react';

interface TrafficSimulatorProps {
  nodes: PhysicalNode[];
  onExecuteQuery: (key: string, isSetIfMissing?: boolean) => CacheOperationResult;
  recentOperations: CacheOperationResult[];
}

export const TrafficSimulator: React.FC<TrafficSimulatorProps> = ({
  nodes,
  onExecuteQuery,
  recentOperations,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [qps, setQps] = useState<number>(3);
  const [distribution, setDistribution] = useState<'zipfian' | 'uniform'>('zipfian');
  const [presetCategory, setPresetCategory] = useState<number>(0);
  const [totalSimulatedRequests, setTotalSimulatedRequests] = useState(0);
  const [simHits, setSimHits] = useState(0);
  const [simMisses, setSimMisses] = useState(0);
  const [nodeHitsMap, setNodeHitsMap] = useState<Record<string, number>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPreset = WORKLOAD_PRESETS[presetCategory] || WORKLOAD_PRESETS[0];
  const keysPool = selectedPreset.sampleKeys.map((s) => s.key);

  const pickKey = (): string => {
    if (keysPool.length === 0) return 'prod:default_item';

    if (distribution === 'uniform') {
      const idx = Math.floor(Math.random() * keysPool.length);
      return keysPool[idx];
    } else {
      // Zipfian distribution (80/20 power law)
      const hotCount = Math.max(1, Math.floor(keysPool.length * 0.2));
      const isHot = Math.random() < 0.8;
      if (isHot) {
        const idx = Math.floor(Math.random() * hotCount);
        return keysPool[idx];
      } else {
        const idx = hotCount + Math.floor(Math.random() * (keysPool.length - hotCount));
        return keysPool[idx] || keysPool[0];
      }
    }
  };

  const executeTick = () => {
    const key = pickKey();
    const res = onExecuteQuery(key, true);

    setTotalSimulatedRequests((prev) => prev + 1);
    if (res.status.includes('HIT')) {
      setSimHits((prev) => prev + 1);
    } else {
      setSimMisses((prev) => prev + 1);
    }

    if (res.primaryNode) {
      setNodeHitsMap((prev) => ({
        ...prev,
        [res.primaryNode!.id]: (prev[res.primaryNode!.id] || 0) + 1,
      }));
    }
  };

  useEffect(() => {
    if (isRunning) {
      const intervalMs = Math.round(1000 / qps);
      timerRef.current = setInterval(executeTick, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, qps, distribution, presetCategory, keysPool]);

  const handleBurst = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(executeTick, i * 35);
    }
  };

  const hitRate =
    totalSimulatedRequests > 0
      ? Math.round((simHits / totalSimulatedRequests) * 100)
      : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Synthetic Traffic Generator & Load Balancer Telemetry
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isRunning
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isRunning ? 'STREAMING ACTIVE' : 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates asynchronous requests to verify load distribution and hit-rate dynamics under varying access patterns.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`cursor-pointer px-3.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                Start Stream
              </>
            )}
          </button>

          <button
            onClick={() => handleBurst(25)}
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-3 py-1.5 rounded text-xs transition-colors border border-slate-200"
          >
            Burst 25 Requests
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
            Workload Profile
          </label>
          <select
            value={presetCategory}
            onChange={(e) => setPresetCategory(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 font-medium text-slate-800 text-xs focus:outline-none"
          >
            {WORKLOAD_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name} ({p.sampleKeys.length} keys)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
            Access Pattern
          </label>
          <select
            value={distribution}
            onChange={(e) => setDistribution(e.target.value as 'zipfian' | 'uniform')}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 font-medium text-slate-800 text-xs focus:outline-none"
          >
            <option value="zipfian">Zipfian (80/20 Power Law - Hot Keys)</option>
            <option value="uniform">Uniform Random (Equi-probable Keys)</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-600 font-semibold text-[11px]">Throughput (QPS)</label>
            <span className="font-mono font-bold text-slate-900">{qps} req/s</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={qps}
            onChange={(e) => setQps(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-800 mt-1.5"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">Requests Executed</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {totalSimulatedRequests}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">Cache Hits</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{simHits}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">Cache Misses</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">{simMisses}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">Hit Ratio</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{hitRate}%</div>
        </div>
      </div>

      {/* Server Load Distribution */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Physical Server Load Distribution
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {nodes.map((node) => {
            const hits = nodeHitsMap[node.id] || 0;
            const pct =
              totalSimulatedRequests > 0
                ? Math.round((hits / totalSimulatedRequests) * 100)
                : 0;

            return (
              <div
                key={node.id}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200"
              >
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-semibold text-slate-800">{node.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{pct}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: node.color,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">
                  {hits} queries
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traffic Log Feed */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Real-time RPC Ingestion Feed
        </h4>
        <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
          {recentOperations.slice(0, 10).map((op, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    op.status.includes('HIT')
                      ? 'bg-emerald-900/60 text-emerald-400'
                      : 'bg-rose-900/60 text-rose-400'
                  }`}
                >
                  {op.status}
                </span>
                <span className="text-white">{op.key}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                <span>➜ {op.primaryNode?.name}</span>
                <span>{op.latencyMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
