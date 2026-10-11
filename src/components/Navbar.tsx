'use client';

import React from 'react';
import {
  Server,
  Layers,
  Activity,
  BarChart3,
  FileText,
  Terminal,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'visualizer' | 'nodes' | 'console' | 'benchmark' | 'traffic' | 'report';
  setActiveTab: (tab: 'visualizer' | 'nodes' | 'console' | 'benchmark' | 'traffic' | 'report') => void;
  onlineNodeCount: number;
  totalNodeCount: number;
  totalKeys: number;
  hitRatePercent: number;
  onResetCluster: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onlineNodeCount,
  totalNodeCount,
  totalKeys,
  hitRatePercent,
  onResetCluster,
  onOpenReport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Distributed Cache Engine
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cluster Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Consistent Hashing Ring • Virtual Nodes (VNodes) • Dynamo Quorum Replication
            </p>
          </div>
        </div>

        {/* Live Cluster Metrics */}
        <div className="hidden md:flex items-center gap-5 text-xs text-slate-600 border border-slate-200 bg-slate-50 rounded-lg px-3.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>Nodes:</span>
            <strong className="text-slate-900 font-mono font-semibold">
              {onlineNodeCount} / {totalNodeCount}
            </strong>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Keys:</span>
            <strong className="text-slate-900 font-mono font-semibold">{totalKeys}</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Hit Ratio:</span>
            <strong className="text-slate-900 font-mono font-semibold">{hitRatePercent}%</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetCluster}
            title="Reset cluster state and preload default items"
            className="cursor-pointer text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          <button
            onClick={onOpenReport}
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Architecture & Specs</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'visualizer'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Hash Ring Visualizer
        </button>

        <button
          onClick={() => setActiveTab('nodes')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'nodes'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Storage Nodes ({onlineNodeCount})
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'console'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Query Console & Tracer
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'benchmark'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Consistent vs Modulo Benchmark
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'traffic'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Traffic Simulator
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`cursor-pointer px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/20'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Evaluation Specs
        </button>
      </div>
    </header>
  );
};
