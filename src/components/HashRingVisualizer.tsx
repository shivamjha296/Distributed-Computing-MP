'use client';

import React, { useState } from 'react';
import { PhysicalNode, VirtualNode, CacheItem, CacheOperationResult } from '../lib/types';
import { ConsistentHashRing } from '../lib/consistentHashRing';
import { formatHexHash } from '../lib/hashAlgorithms';
import { Layers, Key } from 'lucide-react';

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
  const [showKeys, setShowKeys] = useState(true);
  const [hoveredVNode, setHoveredVNode] = useState<VirtualNode | null>(null);
  const [hoveredKey, setHoveredKey] = useState<CacheItem | null>(null);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  const physicalNodes = ring.getPhysicalNodes();
  const vnodes = ring.getVirtualNodes();
  const partitions = ring.getPartitions();
  const shares = ring.getNodeShares();
  const uniformity = ring.getUniformityMetrics();

  // Robust SVG Geometry: 40px thick circumference for prominent visibility
  const SIZE = 520;
  const C = SIZE / 2;
  const INNER = 155;
  const OUTER = 195; // 40px thickness
  const MID = (INNER + OUTER) / 2;
  const KEYS_R = 216;

  const polar = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arc = (cx: number, cy: number, ri: number, ro: number, a1: number, a2: number) => {
    let d = a2 - a1;
    if (d < 0) d += 360;
    if (d > 359.99) d = 359.99;
    const laf = d <= 180 ? '0' : '1';
    const p1 = polar(cx, cy, ro, a1);
    const p2 = polar(cx, cy, ro, a1 + d);
    const p3 = polar(cx, cy, ri, a1 + d);
    const p4 = polar(cx, cy, ri, a1);
    return `M ${p1.x} ${p1.y} A ${ro} ${ro} 0 ${laf} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${ri} ${ri} 0 ${laf} 0 ${p4.x} ${p4.y} Z`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (8 cols): Graph Window with Integrated Header & Controls */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Header Bar: Title on Left, Graph Controls on Right */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Ring Topology Space
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              32-Bit Hash Ring (0 to 2³² - 1) • Clockwise Successor Routing
            </p>
          </div>

          {/* Integrated Graph Controls (VNodes & Key Visibility) */}
          <div className="flex items-center gap-2">
            {/* VNodes density selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-slate-500 font-bold text-[11px]">vNodes:</span>
              <div className="flex items-center gap-0.5">
                {[3, 5, 10, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => onVNodesCountChange(n)}
                    className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                      vnodesCount === n
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Toggles */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setShowVNodes(!showVNodes)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  showVNodes
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Toggle virtual partition markers on the ring"
              >
                <Layers
                  size={13}
                  className={showVNodes ? 'text-blue-600' : 'text-slate-400'}
                />
                vNodes ({vnodes.length})
              </button>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  showKeys
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Toggle cached key dots on the ring"
              >
                <Key
                  size={13}
                  className={showKeys ? 'text-slate-900' : 'text-slate-400'}
                />
                Keys ({storedKeys.length})
              </button>
            </div>
          </div>
        </div>

        {/* Ring Canvas Body */}
        <div className="p-6 flex flex-col items-center justify-center relative min-h-[500px]">
          <div className="relative w-full max-w-[500px]">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* Underlying thick ring track background */}
              <circle
                cx={C}
                cy={C}
                r={OUTER}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={OUTER - INNER}
              />
              <circle cx={C} cy={C} r={INNER} fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx={C} cy={C} r={OUTER} fill="none" stroke="#e2e8f0" strokeWidth="1" />

              {/* Hash space coordinate markers */}
              {[
                { deg: 0, label: '0x00000000 (0°)' },
                { deg: 90, label: '0x40000000 (90°)' },
                { deg: 180, label: '0x80000000 (180°)' },
                { deg: 270, label: '0xC0000000 (270°)' },
              ].map(({ deg, label }) => {
                const tickIn = polar(C, C, INNER - 8, deg);
                const tickOut = polar(C, C, OUTER + 8, deg);
                const textPos = polar(C, C, OUTER + 22, deg);
                return (
                  <g key={deg}>
                    <line
                      x1={tickIn.x}
                      y1={tickIn.y}
                      x2={tickOut.x}
                      y2={tickOut.y}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y + 3}
                      fontSize="9"
                      fontWeight="600"
                      fill="#64748b"
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Thick Partition Arcs (40px band) */}
              {partitions.map((part, i) => {
                const isHighlighted =
                  highlightNode === null || highlightNode === part.physicalNodeId;
                return (
                  <path
                    key={i}
                    d={arc(C, C, INNER, OUTER, part.startAngle, part.endAngle)}
                    fill={part.color}
                    opacity={isHighlighted ? 0.9 : 0.15}
                    className="transition-opacity duration-150 cursor-pointer"
                    onClick={() => {
                      const pNode = physicalNodes.find((n) => n.id === part.physicalNodeId);
                      if (pNode) onSelectNode(pNode);
                    }}
                  />
                );
              })}

              {/* Partition Dividers (Sharp white cutlines between partitions) */}
              {partitions.map((part, i) => {
                const p1 = polar(C, C, INNER - 1, part.startAngle);
                const p2 = polar(C, C, OUTER + 1, part.startAngle);
                return (
                  <line
                    key={`div-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                );
              })}

              {/* Virtual Node Pins (placed along outer edge of the thick ring) */}
              {showVNodes &&
                vnodes.map((vn) => {
                  const pos = polar(C, C, OUTER, vn.angle);
                  const pNode = physicalNodes.find((n) => n.id === vn.physicalNodeId);
                  const isHighlighted =
                    highlightNode === null || highlightNode === vn.physicalNodeId;
                  const isHovered = hoveredVNode?.id === vn.id;
                  const isOffline = pNode?.status === 'offline';

                  return (
                    <g
                      key={vn.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredVNode(vn)}
                      onMouseLeave={() => setHoveredVNode(null)}
                      onClick={() => pNode && onSelectNode(pNode)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 6 : 4}
                        fill={isOffline ? '#94a3b8' : pNode?.color || '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity={isHighlighted ? 1 : 0.2}
                        filter="url(#shadow)"
                      />
                    </g>
                  );
                })}

              {/* Stored Key Markers on Outer Orbit */}
              {showKeys &&
                storedKeys.map((item, idx) => {
                  const angle = (item.keyHash / 0xffffffff) * 360;
                  const pos = polar(C, C, KEYS_R, angle);
                  const isLast = lastOperation?.key === item.key;
                  const isHovered = hoveredKey?.key === item.key;

                  return (
                    <g
                      key={`${item.key}-${idx}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredKey(item)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered || isLast ? 6 : 4}
                        fill={isLast ? '#dc2626' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="url(#shadow)"
                      />
                    </g>
                  );
                })}

              {/* Routing Vector for Last Operation */}
              {lastOperation?.targetVNode && (() => {
                const kPos = polar(C, C, KEYS_R, lastOperation.angle);
                const vPos = polar(C, C, OUTER, lastOperation.targetVNode.angle);
                return (
                  <line
                    x1={kPos.x}
                    y1={kPos.y}
                    x2={vPos.x}
                    y2={vPos.y}
                    stroke="#dc2626"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                );
              })()}

              {/* Central Hub */}
              <g transform={`translate(${C},${C})`}>
                <circle cx={0} cy={0} r={72} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                <circle cx={0} cy={0} r={62} fill="#f8fafc" />
                <text
                  x={0}
                  y={-12}
                  fontSize="9"
                  fontWeight="700"
                  fill="#64748b"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  LOAD BALANCE
                </text>
                <text
                  x={0}
                  y={13}
                  fontSize="24"
                  fontWeight="800"
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {uniformity.uniformityScore}%
                </text>
                <text
                  x={0}
                  y={29}
                  fontSize="10"
                  fontWeight="600"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  σ = ±{uniformity.stdDev.toFixed(1)}%
                </text>
              </g>
            </svg>
          </div>

          {/* Active Hover Inspector */}
          {(hoveredVNode || hoveredKey) && (
            <div className="absolute bottom-4 left-6 right-6 bg-slate-900 text-white rounded-lg px-5 py-3 text-xs flex items-center justify-between shadow-xl">
              {hoveredVNode ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Virtual Partition:</span>
                    <span className="font-bold text-white">{hoveredVNode.id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300 font-medium">
                    <span>Angle: {hoveredVNode.angle.toFixed(1)}°</span>
                    <span className="font-mono text-[11px]">
                      Hash: {formatHexHash(hoveredVNode.hash)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Key:</span>
                    <span className="font-bold text-white">{hoveredKey?.key}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300 font-medium">
                    <span className="font-mono text-[11px]">
                      Hash: {hoveredKey && formatHexHash(hoveredKey.keyHash)}
                    </span>
                    <span>
                      Angle: {hoveredKey && ((hoveredKey.keyHash / 0xffffffff) * 360).toFixed(1)}°
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (4 cols): Node Distribution Breakdown Table Card */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Partition Ownership
          </span>
          <span className="text-xs font-bold text-slate-500">
            {physicalNodes.length} Nodes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {physicalNodes.map((node) => {
            const share = shares.find((s) => s.nodeId === node.id)?.sharePercent || 0;
            const isSelected = highlightNode === node.id;
            const keysOnNode = storedKeys.filter(
              (k) =>
                ring.lookup(k.key, 1, false).primaryNode?.id === node.id
            ).length;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHighlightNode(node.id)}
                onMouseLeave={() => setHighlightNode(null)}
                onClick={() => onSelectNode(node)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{node.name}</span>
                      {node.status === 'offline' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {node.ip}:{node.port}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">{share.toFixed(1)}%</div>
                  <div className="text-[11px] font-medium text-slate-500">{keysOnNode} keys</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-medium">
          <span>Ring Circumference</span>
          <span className="text-slate-900 font-bold">360° Closed Loop</span>
        </div>
      </div>
    </div>
  );
};
