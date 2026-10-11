'use client';

import React from 'react';
import { PhysicalNode, CacheItem } from '../lib/types';
import { formatHexHash } from '../lib/hashAlgorithms';
import {
  Server,
  Trash2,
  Database,
  Clock,
  Layers,
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
      <div className="bg-white rounded-xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{node.name} Memory Table</h3>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    node.status === 'offline'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {node.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {node.ip}:{node.port} • Policy: {node.evictionPolicy} • Capacity: {items.length} / {node.memoryCapacity} Keys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlushNode(node.id)}
              className="cursor-pointer text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Flush Node
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-200 text-xs">
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Primary Keys</span>
            <strong className="text-slate-900 font-mono font-bold">{primaryItems.length}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Replicated Keys</span>
            <strong className="text-slate-900 font-mono font-bold">{replicaItems.length}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Hits / Misses</span>
            <strong className="text-slate-900 font-mono font-bold">
              {node.stats.hits} / {node.stats.misses}
            </strong>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Evictions</span>
            <strong className="text-slate-900 font-mono font-bold">{node.stats.evictions}</strong>
          </div>
        </div>

        {/* Items List Table */}
        <div className="flex-1 overflow-y-auto py-3">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Database className="w-6 h-6 mx-auto text-slate-300 mb-1" />
              This storage node is currently empty.
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Key</th>
                    <th className="py-2 px-3">Payload</th>
                    <th className="py-2 px-3">Hash (Hex)</th>
                    <th className="py-2 px-3 text-center">Accesses (LFU)</th>
                    <th className="py-2 px-3">TTL</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {items.map((item) => {
                    const remainingSeconds = item.expiresAt
                      ? Math.max(0, Math.round((item.expiresAt - now) / 1000))
                      : null;

                    return (
                      <tr key={item.key} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                item.isReplica
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {item.isReplica ? 'REPLICA' : 'PRIMARY'}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {item.key}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 max-w-[170px] truncate text-slate-600">
                          {item.value}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {formatHexHash(item.keyHash)}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {item.accessCount}
                        </td>
                        <td className="py-2 px-3">
                          {remainingSeconds !== null ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {remainingSeconds}s
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">∞</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right space-x-1 font-sans">
                          <button
                            onClick={() => onTouchItem(item.key)}
                            title="Touch key to test LRU/LFU update"
                            className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors"
                          >
                            Touch
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.key)}
                            title="Delete Key"
                            className="cursor-pointer text-[10px] text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
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
        <div className="pt-2.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
