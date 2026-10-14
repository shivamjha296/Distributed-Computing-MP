'use client';

import React, { useState } from 'react';
import { CacheOperationResult } from '../lib/types';
import { formatHexHash } from '../lib/hashAlgorithms';
import { X, ChevronLeft, ChevronRight, Activity, ArrowRight } from 'lucide-react';

interface Props {
  operation: CacheOperationResult;
  onClose: () => void;
}

export const RoutingStepsModal: React.FC<Props> = ({ operation, onClose }) => {
  const hops = operation.traceHops;
  const [step, setStep] = useState(0);
  const hop = hops[step];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Routing Trace: {operation.operation} "{operation.key}"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Trace Metadata Overview */}
        <div className="px-6 py-3.5 border-b border-slate-100 grid grid-cols-4 gap-3 text-xs bg-white">
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Status</span>
            <span className="font-bold text-slate-900">{operation.status}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Target Node</span>
            <span className="font-bold text-slate-900">{operation.primaryNode?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Murmur3 Hash</span>
            <span className="font-semibold text-slate-900 font-mono text-[11px]">
              {formatHexHash(operation.keyHash)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Latency</span>
            <span className="font-bold text-slate-900">{operation.latencyMs}ms</span>
          </div>
        </div>

        {/* Pipeline Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {hops.map((h, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                i === step
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span>{i + 1}.</span>
              <span>{h.title}</span>
            </button>
          ))}
        </div>

        {/* Step Detail */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                {step + 1}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{hop.title}</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{hop.description}</p>
          </div>

          {hop.detail && (
            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg text-xs font-mono border border-slate-800 leading-relaxed">
              {hop.detail}
            </div>
          )}

          {step === hops.length - 1 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs space-y-1.5">
              <div className="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-2">
                Execution Summary
              </div>
              <div className="text-slate-700 font-medium">
                Resolved Ring Coordinate:{' '}
                <strong className="text-slate-900">{operation.angle.toFixed(2)}°</strong>
              </div>
              <div className="text-slate-700 font-medium">
                Primary Host:{' '}
                <strong className="text-slate-900">
                  {operation.primaryNode?.name} ({operation.primaryNode?.ip}:{operation.primaryNode?.port})
                </strong>
              </div>
              <div className="text-slate-700 font-medium">
                Roundtrip Duration:{' '}
                <strong className="text-slate-900">{operation.latencyMs} ms</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={13} />
              Previous
            </button>
            <button
              onClick={() => setStep(Math.min(hops.length - 1, step + 1))}
              disabled={step === hops.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
