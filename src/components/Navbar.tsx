'use client';

import React from 'react';
import { CircleDot, Server, Terminal, Activity, RotateCcw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'ring' | 'nodes' | 'operations' | 'benchmark';
  setActiveTab: (tab: 'ring' | 'nodes' | 'operations' | 'benchmark') => void;
  nodeCount?: number;
  keyCount?: number;
  hitRate?: number;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onReset,
}) => {
  const tabs = [
    { id: 'ring' as const, label: 'Ring Topology', icon: CircleDot },
    { id: 'nodes' as const, label: 'Cluster Nodes', icon: Server },
    { id: 'operations' as const, label: 'Data Console', icon: Terminal },
    { id: 'benchmark' as const, label: 'Rebalance Analysis', icon: Activity },
  ];

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 mb-3" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto w-full bg-black text-white rounded-full p-2.5 px-4 shadow-2xl border border-neutral-800/90 flex items-center justify-between backdrop-blur-md">
        {/* Brand: Circular White Badge with Logo + CacheRing Name */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 shadow-sm flex-shrink-0">
            <img
              src="/logo.png"
              alt="CacheRing Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white ml-3 select-none">
            CacheRing
          </span>
        </div>

        {/* Center: Clean Nav Links (Matching Reference Design) */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'text-white bg-white/20 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Rounded White Pill Button (Matching Reference Design) */}
        <div className="flex items-center">
          <button
            onClick={onReset}
            className="rounded-full bg-white text-black hover:bg-neutral-100 font-bold text-xs px-5 py-2.5 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            title="Reset cluster to default workload"
          >
            <RotateCcw size={13} className="text-black" />
            Reset State
          </button>
        </div>
      </div>

      {/* Mobile nav fallback row */}
      <div className="md:hidden flex items-center justify-center gap-1 mt-2 bg-black/90 p-1.5 rounded-full max-w-sm mx-auto border border-neutral-800">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                active ? 'text-white bg-white/20' : 'text-neutral-400'
              }`}
            >
              {tab.label.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </header>
  );
};
