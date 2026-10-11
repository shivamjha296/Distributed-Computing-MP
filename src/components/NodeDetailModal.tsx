'use client';

import React from 'react';
import { PhysicalNode, CacheItem } from '../lib/types';
import { formatHexHash } from '../lib/hashAlgorithms';
import {
  Server,
  HardDrive,
  Database,
  Trash2,
  Clock,
  Zap,
  Activity,
  Layers,
  Shield,
  Eye,
} from 'lucide-react';

interface NodeDetailModalProps {
  node: PhysicalNode | null;
  items: CacheItem[];
  onClose: () => void;
  onDeleteItem: (key: string) => void;
  onTouchItem: (key: string) => void;
  onFlushNode: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  items,
  onClose,
  onDeleteItem,
  onTouchItem,
  onFlushNode,
}) => {
  if (!node) return null;

  const primaryItems = items.filter((i) => !i.isReplica);
  const replicaItems = items.filter((i) => i.isReplica);
  const now = Date.now();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shadow-xs"
              style={{ backgroundColor: node.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{node.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    node.status === 'offline'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {node.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {node.ip}:{node.port} • Eviction: {node.evictionPolicy} • Capacity: {items.length}/{node.memoryCapacity} Keys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlushNode(node.id)}
              className="cursor-pointer text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Flush Cache
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-400 block text-[10px]">Primary Keys</span>
            <strong className="text-slate-900 font-bold text-sm">{primaryItems.length}</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-400 block text-[10px]">Replicated Keys</span>
            <strong className="text-amber-600 font-bold text-sm">{replicaItems.length}</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-400 block text-[10px]">Hits / Misses</span>
            <strong className="text-emerald-700 font-bold text-sm">
              {node.stats.hits} / {node.stats.misses}
            </strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
            <span className="text-slate-400 block text-[10px]">Evictions Triggered</span>
            <strong className="text-rose-600 font-bold text-sm">{node.stats.evictions}</strong>
          </div>
        </div>

        {/* Items List Table */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              This storage node is currently empty.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Key & Type</th>
                    <th className="py-2.5 px-3">Cached Value</th>
                    <th className="py-2.5 px-3">Hash (Hex)</th>
                    <th className="py-2.5 px-3 text-center">Access Count (LFU)</th>
                    <th className="py-2.5 px-3">TTL Remaining</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const remainingSeconds = item.expiresAt
                      ? Math.max(0, Math.round((item.expiresAt - now) / 1000))
                      : null;

                    return (
                      <tr key={item.key} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                item.isReplica
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {item.isReplica ? 'REPLICA' : 'PRIMARY'}
                            </span>
                            <span className="font-mono font-semibold text-slate-900">
                              {item.key}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px] truncate font-mono text-[11px] text-slate-600">
                          {item.value}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                          {formatHexHash(item.keyHash)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">
                          {item.accessCount}
                        </td>
                        <td className="py-2.5 px-3">
                          {remainingSeconds !== null ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ⏱ {remainingSeconds}s
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">∞ No Expiry</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => onTouchItem(item.key)}
                            title="Touch key to test LRU/LFU update"
                            className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-md transition-colors"
                          >
                            Touch
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.key)}
                            title="Delete Key"
                            className="cursor-pointer text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2 py-1 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
