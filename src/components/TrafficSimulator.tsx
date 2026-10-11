'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CacheOperationResult, PhysicalNode } from '../lib/types';
import { WORKLOAD_PRESETS } from '../lib/presets';
import {
  Activity,
  Play,
  Square,
  Zap,
  TrendingUp,
  BarChart,
  Flame,
  Radio,
  CheckCircle2,
  Clock,
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
  const [qps, setQps] = useState<number>(3); // Queries per second
  const [distribution, setDistribution] = useState<'zipfian' | 'uniform'>('zipfian');
  const [presetCategory, setPresetCategory] = useState<number>(0);
  const [totalSimulatedRequests, setTotalSimulatedRequests] = useState(0);
  const [simHits, setSimHits] = useState(0);
  const [simMisses, setSimMisses] = useState(0);
  const [nodeHitsMap, setNodeHitsMap] = useState<Record<string, number>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPreset = WORKLOAD_PRESETS[presetCategory] || WORKLOAD_PRESETS[0];
  const keysPool = selectedPreset.sampleKeys.map((s) => s.key);

  // Pick key based on distribution model
  const pickKey = (): string => {
    if (keysPool.length === 0) return 'prod:default_item';

    if (distribution === 'uniform') {
      const idx = Math.floor(Math.random() * keysPool.length);
      return keysPool[idx];
    } else {
      // Zipfian-like 80/20 distribution: 20% of top keys get 80% of traffic
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

  // Continuous traffic timer
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

  // Burst runner
  const handleBurst = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(executeTick, i * 40);
    }
  };

  const hitRate =
    totalSimulatedRequests > 0
      ? Math.round((simHits / totalSimulatedRequests) * 100)
      : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Live Synthetic Traffic Generator & Stress Simulator
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isRunning
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isRunning ? '● RUNNING' : 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates realistic asynchronous queries to measure ring load balance, hot key dynamics, and hit rate.
          </p>
        </div>

        {/* Play / Pause & Burst Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Live Stream
              </>
            )}
          </button>

          <button
            onClick={() => handleBurst(25)}
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Burst 25 Req
          </button>
        </div>
      </div>

      {/* Simulator Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Workload Preset
          </label>
          <select
            value={presetCategory}
            onChange={(e) => setPresetCategory(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
          >
            {WORKLOAD_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name} ({p.sampleKeys.length} keys)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Access Distribution Model
          </label>
          <select
            value={distribution}
            onChange={(e) => setDistribution(e.target.value as 'zipfian' | 'uniform')}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
          >
            <option value="zipfian">Zipfian (80/20 Power Law - Hot Keys)</option>
            <option value="uniform">Uniform Random (Even Key Access)</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-600 font-semibold">Queries Per Second (QPS)</label>
            <span className="font-mono font-bold text-indigo-600">{qps} req/s</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={qps}
            onChange={(e) => setQps(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
          />
        </div>
      </div>

      {/* Live Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <span className="text-slate-400 text-xs block">Total Requests</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalSimulatedRequests}
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center shadow-2xs">
          <span className="text-emerald-700 text-xs block font-semibold">Cache Hits</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{simHits}</div>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center shadow-2xs">
          <span className="text-rose-700 text-xs block font-semibold">Cache Misses</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{simMisses}</div>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center shadow-2xs">
          <span className="text-indigo-700 text-xs block font-semibold">Live Hit Rate</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{hitRate}%</div>
        </div>
      </div>

      {/* Load Balancing Distribution Chart */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart className="w-3.5 h-3.5 text-indigo-600" />
          Request Load Distribution Across Physical Servers
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
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200"
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-bold text-slate-800">{node.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{pct}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: node.color,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-500 text-right">
                  {hits} queries served
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Stream Ticker */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Live Traffic Trace Feed
        </h4>
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-3 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
          {recentOperations.slice(0, 10).map((op, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    op.status.includes('HIT')
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
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
