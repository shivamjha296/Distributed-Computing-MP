'use client';

import React from 'react';
import {
  Server,
  Layers,
  Activity,
  BarChart2,
  BookOpen,
  Zap,
  ShieldCheck,
  RefreshCw,
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner / Academic Metadata */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px]">
            TOPIC #9
          </span>
          <span className="font-semibold text-slate-200">
            Distributed Computing Micro-Project
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-300">
            Distributed Cache with Consistent Hashing
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <span className="hidden md:inline">
            Batch: <strong className="text-white">D17B / D17C</strong>
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span>
            Lab Teacher: <strong className="text-white">Prof. Priti Joshi</strong>
          </span>
          <button
            onClick={onOpenReport}
            className="cursor-pointer ml-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 shadow-xs"
          >
            <BookOpen className="w-3 h-3" />
            Project Report & Viva Guide
          </button>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                DC-Cache<span className="text-indigo-600">Hub</span>
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Cluster
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Consistent Hashing Ring & Dynamo-Style Quorum
            </p>
          </div>
        </div>

        {/* Live Cluster Quick Stats */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nodes:</span>
            <strong className="text-slate-900">
              {onlineNodeCount}/{totalNodeCount}
            </strong>
          </div>
          <div className="w-px h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Keys:</span>
            <strong className="text-slate-900">{totalKeys}</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hit Rate:</span>
            <strong className="text-slate-900">{hitRatePercent}%</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onResetCluster}
            title="Reset cluster keys and statistics"
            className="cursor-pointer p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto border-t border-slate-100 py-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'visualizer'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Hash Ring Visualizer
        </button>

        <button
          onClick={() => setActiveTab('nodes')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'nodes'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Nodes & Storage ({onlineNodeCount})
        </button>

        <button
          onClick={() => setActiveTab('console')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'console'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Query Console & Tracer
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'benchmark'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Consistent vs Modulo Benchmark
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'traffic'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Traffic Simulator (Zipfian)
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Academic Viva & Report
        </button>
      </div>
    </header>
  );
};
