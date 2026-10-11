'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  HelpCircle,
  Layers,
  Server,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ProjectReportModalProps {
  onClose: () => void;
}

export const ProjectReportModal: React.FC<ProjectReportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'viva'>('report');
  const [expandedViva, setExpandedViva] = useState<number | null>(0);

  const handlePrint = () => {
    window.print();
  };

  const vivaQuestions = [
    {
      q: '1. What is the fundamental problem with naive modulo hashing (hash(key) % N)?',
      a: 'In naive modulo hashing, when the cluster scales from N to N+1 nodes (or when a node fails, N-1), the divisor changes. This causes approximately N/(N+1) ≈ 80-90% of all keys to re-hash to an entirely different node. In production, this causes a catastrophic "Cache Stampede" where the underlying database is slammed with millions of misses simultaneously, causing service collapse.',
    },
    {
      q: '2. How does Consistent Hashing solve this problem?',
      a: 'Consistent Hashing maps both keys and servers to a circular continuum (a 32-bit hash ring from 0 to 2³²-1). Keys are assigned to the first server encountered moving clockwise. When a node is added or removed, only keys residing on the immediately adjacent arc need to be migrated (approximately 1/(N+1) of total keys). All other nodes and keys remain completely unaffected.',
    },
    {
      q: '3. What are Virtual Nodes (vnodes) and why are they necessary?',
      a: 'If each physical server only had 1 point on the ring, standard hash variance would lead to unequal arc intervals, creating "hotspots" where one server owns 60% of the ring while another owns 10%. By assigning multiple virtual nodes (e.g., 5 to 50 vnodes) per physical machine, tokens are interleaved uniformly around the 360° ring. This reduces the standard deviation of data partition ownership and ensures balanced memory and CPU utilization.',
    },
    {
      q: '4. What is the lookup time complexity in a Consistent Hash Ring?',
      a: 'With M total virtual nodes (N physical nodes × V virtual nodes per server), the ring maintains a sorted array of 32-bit integer hashes. Using binary search (upper_bound / bisect), finding the successor server takes O(log M) time. In constant time O(1), the request is then dispatched via TCP/RPC to the storage node.',
    },
    {
      q: '5. How is Fault Tolerance and High Availability achieved?',
      a: 'Using Dynamo-style clockwise replication. A Replication Factor R (e.g. R=2 or R=3) is configured. When a key is written, the coordinator server stores the primary copy and asynchronously forwards the data to the next R-1 distinct physical servers clockwise on the ring. If the primary node crashes, read requests automatically fail over to the first live replica, preventing cache misses.',
    },
    {
      q: '6. What cache eviction policies are supported in each node?',
      a: 'Nodes support LRU (Least Recently Used), LFU (Least Frequently Used), and FIFO (First In First Out), along with TTL (Time-To-Live) countdown expiration. When a node memory limit is reached, the configured policy identifies the optimal victim entry to prune.',
    },
    {
      q: '7. How does this compare with production industry systems?',
      a: 'This architecture is identical to the foundation of Amazon DynamoDB, Apache Cassandra, Discord voice channel routing, Memcached client-side consistent hashing (Ketama algorithm), and Akamai Content Delivery Network edge caching.',
    },
    {
      q: '8. Explain the CAP theorem trade-offs in this distributed cache architecture.',
      a: 'Distributed caches prioritize Availability and Partition Tolerance (AP) with eventual consistency. In our system, with replication factor R, client reads still succeed even during network partitions or node failures by querying replica nodes along the ring.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Distributed Cache with Consistent Hashing: System Architecture
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="cursor-pointer text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-3 border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('report')}
            className={`cursor-pointer pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Technical Specification Document
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`cursor-pointer pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'viva'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Evaluation & Defense Q&A
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-slate-700 text-xs sm:text-sm">
          {activeTab === 'report' ? (
            <div className="space-y-5 print:text-black">
              {/* System Architecture Specifications */}
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div>
                  <span className="text-slate-500 block text-[11px]">Ring Architecture</span>
                  <strong className="text-slate-900 font-mono">Dynamo Ring + VNodes</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Hash Space</span>
                  <strong className="text-slate-900 font-mono">32-Bit Scalar [0, 2³²-1]</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Replication Factor</span>
                  <strong className="text-slate-900 font-mono">R = 1, 2, 3 (Quorum)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Eviction Policies</span>
                  <strong className="text-slate-900 font-mono">LRU • LFU • FIFO • TTL</strong>
                </div>
              </div>

              {/* Abstract */}
              <section className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Abstract & Problem Statement
                </h3>
                <p className="leading-relaxed text-slate-600 text-xs">
                  In distributed key-value stores, naive modular hashing (<code>serverIndex = hash(key) % N</code>) creates severe architectural instability: resizing the cluster by adding or removing a node alters the denominator for all keys, causing 80-90% of stored items to re-hash to incorrect servers. This initiates the catastrophic <em>Cache Stampede</em> where backend databases collapse under sudden load.
                </p>
                <p className="leading-relaxed text-slate-600 text-xs">
                  This system implements <strong>Consistent Hashing</strong> across a 32-bit scalar ring `[0, 2³² - 1]`. By decoupling key placement from node count and incorporating virtual node replication, data reassignment during cluster resizing is strictly bounded to <code>1/(N+1)</code>.
                </p>
              </section>

              {/* Key Architectural Components */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Architectural Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1">
                    <strong className="text-slate-900 block font-semibold">
                      360° Circular Hash Ring
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      Deterministic Murmur3 / FNV-1a scalar hashing mapping keys and server tokens onto a continuous ring.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1">
                    <strong className="text-slate-900 block font-semibold">
                      Virtual Nodes (VNodes)
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      Token interleaving across the perimeter eliminating non-uniform partition skew and memory hotspots.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1">
                    <strong className="text-slate-900 block font-semibold">
                      Quorum Replication (R)
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      Clockwise multi-replica persistence ensuring seamless read failover during server hardware failure.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1">
                    <strong className="text-slate-900 block font-semibold">
                      Autonomous Memory Store
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      Per-server memory management with LRU, LFU, and FIFO eviction scheduling and TTL expiration sweep.
                    </p>
                  </div>
                </div>
              </section>

              {/* Mathematical Proof */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Computational Complexity Analysis
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 font-semibold text-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2 border-b border-slate-200">Operation</th>
                        <th className="p-2 border-b border-slate-200">Complexity</th>
                        <th className="p-2 border-b border-slate-200 font-sans">Implementation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="p-2 font-semibold">Key Hash Mapping</td>
                        <td className="p-2 text-blue-700">O(L)</td>
                        <td className="p-2 font-sans text-slate-600">32-bit Murmur3 string hashing</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Successor Ring Search</td>
                        <td className="p-2 text-blue-700">O(log M)</td>
                        <td className="p-2 font-sans text-slate-600">Binary search over M = N × V sorted vnodes</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Node Scaling Rebalance Churn</td>
                        <td className="p-2 text-emerald-700">O(K / N)</td>
                        <td className="p-2 font-sans text-slate-600">Only ~1/(N+1) fraction of keys migrate</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">Naive Modulo Scaling Churn</td>
                        <td className="p-2 text-rose-700">O(K × (N/(N+1)))</td>
                        <td className="p-2 font-sans text-slate-600">~80-90% keys invalidated (Stampede)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            /* Viva Cheat Sheet */
            <div className="space-y-2.5">
              {vivaQuestions.map((item, idx) => {
                const isOpen = expandedViva === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedViva(isOpen ? null : idx)}
                      className="cursor-pointer w-full p-3 text-left font-semibold text-slate-900 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors text-xs"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
