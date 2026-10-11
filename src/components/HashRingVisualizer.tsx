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
  Server,
  Key,
  Compass,
  CheckCircle,
  HelpCircle,
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
  const partitionInnerRadius = 182;
  const partitionOuterRadius = 194;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 transition-all">
      {/* Top Header & Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              360° Consistent Hash Ring Topology
            </h2>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
              Range: 0 → 2³²-1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Keys and server tokens mapped deterministically onto a scalar circular continuum.
          </p>
        </div>

        {/* Dynamic VNodes slider control */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
          <span className="font-medium text-slate-600">Virtual Nodes / Server:</span>
          <span className="w-6 text-center font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1">
            {vnodesCount}
          </span>
          <input
            type="range"
            min="1"
            max="15"
            value={vnodesCount}
            onChange={(e) => onVNodesCountChange(Number(e.target.value))}
            className="w-24 sm:w-28 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-[11px] text-slate-500 font-mono">
            ({vnodes.length} total)
          </span>
        </div>
      </div>

      {/* Main Grid: SVG Canvas + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        {/* SVG Ring Column */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative">
          <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none overflow-visible"
            >
              {/* Base background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Angle Tick Marks: 0, 45, 90, 135, 180, 225, 270, 315 */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const inner = polarToCartesian(center, center, radius - 8, angle);
                const outer = polarToCartesian(center, center, radius + 8, angle);
                const label = polarToCartesian(center, center, radius + 20, angle);
                return (
                  <g key={`tick-${angle}`}>
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="#94a3b8"
                      strokeWidth={angle % 90 === 0 ? '1.5' : '1'}
                      opacity={angle % 90 === 0 ? '0.8' : '0.4'}
                    />
                    {angle % 90 === 0 && (
                      <text
                        x={label.x}
                        y={label.y + 3.5}
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

              {/* Partition Arcs (showing physical node interval ownership) */}
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
                      opacity={isNodeHighlighted ? 0.85 : 0.15}
                      className="transition-opacity duration-150 cursor-pointer"
                    />
                  );
                })}

              {/* Virtual Nodes Pins */}
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
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredVNode(vn)}
                      onMouseLeave={() => setHoveredVNode(null)}
                      onClick={() => parentNode && onSelectNode(parentNode)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 6 : 4}
                        fill={isOffline ? '#94a3b8' : parentNode?.color || '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        opacity={isHighlighted ? 1 : 0.2}
                      />
                    </g>
                  );
                })}

              {/* Stored Keys Markers */}
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
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered || isLastActive ? 5.5 : 3.5}
                        fill={isLastActive ? '#dc2626' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

              {/* Active Route Connecting Line */}
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
                      <line
                        x1={keyPos.x}
                        y1={keyPos.y}
                        x2={vnodePos.x}
                        y2={vnodePos.y}
                        stroke="#dc2626"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    </g>
                  );
                })()
              )}

              {/* Center Dashboard Hub */}
              <g
                className="cursor-default"
                transform={`translate(${center}, ${center})`}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="72"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="62"
                  fill="#f8fafc"
                />
                <text
                  x="0"
                  y="-20"
                  fontSize="9"
                  fontWeight="600"
                  fill="#64748b"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  CLUSTER BALANCE
                </text>
                <text
                  x="0"
                  y="6"
                  fontSize="22"
                  fontWeight="700"
                  fill="#0f172a"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {uniformity.uniformityScore}%
                </text>
                <text
                  x="0"
                  y="22"
                  fontSize="10"
                  fontWeight="600"
                  fill={uniformity.uniformityScore > 80 ? '#059669' : '#d97706'}
                  textAnchor="middle"
                >
                  {uniformity.uniformityScore > 80 ? 'Balanced Spread' : 'Moderate Skew'}
                </text>
                <text
                  x="0"
                  y="38"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  StdDev: ±{uniformity.stdDev.toFixed(1)}%
                </text>
              </g>
            </svg>

            {/* Hover Tooltip Overlay for VNode */}
            {hoveredVNode && (
              <div className="absolute bottom-2 left-2 bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-800 z-20 pointer-events-none max-w-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-100">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Virtual Node: {hoveredVNode.id}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-slate-300 text-[11px] font-mono">
                  <div>
                    Physical Server:{' '}
                    <span className="text-white font-sans font-semibold">
                      {physicalNodes.find((n) => n.id === hoveredVNode.physicalNodeId)?.name}
                    </span>
                  </div>
                  <div>
                    Hash: <span className="text-amber-300">{formatHexHash(hoveredVNode.hash)}</span>
                  </div>
                  <div>
                    Ring Angle: <span className="text-white">{hoveredVNode.angle.toFixed(2)}°</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hover Tooltip Overlay for Key */}
            {hoveredKey && (
              <div className="absolute top-2 right-2 bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-800 z-20 pointer-events-none max-w-xs">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  <span>Key: {hoveredKey.key}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-slate-300 text-[11px] font-mono">
                  <div>
                    Hash: <span className="text-sky-300">{formatHexHash(hoveredKey.keyHash)}</span>
                  </div>
                  <div>
                    Assigned:{' '}
                    <span className="text-white font-sans font-semibold">
                      {physicalNodes.find((n) => n.id === hoveredKey.storedOnNodeId)?.name}
                    </span>
                  </div>
                  {hoveredKey.expiresAt && (
                    <div className="text-amber-300 font-sans">
                      TTL: {Math.max(0, Math.round((hoveredKey.expiresAt - Date.now()) / 1000))}s remaining
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            <button
              onClick={() => setShowVNodes(!showVNodes)}
              className={`cursor-pointer px-2.5 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showVNodes
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Virtual Nodes ({vnodes.length})
            </button>
            <button
              onClick={() => setShowPartitions(!showPartitions)}
              className={`cursor-pointer px-2.5 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showPartitions
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Partition Arcs
            </button>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className={`cursor-pointer px-2.5 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                showKeys
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Eye className="w-3 h-3" />
              Stored Keys ({storedKeys.length})
            </button>
          </div>
        </div>

        {/* Side Panel: Physical Nodes Partition Share */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                Physical Server Partition Ownership
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Target: {(100 / physicalNodes.length).toFixed(1)}% / server
              </span>
            </div>

            <div className="space-y-2.5">
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
                        ? 'bg-white border-blue-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="font-semibold text-slate-800">
                          {node.nodeName}
                        </span>
                        {isOffline && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            OFFLINE
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {node.sharePercent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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

          {/* Academic Context Box */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-slate-800 text-[11px]">
                  Virtual Nodes Mechanism:
                </strong>
                <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                  Assigning multiple pseudo-tokens per physical machine interleaves intervals around the 360° perimeter. As V increases, the variance of ring partition coverage decreases according to Central Limit Theorem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
