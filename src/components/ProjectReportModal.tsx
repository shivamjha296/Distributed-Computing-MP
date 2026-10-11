'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  CheckCircle2,
  HelpCircle,
  Layers,
  Server,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Download,
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
      a: 'In naive modulo hashing, when the cluster scales from N to N+1 nodes (or when a node fails, N-1), the divisor changes. This causes virtually every key (approximately N/(N+1) ≈ 80-90% of keys) to re-hash to an entirely different node. In a production system, this triggers a catastrophic "Cache Stampede" where the underlying database is slammed with millions of misses simultaneously, causing service downtime.',
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
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Distributed Cache with Consistent Hashing (DC Micro-Project)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="cursor-pointer text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
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
        <div className="flex items-center gap-2 pt-4 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('report')}
            className={`cursor-pointer pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Project Documentation & Specifications
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`cursor-pointer pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'viva'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Viva-Voce Oral Exam Cheat Sheet (Top 8 Q&A)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 text-slate-700 text-xs sm:text-sm">
          {activeTab === 'report' ? (
            <div className="space-y-6 print:text-black">
              {/* Project Meta Box */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Topic Number</span>
                  <strong className="text-slate-900 font-bold text-sm">Topic #9</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Subject</span>
                  <strong className="text-slate-900 font-bold">Distributed Computing (DC)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Batch</span>
                  <strong className="text-slate-900 font-bold">D17B / D17C</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Faculty Guide</span>
                  <strong className="text-indigo-700 font-bold">Prof. Priti Joshi</strong>
                </div>
              </div>

              {/* Abstract */}
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  1. Abstract & Problem Statement
                </h3>
                <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
                  In large-scale distributed architectures, caching layers are partitioned across multiple physical servers. The standard naive approach of assigning keys using modular arithmetic (<code>serverIndex = hash(key) % N</code>) suffers from severe instability: whenever a cache node is added (scale-out) or crashes (scale-in), the modulo divisor changes, causing up to 80-90% of all cached keys to map to incorrect servers. This results in the infamous <em>Cache Stampede</em> where backend storage systems are flooded with simultaneous read misses.
                </p>
                <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
                  This micro-project implements and simulates a full-featured <strong>Distributed Cache with Consistent Hashing</strong>. By modeling a circular 32-bit hash continuum with virtual node replication, data reassignment during cluster resizing is strictly bounded to <code>1/(N+1)</code>, ensuring continuous cache hit rates and high availability.
                </p>
              </section>

              {/* Key Architectural Components */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  2. Architectural Modules Implemented
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-bold block">
                      360° Circular Hash Ring
                    </strong>
                    <p className="text-slate-600">
                      Scalar hash space of [0, 2³² - 1] mapped to [0°, 360°]. Nodes and keys are positioned deterministically using Murmur3 / FNV-1a.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-bold block">
                      Virtual Nodes (VNodes)
                    </strong>
                    <p className="text-slate-600">
                      Configurable token dispersion (1 to 20 vnodes per physical machine) to eliminate non-uniform data skew and hotspots.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-bold block">
                      Dynamo-Style Quorum Replication (R)
                    </strong>
                    <p className="text-slate-600">
                      Asynchronous multi-replica forwarding across the next distinct physical nodes on the ring for complete crash resilience.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <strong className="text-slate-900 font-bold block">
                      Multi-Policy In-Memory Engine
                    </strong>
                    <p className="text-slate-600">
                      Per-node autonomous memory storage with real-time TTL countdown sweep and LRU/LFU/FIFO eviction triggers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Mathematical Proof */}
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  3. Mathematical Complexity & Performance
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5">Operation</th>
                        <th className="p-2.5">Complexity</th>
                        <th className="p-2.5">Mechanism</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-semibold">Key Hash Mapping</td>
                        <td className="p-2.5 font-mono text-indigo-600">O(L)</td>
                        <td className="p-2.5">Murmur3-32 bit string hashing</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold">Successor Ring Search</td>
                        <td className="p-2.5 font-mono text-indigo-600">O(log M)</td>
                        <td className="p-2.5">Binary search over M = N × V sorted vnodes</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold">Node Scaling Rebalance Churn</td>
                        <td className="p-2.5 font-mono text-emerald-600">O(K / N)</td>
                        <td className="p-2.5">Only ~1/(N+1) fraction of keys migrate</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold">Naive Modulo Scaling Churn</td>
                        <td className="p-2.5 font-mono text-rose-600">O(K × (N/(N+1)))</td>
                        <td className="p-2.5">~80-90% keys invalidated (Stampede)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Group Signoff */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Department of Computer Engineering
                  </span>
                  <span className="text-slate-500">
                    VESIT (Vivekanand Education Society's Institute of Technology)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-indigo-700 block">
                    Academic Year 2026-2027
                  </span>
                  <span className="text-slate-500">
                    Micro-Project Submission Document
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Viva Cheat Sheet */
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Viva-Voce Preparation:</strong> These 8 questions represent the most frequently asked theoretical and design concepts by lab examiners for Distributed Cache & Consistent Hashing.
                </p>
              </div>

              {vivaQuestions.map((item, idx) => {
                const isOpen = expandedViva === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedViva(isOpen ? null : idx)}
                      className="cursor-pointer w-full p-3.5 sm:p-4 text-left font-bold text-slate-900 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
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
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
