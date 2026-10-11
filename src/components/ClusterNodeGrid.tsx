'use client';

import React, { useState } from 'react';
import { PhysicalNode, CacheItem, EvictionPolicy } from '../lib/types';
import {
  Server,
  Plus,
  Trash2,
  Power,
  HardDrive,
  Database,
  Layers,
  Settings,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface ClusterNodeGridProps {
  nodes: PhysicalNode[];
  nodeStores: Map<string, CacheItem[]>;
  nodeShares: { nodeId: string; sharePercent: number }[];
  onToggleNodeStatus: (nodeId: string) => void;
  onFlushNode: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onInspectNode: (node: PhysicalNode) => void;
  onAddNode: (newNode: {
    name: string;
    ip: string;
    port: number;
    color: string;
    vnodesCount: number;
    memoryCapacity: number;
    evictionPolicy: EvictionPolicy;
  }) => void;
}

export const ClusterNodeGrid: React.FC<ClusterNodeGridProps> = ({
  nodes,
  nodeStores,
  nodeShares,
  onToggleNodeStatus,
  onFlushNode,
  onRemoveNode,
  onInspectNode,
  onAddNode,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState(`Node ${String.fromCharCode(65 + nodes.length)}`);
  const [newNodeIp, setNewNodeIp] = useState(`192.168.1.${105 + nodes.length}`);
  const [newNodePort, setNewNodePort] = useState(8080 + nodes.length);
  const [newNodeVNodes, setNewNodeVNodes] = useState(5);
  const [newNodeCapacity, setNewNodeCapacity] = useState(12);
  const [newNodePolicy, setNewNodePolicy] = useState<EvictionPolicy>('LRU');
  const [newNodeColor, setNewNodeColor] = useState('#0891b2');

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNode({
      name: newNodeName,
      ip: newNodeIp,
      port: Number(newNodePort),
      color: newNodeColor,
      vnodesCount: Number(newNodeVNodes),
      memoryCapacity: Number(newNodeCapacity),
      evictionPolicy: newNodePolicy,
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            Storage Node Topology ({nodes.filter((n) => n.status !== 'offline').length} of {nodes.length} Online)
          </h2>
          <p className="text-xs text-slate-500">
            Each server acts as an autonomous in-memory cache replica with configurable eviction policies and capacity.
          </p>
        </div>

        <button
          onClick={() => {
            setNewNodeName(`Node ${String.fromCharCode(65 + nodes.length)}`);
            setNewNodeIp(`192.168.1.${105 + nodes.length}`);
            setNewNodePort(8080 + nodes.length);
            setShowAddModal(true);
          }}
          className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Provision Node
        </button>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const items = nodeStores.get(node.id) || [];
          const primaryCount = items.filter((i) => !i.isReplica).length;
          const replicaCount = items.filter((i) => i.isReplica).length;
          const totalHits = node.stats.hits;
          const totalQueries = node.stats.hits + node.stats.misses;
          const hitRate = totalQueries > 0 ? Math.round((totalHits / totalQueries) * 100) : 0;
          const share = nodeShares.find((s) => s.nodeId === node.id)?.sharePercent || 0;
          const usagePercent = Math.min(100, Math.round((items.length / node.memoryCapacity) * 100));
          const isOffline = node.status === 'offline';

          return (
            <div
              key={node.id}
              className={`bg-white rounded-xl border transition-all flex flex-col justify-between ${
                isOffline
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: node.color }}
                    />
                    <h3 className="font-bold text-slate-900 text-sm">{node.name}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isOffline
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOffline ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    {isOffline ? 'FAILED' : 'HEALTHY'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>{node.ip}:{node.port}</span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    {share.toFixed(1)}% Ring
                  </span>
                </div>
              </div>

              {/* Memory & Eviction Section */}
              <div className="p-4 space-y-3 text-xs">
                {/* Memory Usage Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="text-slate-500 font-medium">Memory Capacity</span>
                    <span className="font-mono font-bold text-slate-800">
                      {items.length} / {node.memoryCapacity} Keys
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usagePercent > 80
                          ? 'bg-rose-500'
                          : usagePercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Primary vs Replica, Policy */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[10px]">Primary / Replica</span>
                    <strong className="text-slate-800 font-mono">
                      {primaryCount} / {replicaCount}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[10px]">Eviction Policy</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {node.evictionPolicy}
                    </strong>
                  </div>
                </div>

                {/* Hit Rate & Evictions */}
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-slate-600">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block">Hit Ratio</span>
                    <strong className="text-slate-800 font-mono font-bold">{hitRate}%</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block">Hits</span>
                    <strong className="text-slate-800 font-mono font-bold">{node.stats.hits}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block">Evicted</span>
                    <strong className="text-slate-800 font-mono font-bold">{node.stats.evictions}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onInspectNode(node)}
                  className="cursor-pointer flex-1 bg-white hover:bg-slate-100 text-slate-700 font-medium py-1.5 px-2 rounded border border-slate-200 text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Database className="w-3 h-3 text-slate-600" />
                  Inspect Keys
                </button>

                <button
                  onClick={() => onToggleNodeStatus(node.id)}
                  title={isOffline ? 'Recover Server' : 'Simulate Failure / Crash'}
                  className={`cursor-pointer px-2 py-1.5 rounded border text-xs font-medium transition-colors flex items-center gap-1 ${
                    isOffline
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOffline ? 'Recover' : 'Fail'}</span>
                </button>

                <button
                  onClick={() => onFlushNode(node.id)}
                  title="Flush Cache Store"
                  className="cursor-pointer p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Storage Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-700" />
                Scale Cluster: Provision Storage Node
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Node Identifier</label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    value={newNodeIp}
                    onChange={(e) => setNewNodeIp(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={newNodePort}
                    onChange={(e) => setNewNodePort(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Virtual Nodes (VNodes)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newNodeVNodes}
                    onChange={(e) => setNewNodeVNodes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Memory Capacity (Keys)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newNodeCapacity}
                    onChange={(e) => setNewNodeCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Eviction Policy</label>
                  <select
                    value={newNodePolicy}
                    onChange={(e) => setNewNodePolicy(e.target.value as EvictionPolicy)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="LRU">LRU (Least Recently Used)</option>
                    <option value="LFU">LFU (Least Frequently Used)</option>
                    <option value="FIFO">FIFO (First In First Out)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Node Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newNodeColor}
                      onChange={(e) => setNewNodeColor(e.target.value)}
                      className="w-8 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                    />
                    <span className="font-mono text-slate-600">{newNodeColor}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <strong>Dynamic Rebalancing Note:</strong> Adding this node inserts its virtual tokens onto the ring. Consistent hashing limits data migration strictly to adjacent arcs (~1/(N+1) keys).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded text-xs shadow-2xs transition-colors"
                >
                  Provision Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
