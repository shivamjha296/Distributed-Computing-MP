'use client';

import React, { useState } from 'react';
import { CacheOperationResult, RoutingTraceHop } from '../lib/types';
import {
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Key,
  Compass,
  Clock,
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
      <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  operation.status.includes('HIT')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : operation.status === 'MISS'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {operation.status}
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                {operation.operation} "{operation.key}"
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic routing pipeline trace across the consistent hash ring topology.
            </p>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="py-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
            {hops.map((hop, idx) => {
              const isSelected = idx === activeStepIdx;
              const isPassed = idx <= activeStepIdx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap text-xs ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : isPassed
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="font-mono text-[10px]">{idx + 1}.</span>
                  <span>{hop.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hop Detail */}
        <div className="py-4 flex-1 overflow-y-auto space-y-3.5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-500 text-[11px] uppercase">
                Step #{currentHop.step} of {hops.length}
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Type: {currentHop.type}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900">
              {currentHop.title}
            </h4>

            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {currentHop.description}
            </p>

            {currentHop.detail && (
              <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-xs text-slate-800">
                {currentHop.detail}
              </div>
            )}
          </div>

          <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600">
            <strong className="text-slate-800 block text-xs mb-1 font-semibold">
              Theoretical Invariant:
            </strong>
            {currentHop.type === 'hash' && (
              <p className="text-[11px] leading-relaxed">
                Key string is projected into [0, 2³² - 1] hash space using Murmur3 to ensure uniform uniform pseudo-random dispersion.
              </p>
            )}
            {currentHop.type === 'ring-search' && (
              <p className="text-[11px] leading-relaxed">
                Binary search over M sorted virtual nodes runs in O(log M) time to locate the immediate clockwise successor.
              </p>
            )}
            {currentHop.type === 'primary-route' && (
              <p className="text-[11px] leading-relaxed">
                Direct RPC dispatch to the physical server IP hosting the resolved virtual node interval.
              </p>
            )}
            {currentHop.type === 'cache-lookup' && (
              <p className="text-[11px] leading-relaxed">
                Local in-memory hash table lookup. Recency / frequency metadata updated for eviction scheduling.
              </p>
            )}
            {currentHop.type === 'replica-forward' && (
              <p className="text-[11px] leading-relaxed">
                Dynamo-style quorum replication: writes forward asynchronously to the next distinct physical machines clockwise.
              </p>
            )}
            {currentHop.type === 'failover' && (
              <p className="text-[11px] leading-relaxed">
                Primary node failure handled seamlessly by rerouting read request to the next live replica node along the ring.
              </p>
            )}
            {currentHop.type === 'completed' && (
              <p className="text-[11px] leading-relaxed">
                Round-trip transaction completed with client latency acknowledgment.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStepIdx(Math.max(0, activeStepIdx - 1))}
              disabled={activeStepIdx === 0}
              className="cursor-pointer px-3 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setActiveStepIdx(Math.min(hops.length - 1, activeStepIdx + 1))
              }
              disabled={activeStepIdx === hops.length - 1}
              className="cursor-pointer px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer px-3 py-1 rounded text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
