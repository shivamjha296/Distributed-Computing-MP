'use client';

import React, { useState } from 'react';
import { PhysicalNode, CacheItem } from '../lib/types';
import { formatHexHash } from '../lib/hashAlgorithms';
import { Trash2, Database, X, Search } from 'lucide-react';

interface NodeDetailModalProps {
  node: PhysicalNode | null;
  items: CacheItem[];
  onClose: () => void;
  onDeleteItem: (key: string) => void;
  onFlushNode: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  items,
  onClose,
  onDeleteItem,
  onFlushNode,
}) => {
  const [filter, setFilter] = useState('');
  if (!node) return null;

  const filteredItems = items.filter((i) =>
    i.key.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: node.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{node.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    node.status === 'offline'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {node.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {node.ip}:{node.port} · {items.length} keys in memory
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlushNode(node.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              Purge All
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter keys in memory..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Table of items */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              <Database size={28} className="mx-auto text-slate-300 mb-2" />
              {items.length === 0 ? 'No keys stored on this node.' : 'No matching keys found.'}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Key</th>
                    <th className="py-3 px-4">Payload</th>
                    <th className="py-3 px-4">Murmur3 Hash</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map((item) => (
                    <tr key={item.key} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{item.key}</td>
                      <td className="py-2.5 px-4 max-w-[200px] truncate text-slate-600 font-medium">
                        {item.value}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatHexHash(item.keyHash)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteItem(item.key)}
                          className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
