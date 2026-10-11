'use client';

import React, { useState } from 'react';
import { CacheOperationResult, RoutingTraceHop } from '../lib/types';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Key,
  Compass,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';

interface StepTraceDrawerProps {
  operation: CacheOperationResult | null;
  onClose: () => void;
}

export const StepTraceDrawer: React.FC<StepTraceDrawerProps> = ({
  operation,
  onClose,
}) => {
  if (!operation) return null;

  const [activeStepIdx, setActiveStepIdx] = useState<number>(
    operation.traceHops.length - 1
  );

  const hops = operation.traceHops;
  const currentHop = hops[activeStepIdx] || hops[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                  operation.status.includes('HIT')
                    ? 'bg-emerald-100 text-emerald-800'
                    : operation.status === 'MISS'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {operation.status}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Step-by-Step Routing Tracer: {operation.operation} "{operation.key}"
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mathematical trace of client request resolution across the consistent hash ring.
            </p>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Stepper Timeline Tracker */}
        <div className="py-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {hops.map((hop, idx) => {
              const isSelected = idx === activeStepIdx;
              const isPassed = idx <= activeStepIdx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : isPassed
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{hop.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Hop Spotlight */}
        <div className="py-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Hop #{currentHop.step} of {hops.length}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Type: {currentHop.type}
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900">
              {currentHop.title}
            </h4>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {currentHop.description}
            </p>

            {currentHop.detail && (
              <div className="p-3 bg-white rounded-xl border border-indigo-200/80 font-mono text-xs text-indigo-950">
                {currentHop.detail}
              </div>
            )}
          </div>

          {/* Academic Principle Context */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <strong className="text-slate-800 block font-semibold">
              Distributed System Mechanics:
            </strong>
            {currentHop.type === 'hash' && (
              <p>
                Keys are hashed with 32-bit Murmur3 or FNV-1a to project strings evenly into a scalar ring integer space of [0, 4,294,967,295].
              </p>
            )}
            {currentHop.type === 'ring-search' && (
              <p>
                The client coordinates with a sorted binary search tree (O(log M) complexity). The nearest clockwise virtual node is selected as the partition coordinator.
              </p>
            )}
            {currentHop.type === 'primary-route' && (
              <p>
                Network RPC/TCP socket dispatch to the physical IP address of the identified partition master.
              </p>
            )}
            {currentHop.type === 'cache-lookup' && (
              <p>
                Server memory store lookup. If present, the entry recency/frequency counter is incremented. If full, cache eviction algorithm (LRU/LFU/FIFO) frees space.
              </p>
            )}
            {currentHop.type === 'replica-forward' && (
              <p>
                Dynamo-style asynchronous replication. To survive server crashes, the coordinator dispatches the write to the next distinct physical servers on the ring.
              </p>
            )}
            {currentHop.type === 'failover' && (
              <p>
                Fault-tolerant self-healing. Because the primary node is detected offline, the client automatically falls back to replica nodes along the ring without dropping traffic.
              </p>
            )}
            {currentHop.type === 'completed' && (
              <p>
                Client receives acknowledgment with total end-to-end round trip latency.
              </p>
            )}
          </div>
        </div>

        {/* Drawer Footer Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStepIdx(Math.max(0, activeStepIdx - 1))}
              disabled={activeStepIdx === 0}
              className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setActiveStepIdx(Math.min(hops.length - 1, activeStepIdx + 1))
              }
              disabled={activeStepIdx === hops.length - 1}
              className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              Next Step
            </button>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
