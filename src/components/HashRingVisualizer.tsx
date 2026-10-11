'use client';

import React, { useState } from 'react';
import {
  PhysicalNode,
  VirtualNode,
  CacheItem,
  CacheOperationResult,
} from '../lib/types';
import { ConsistentHashRing } from '../lib/consistentHashRing';
import { formatHexHash } from '../lib/hashAlgorithms';
import {
  Sliders,
  Eye,
  CheckCircle2,
  Info,
  Server,
  Key,
  Compass,
} from 'lucide-react';

interface HashRingVisualizerProps {
  ring: ConsistentHashRing;
  storedKeys: CacheItem[];
  lastOperation?: CacheOperationResult;
  vnodesCount: number;
  onVNodesCountChange: (count: number) => void;
  onSelectNode: (node: PhysicalNode) => void;
}

export const HashRingVisualizer: React.FC<HashRingVisualizerProps> = ({
  ring,
  storedKeys,
  lastOperation,
  vnodesCount,
  onVNodesCountChange,
  onSelectNode,
}) => {
  const [showVNodes, setShowVNodes] = useState(true);
  const [showPartitions, setShowPartitions] = useState(true);
  const [showKeys, setShowKeys] = useState(true);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [hoveredVNode, setHoveredVNode] = useState<VirtualNode | null>(null);
  const [hoveredKey, setHoveredKey] = useState<CacheItem | null>(null);

  const physicalNodes = ring.getPhysicalNodes();
  const vnodes = ring.getVirtualNodes();
  const partitions = ring.getPartitions();
  const shares = ring.getNodeShares();
  const uniformity = ring.getUniformityMetrics();

  // SVG dimensions
  const size = 520;
  const center = size / 2;
  const radius = 195;
  const partitionInnerRadius = 180;
  const partitionOuterRadius = 192;

  // Converts polar coordinates (angle in degrees) to cartesian (x, y)
  // 0 degrees is at the top (12 o'clock)
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // SVG Arc generator
  const describeArc = (x: number, y: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) => {
    let diff = endAngle - startAngle;
    if (diff < 0) diff += 360;
    if (diff > 359.99) diff = 359.99;

    const largeArcFlag = diff <= 180 ? '0' : '1';

    const p1 = polarToCartesian(x, y, rOuter, startAngle);
    const p2 = polarToCartesian(x, y, rOuter, startAngle + diff);
    const p3 = polarToCartesian(x, y, rInner, startAngle + diff);
    const p4 = polarToCartesian(x, y, rInner, startAngle);

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 transition-all">
      {/* Header & Controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              360° Consistent Hash Ring Visualizer
            </h2>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Hash Space: 0 → 2³²-1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Keys and server virtual nodes mapped uniformly onto a 32-bit circular continuum.
          </p>
        </div>

        {/* Dynamic VNodes slider control */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700">Virtual Nodes / Node:</span>
            <span className="w-6 text-center font-mono font-bold text-xs text-indigo-600 bg-white border border-indigo-200 rounded px-1">
              {vnodesCount}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={vnodesCount}
            onChange={(e) => onVNodesCountChange(Number(e.target.value))}
            className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Total VNodes: <strong className="text-slate-800">{vnodes.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: SVG Canvas + Side Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 items-center">
        {/* SVG Ring Column */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative">
          {/* Degree Markers Guide */}
          <div className="relative w-full max-w-[520px] aspect-square flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none overflow-visible"
            >
              <defs>
                {/* Glow Filter for Active Key Pin */}
                <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="ringTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>

              {/* Base background ring circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="url(#ringTrackGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Angle Tick Marks: 0, 90, 180, 270 */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const inner = polarToCartesian(center, center, radius - 10, angle);
                const outer = polarToCartesian(center, center, radius + 10, angle);
                const label = polarToCartesian(center, center, radius + 22, angle);
                return (
                  <g key={`tick-${angle}`} className="text-slate-400">
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="#94a3b8"
                      strokeWidth={angle % 90 === 0 ? '2' : '1'}
                      opacity={angle % 90 === 0 ? '0.8' : '0.4'}
                    />
                    {angle % 90 === 0 && (
                      <text
                        x={label.x}
                        y={label.y + 4}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="600"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {angle}°
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Partition Arcs (showing physical node coverage slices) */}
              {showPartitions &&
                partitions.map((part, idx) => {
                  const isNodeHighlighted =
                    highlightedNodeId === null || highlightedNodeId === part.physicalNodeId;
                  const arcPath = describeArc(
                    center,
                    center,
                    partitionInnerRadius,
                    partitionOuterRadius,
                    part.startAngle,
                    part.endAngle
                  );
                  return (
                    <path
                      key={`part-${idx}`}
                      d={arcPath}
                      fill={part.color}
                      opacity={isNodeHighlighted ? 0.8 : 0.15}
                      className="transition-opacity duration-200 hover:opacity-100 cursor-pointer"
                    />
                  );
                })}

              {/* Virtual Nodes */}
              {showVNodes &&
                vnodes.map((vn) => {
                  const pos = polarToCartesian(center, center, radius, vn.angle);
                  const parentNode = physicalNodes.find((n) => n.id === vn.physicalNodeId);
                  const isHighlighted =
                    highlightedNodeId === null || highlightedNodeId === vn.physicalNodeId;
                  const isHovered = hoveredVNode?.id === vn.id;
                  const isOffline = parentNode?.status === 'offline';

                  return (
                    <g
                      key={`vn-${vn.id}`}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredVNode(vn)}
                      onMouseLeave={() => setHoveredVNode(null)}
                      onClick={() => parentNode && onSelectNode(parentNode)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 7 : 4.5}
                        fill={isOffline ? '#94a3b8' : parentNode?.color || '#6366f1'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity={isHighlighted ? 1 : 0.25}
                        className="transition-all"
                      />
                    </g>
                  );
                })}

              {/* Stored Keys Pins */}
              {showKeys &&
                storedKeys.map((item, idx) => {
                  const angle = (item.keyHash / 0xffffffff) * 360;
                  const pos = polarToCartesian(center, center, radius - 24, angle);
                  const isHovered = hoveredKey?.key === item.key;
                  const isLastActive = lastOperation?.key === item.key;

                  return (
                    <g
                      key={`key-${item.key}-${idx}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredKey(item)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      {isLastActive && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="14"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          className="animate-ping"
                          opacity="0.6"
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered || isLastActive ? 6 : 3.5}
                        fill={isLastActive ? '#ef4444' : '#0ea5e9'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter={isLastActive ? 'url(#activeGlow)' : undefined}
                      />
                    </g>
                  );
                })}

              {/* Active Route Pulse Animation */}
              {lastOperation?.targetVNode && (
                (() => {
                  const keyPos = polarToCartesian(center, center, radius - 24, lastOperation.angle);
                  const vnodePos = polarToCartesian(
                    center,
                    center,
                    radius,
                    lastOperation.targetVNode.angle
                  );
                  return (
                    <g className="pointer-events-none">
                      {/* Connecting Line from Key to Successor VNode */}
                      <line
                        x1={keyPos.x}
                        y1={keyPos.y}
                        x2={vnodePos.x}
                        y2={vnodePos.y}
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        className="animate-pulse"
                      />
                    </g>
                  );
                })()
              )}

              {/* Center Hub */}
              <g
                className="cursor-default"
                transform={`translate(${center}, ${center})`}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="74"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="2"
                  className="shadow-inner"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="62"
                  fill="#f8fafc"
                />
                <text
                  x="0"
                  y="-22"
                  fontSize="10"
                  fontWeight="600"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  CLUSTER BALANCE
                </text>
                <text
                  x="0"
                  y="6"
                  fontSize="24"
                  fontWeight="800"
                  fill="#1e293b"
                  textAnchor="middle"
                >
                  {uniformity.uniformityScore}%
                </text>
                <text
                  x="0"
                  y="24"
                  fontSize="10"
                  fontWeight="600"
                  fill={uniformity.uniformityScore > 80 ? '#059669' : '#d97706'}
                  textAnchor="middle"
                >
                  {uniformity.uniformityScore > 80 ? '✓ Uniform Spread' : 'Moderate Skew'}
                </text>
                <text
                  x="0"
                  y="40"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  StdDev: ±{uniformity.stdDev.toFixed(1)}%
                </text>
              </g>
            </svg>

            {/* Hover Tooltip Overlay for VNode */}
            {hoveredVNode && (
              <div className="absolute bottom-2 left-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 z-20 pointer-events-none max-w-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Server className="w-3.5 h-3.5" />
                  <span>Virtual Node: {hoveredVNode.id}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-slate-300 text-[11px]">
                  <div>
                    Physical Node:{' '}
                    <strong className="text-white">
                      {physicalNodes.find((n) => n.id === hoveredVNode.physicalNodeId)?.name}
                    </strong>
                  </div>
                  <div>
                    Hash: <code className="text-amber-300">{formatHexHash(hoveredVNode.hash)}</code>
                  </div>
                  <div>
                    Angle: <strong className="text-white">{hoveredVNode.angle.toFixed(2)}°</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Tooltip Overlay for Key */}
            {hoveredKey && (
              <div className="absolute top-2 right-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 z-20 pointer-events-none max-w-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Cached Key: {hoveredKey.key}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-slate-300 text-[11px]">
                  <div>
                    Hash: <code className="text-sky-300">{formatHexHash(hoveredKey.keyHash)}</code>
                  </div>
                  <div>
                    Stored On:{' '}
                    <strong className="text-white">
                      {physicalNodes.find((n) => n.id === hoveredKey.storedOnNodeId)?.name}
                    </strong>
                  </div>
                  {hoveredKey.expiresAt && (
                    <div className="text-amber-300">
                      Expires in: {Math.max(0, Math.round((hoveredKey.expiresAt - Date.now()) / 1000))}s
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={() => setShowVNodes(!showVNodes)}
              className={`cursor-pointer px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showVNodes
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Virtual Nodes ({vnodes.length})
            </button>
            <button
              onClick={() => setShowPartitions(!showPartitions)}
              className={`cursor-pointer px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showPartitions
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Partition Arcs
            </button>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className={`cursor-pointer px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showKeys
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Key Markers ({storedKeys.length})
            </button>
          </div>
        </div>

        {/* Side Panel: Physical Nodes Ring Share & Skew Analytics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Physical Nodes Ring Share
              </h3>
              <span className="text-[10px] text-slate-500">
                Ideal: {(100 / physicalNodes.length).toFixed(1)}% / node
              </span>
            </div>

            <div className="space-y-3">
              {shares.map((node) => {
                const isHovered = highlightedNodeId === node.nodeId;
                const isOffline = node.status === 'offline';

                return (
                  <div
                    key={node.nodeId}
                    onMouseEnter={() => setHighlightedNodeId(node.nodeId)}
                    onMouseLeave={() => setHighlightedNodeId(null)}
                    onClick={() => {
                      const p = physicalNodes.find((n) => n.id === node.nodeId);
                      if (p) onSelectNode(p);
                    }}
                    className={`cursor-pointer p-2.5 rounded-lg border transition-all ${
                      isHovered
                        ? 'bg-white border-indigo-300 shadow-sm ring-2 ring-indigo-50'
                        : 'bg-white/70 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="font-semibold text-slate-800">
                          {node.nodeName}
                        </span>
                        {isOffline && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            OFFLINE
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {node.sharePercent.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar of Hash Ring ownership */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${node.sharePercent}%`,
                          backgroundColor: node.color,
                          opacity: isOffline ? 0.4 : 1,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Insight Pill */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-indigo-900">
                  Why Virtual Nodes (VNodes)?
                </strong>
                <p className="mt-0.5 text-indigo-800 text-[11px] leading-relaxed">
                  With 1 node per physical server, hash variance causes severe skew (hotspots). Adding virtual nodes breaks the hash space into fine interleaved intervals, driving uniformity towards the mathematical ideal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
