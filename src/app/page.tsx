'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DistributedCacheCluster } from '../lib/cacheCluster';
import { INITIAL_NODES, WORKLOAD_PRESETS } from '../lib/presets';
import {
  PhysicalNode,
  CacheItem,
  CacheOperationResult,
  EvictionPolicy,
  HashAlgorithm,
  WorkloadPreset,
} from '../lib/types';
import { Navbar } from '../components/Navbar';
import { HashRingVisualizer } from '../components/HashRingVisualizer';
import { ClusterNodeGrid } from '../components/ClusterNodeGrid';
import { InteractiveConsole } from '../components/InteractiveConsole';
import { StepTraceDrawer } from '../components/StepTraceDrawer';
import { RebalanceBenchmarkView } from '../components/RebalanceBenchmarkModal';
import { NodeDetailModal } from '../components/NodeDetailModal';
import { TrafficSimulator } from '../components/TrafficSimulator';
import { ProjectReportModal } from '../components/ProjectReportModal';
import {
  Server,
  Layers,
  Activity,
  BarChart3,
  Clock,
  Compass,
  Database,
  Terminal,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  // Main cluster instance in ref
  const clusterRef = useRef<DistributedCacheCluster | null>(null);
  const [clusterVersion, setClusterVersion] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize cluster once
  if (!clusterRef.current) {
    const cluster = new DistributedCacheCluster(INITIAL_NODES, {
      replicationFactor: 2,
      hashAlgorithm: 'murmur3',
      simulatedNetworkLatencyMs: 12,
    });
    clusterRef.current = cluster;
  }

  const cluster = clusterRef.current;

  // Populate presets on client mount
  useEffect(() => {
    setIsMounted(true);
    if (clusterRef.current && clusterRef.current.getAllStoredKeys().length === 0) {
      clusterRef.current.populatePreset(WORKLOAD_PRESETS[0].sampleKeys);
      setClusterVersion((v) => v + 1);
    }
  }, []);

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<
    'visualizer' | 'nodes' | 'console' | 'benchmark' | 'traffic' | 'report'
  >('visualizer');
  const [selectedNodeForInspect, setSelectedNodeForInspect] = useState<PhysicalNode | null>(null);
  const [activeTraceOperation, setActiveTraceOperation] = useState<CacheOperationResult | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Configuration states
  const [vnodesCount, setVnodesCount] = useState(5);
  const [replicationFactor, setReplicationFactor] = useState(2);
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('murmur3');

  // Trigger UI re-render helper
  const notifyMutation = () => setClusterVersion((v) => v + 1);

  // Background TTL sweep every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      if (clusterRef.current) {
        const expired = clusterRef.current.sweepExpiredKeys();
        if (expired > 0) {
          notifyMutation();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update vnodes dynamically across all nodes
  const handleVNodesChange = (newCount: number) => {
    setVnodesCount(newCount);
    for (const node of cluster.getNodes()) {
      node.vnodesCount = newCount;
      cluster.getRing().updateNode(node);
    }
    cluster.rebalanceKeys();
    notifyMutation();
  };

  // Update replication factor
  const handleReplicationFactorChange = (r: number) => {
    setReplicationFactor(r);
    cluster.updateConfig({ replicationFactor: r });
    cluster.rebalanceKeys();
    notifyMutation();
  };

  // Update hash algorithm
  const handleHashAlgorithmChange = (algo: HashAlgorithm) => {
    setHashAlgorithm(algo);
    cluster.updateConfig({ hashAlgorithm: algo });
    cluster.rebalanceKeys();
    notifyMutation();
  };

  // Node operations
  const handleToggleNodeStatus = (nodeId: string) => {
    const node = cluster.getRing().getPhysicalNode(nodeId);
    if (node) {
      const nextStatus = node.status === 'offline' ? 'online' : 'offline';
      cluster.setNodeStatus(nodeId, nextStatus);
      notifyMutation();
    }
  };

  const handleFlushNode = (nodeId: string) => {
    cluster.flushNode(nodeId);
    notifyMutation();
  };

  const handleRemoveNode = (nodeId: string) => {
    cluster.removeNode(nodeId);
    notifyMutation();
  };

  const handleAddNode = (newNodeData: {
    name: string;
    ip: string;
    port: number;
    color: string;
    vnodesCount: number;
    memoryCapacity: number;
    evictionPolicy: EvictionPolicy;
  }) => {
    const newNode: PhysicalNode = {
      id: `node-${Date.now()}`,
      ...newNodeData,
      weight: 1,
      status: 'online',
      createdAt: Date.now(),
      stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
    };
    cluster.addNode(newNode);
    notifyMutation();
  };

  // Cache queries
  const handleGet = (key: string): CacheOperationResult => {
    const res = cluster.get(key);
    notifyMutation();
    return res;
  };

  const handleSet = (key: string, value: string, ttl?: number): CacheOperationResult => {
    const res = cluster.set(key, value, ttl);
    notifyMutation();
    return res;
  };

  const handleDelete = (key: string): CacheOperationResult => {
    const res = cluster.delete(key);
    notifyMutation();
    return res;
  };

  const handlePopulatePreset = (preset: WorkloadPreset) => {
    cluster.populatePreset(preset.sampleKeys);
    notifyMutation();
  };

  const handleResetCluster = () => {
    cluster.flushAll();
    cluster.populatePreset(WORKLOAD_PRESETS[0].sampleKeys);
    notifyMutation();
  };

  // Derived cluster data
  const nodes = cluster.getNodes();
  const onlineNodes = nodes.filter((n) => n.status !== 'offline');
  const storedKeys = cluster.getAllStoredKeys();
  const history = cluster.getOperationHistory();
  const lastOperation = history[0];

  const totalHits = nodes.reduce((acc, n) => acc + n.stats.hits, 0);
  const totalMisses = nodes.reduce((acc, n) => acc + n.stats.misses, 0);
  const totalQueries = totalHits + totalMisses;
  const hitRatePercent = totalQueries > 0 ? Math.round((totalHits / totalQueries) * 100) : 0;

  const nodeStores = useMemo(() => {
    const map = new Map<string, CacheItem[]>();
    for (const n of nodes) {
      map.set(n.id, cluster.getNodeStore(n.id));
    }
    return map;
  }, [nodes, clusterVersion]);

  const nodeShares = cluster.getRing().getNodeShares();
  const uniformity = cluster.getRing().getUniformityMetrics();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (t === 'report') {
            setShowReportModal(true);
          } else {
            setActiveTab(t);
          }
        }}
        onlineNodeCount={onlineNodes.length}
        totalNodeCount={nodes.length}
        totalKeys={storedKeys.length}
        hitRatePercent={hitRatePercent}
        onResetCluster={handleResetCluster}
        onOpenReport={() => setShowReportModal(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 w-full space-y-5 flex-1">
        {/* KPI Summary Tiles */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              Active Nodes
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {onlineNodes.length}{' '}
              <span className="text-xs font-normal text-slate-400">/ {nodes.length}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
              Online & Routing
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              Virtual Tokens
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {cluster.getRing().getVirtualNodes().length}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              {vnodesCount} vnodes/node
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Cached Items
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {storedKeys.length}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Dynamo Partitioned
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Cache Hit Ratio
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {hitRatePercent}%
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {totalHits} hits / {totalMisses} miss
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Simulated Latency
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              ~{cluster.getConfig().simulatedNetworkLatencyMs}ms
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              O(log M) binary lookup
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              Partition Balance
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {uniformity.uniformityScore}%
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              StdDev: ±{uniformity.stdDev.toFixed(1)}%
            </span>
          </div>
        </section>

        {/* Tab 1: 360 Hash Ring Visualizer */}
        {activeTab === 'visualizer' && (
          <section className="space-y-4">
            <HashRingVisualizer
              ring={cluster.getRing()}
              storedKeys={storedKeys}
              lastOperation={lastOperation}
              vnodesCount={vnodesCount}
              onVNodesCountChange={handleVNodesChange}
              onSelectNode={(node) => setSelectedNodeForInspect(node)}
            />

            {/* Quick Query Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-center md:text-left">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
                  <Terminal className="w-3.5 h-3.5 text-slate-600" />
                  Quick Key Routing Tester
                </h3>
                <p className="text-xs text-slate-500">
                  Execute sample queries to observe real-time clockwise traversal and successor server resolution.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['prod:macbook_pro_m3', 'cart:session_4812', 'video:intro_consistent_hash', 'flash_sale:deal_99'].map(
                  (testKey) => (
                    <button
                      key={testKey}
                      onClick={() => {
                        const res = handleGet(testKey);
                        setActiveTraceOperation(res);
                      }}
                      className="cursor-pointer text-xs font-mono bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded transition-colors"
                    >
                      GET {testKey}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Storage Nodes & Servers Grid */}
        {activeTab === 'nodes' && (
          <section>
            <ClusterNodeGrid
              nodes={nodes}
              nodeStores={nodeStores}
              nodeShares={nodeShares}
              onToggleNodeStatus={handleToggleNodeStatus}
              onFlushNode={handleFlushNode}
              onRemoveNode={handleRemoveNode}
              onInspectNode={(node) => setSelectedNodeForInspect(node)}
              onAddNode={handleAddNode}
            />
          </section>
        )}

        {/* Tab 3: Interactive Query Console & Tracer */}
        {activeTab === 'console' && (
          <section>
            <InteractiveConsole
              onGet={handleGet}
              onSet={handleSet}
              onDelete={handleDelete}
              onPopulatePreset={handlePopulatePreset}
              lastOperation={lastOperation}
              operationHistory={history}
              replicationFactor={replicationFactor}
              onReplicationFactorChange={handleReplicationFactorChange}
              hashAlgorithm={hashAlgorithm}
              onHashAlgorithmChange={handleHashAlgorithmChange}
              onOpenStepTrace={(op) => setActiveTraceOperation(op)}
            />
          </section>
        )}

        {/* Tab 4: Benchmark Comparison */}
        {activeTab === 'benchmark' && (
          <section>
            <RebalanceBenchmarkView nodes={nodes} />
          </section>
        )}

        {/* Tab 5: Automated Traffic Generator */}
        {activeTab === 'traffic' && (
          <section>
            <TrafficSimulator
              nodes={nodes}
              onExecuteQuery={(key) => handleGet(key)}
              recentOperations={history}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Distributed Cache Engine</span>
            <span>•</span>
            <span>Consistent Hashing Ring & Dynamo-Style Quorum Tier</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            O(log M) Lookup • R-Way Replication • Multi-Policy Eviction
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedNodeForInspect && (
        <NodeDetailModal
          node={selectedNodeForInspect}
          items={nodeStores.get(selectedNodeForInspect.id) || []}
          onClose={() => setSelectedNodeForInspect(null)}
          onDeleteItem={(key) => handleDelete(key)}
          onTouchItem={(key) => handleGet(key)}
          onFlushNode={(id) => handleFlushNode(id)}
        />
      )}

      {activeTraceOperation && (
        <StepTraceDrawer
          operation={activeTraceOperation}
          onClose={() => setActiveTraceOperation(null)}
        />
      )}

      {showReportModal && (
        <ProjectReportModal onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
