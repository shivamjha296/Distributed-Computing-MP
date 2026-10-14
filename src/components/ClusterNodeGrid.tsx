'use client';

import React, { useState } from 'react';
import { PhysicalNode, CacheItem, EvictionPolicy } from '../lib/types';
import { Plus, Trash2, Power, Database, X, Server, CheckCircle2 } from 'lucide-react';

interface ServersProps {
  nodes: PhysicalNode[];
  nodeStores: Map<string, CacheItem[]>;
  nodeShares: { nodeId: string; sharePercent: number }[];
  onToggle: (id: string) => void;
  onFlush: (id: string) => void;
  onRemove: (id: string) => void;
  onInspect: (node: PhysicalNode) => void;
  onAdd: (data: {
    name: string;
    ip: string;
    port: number;
    color: string;
    vnodesCount: number;
    memoryCapacity: number;
    evictionPolicy: EvictionPolicy;
  }) => void;
  vnodesCount: number;
}

export const ServersPanel: React.FC<ServersProps> = ({
  nodes,
  nodeStores,
  nodeShares,
  onToggle,
  onFlush,
  onRemove,
  onInspect,
  onAdd,
  vnodesCount,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');

  const nextSuffix = String.fromCharCode(65 + nodes.length);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: name || `Node ${nextSuffix}`,
      ip: `192.168.1.${100 + nodes.length + 1}`,
      port: 6379 + nodes.length,
      color,
      vnodesCount,
      memoryCapacity: 50,
      evictionPolicy: 'LRU',
    });
    setShowAddModal(false);
    setName('');
  };

  const onlineCount = nodes.filter((n) => n.status !== 'offline').length;
  const totalKeys = Array.from(nodeStores.values()).reduce((acc, items) => acc + items.length, 0);

  return (
    <div className="space-y-6">
      {/* Cluster Node Header */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Node Instances</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Physical cache servers participating in the consistent hashing ring topology
          </p>
        </div>

        <button
          onClick={() => {
            setName(`Node ${nextSuffix}`);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
        >
          <Plus size={14} />
          Provision New Node
        </button>
      </div>

      {/* Node Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Node Instances
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {onlineCount} <span className="text-xs font-normal text-slate-400">/ {nodes.length} online</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Cached Keys
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalKeys}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            vNodes per Node
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{vnodesCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Cluster State
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 size={18} />
            Healthy
          </div>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">Node</th>
                <th className="py-3.5 px-5">Endpoint</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Ring Share</th>
                <th className="py-3.5 px-5">Keys Stored</th>
                <th className="py-3.5 px-5">Throughput</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nodes.map((node) => {
                const items = nodeStores.get(node.id) || [];
                const share = nodeShares.find((s) => s.nodeId === node.id)?.sharePercent || 0;
                const isOffline = node.status === 'offline';

                return (
                  <tr key={node.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Name & Color */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="font-bold text-slate-900 text-xs">{node.name}</span>
                      </div>
                    </td>

                    {/* Endpoint */}
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {node.ip}:{node.port}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                        {isOffline ? 'Offline' : 'Online'}
                      </span>
                    </td>

                    {/* Ring Share */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-18 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, share)}%`,
                              backgroundColor: node.color,
                            }}
                          />
                        </div>
                        <span className="text-slate-800 font-bold">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Keys Stored */}
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {items.length} keys
                    </td>

                    {/* Throughput */}
                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {node.stats.hits} hits · {node.stats.misses} misses
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => onInspect(node)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                      >
                        View Keys
                      </button>
                      <button
                        onClick={() => onToggle(node.id)}
                        className={`px-2.5 py-1 rounded-md border text-xs font-bold cursor-pointer transition-colors ${
                          isOffline
                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isOffline ? 'Activate' : 'Disable'}
                      </button>
                      <button
                        onClick={() => onFlush(node.id)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
                        title="Flush keys on this node"
                      >
                        Purge
                      </button>
                      {nodes.length > 1 && (
                        <button
                          onClick={() => onRemove(node.id)}
                          className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                          title="Remove node and rebalance ring"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Provision New Node</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Node Identifier
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Node E"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#ea580c', '#475569'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        color === c ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Provision & Rebalance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
