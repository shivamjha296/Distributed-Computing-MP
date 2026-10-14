'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DistributedCacheCluster } from '../lib/cacheCluster';
import { INITIAL_NODES, WORKLOAD_PRESETS } from '../lib/presets';
import {
  PhysicalNode,
  CacheItem,
  CacheOperationResult,
  EvictionPolicy,
  WorkloadPreset,
} from '../lib/types';
import { Navbar } from './Navbar';
import { HashRingVisualizer } from './HashRingVisualizer';
import { ServersPanel } from './ClusterNodeGrid';
import { OperationsPanel } from './InteractiveConsole';
import { RoutingStepsModal } from './StepTraceDrawer';
import { BenchmarkPanel } from './RebalanceBenchmarkModal';
import { NodeDetailModal } from './NodeDetailModal';
import { Server, Layers, Database, Zap, PieChart } from 'lucide-react';

export default function CacheRingApp() {
  const clusterRef = useRef<DistributedCacheCluster | null>(null);
  const [tick, setTick] = useState(0);

  if (!clusterRef.current) {
    clusterRef.current = new DistributedCacheCluster(INITIAL_NODES, {
      replicationFactor: 1,
      hashAlgorithm: 'murmur3',
      simulatedNetworkLatencyMs: 8,
    });
  }

  const cluster = clusterRef.current;

  useEffect(() => {
    if (cluster.getAllStoredKeys().length === 0) {
      cluster.populatePreset(WORKLOAD_PRESETS[0].sampleKeys);
      setTick((t) => t + 1);
    }
  }, []);

  const bump = () => setTick((t) => t + 1);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'ring' | 'nodes' | 'operations' | 'benchmark'>('ring');
  const [inspectNode, setInspectNode] = useState<PhysicalNode | null>(null);
  const [traceOp, setTraceOp] = useState<CacheOperationResult | null>(null);
  const [vnodesCount, setVnodesCount] = useState(5);

  // Handlers
  const handleVNodesChange = (n: number) => {
    setVnodesCount(n);
    for (const node of cluster.getNodes()) {
      node.vnodesCount = n;
      cluster.getRing().updateNode(node);
    }
    cluster.rebalanceKeys();
    bump();
  };

  const handleToggle = (id: string) => {
    const node = cluster.getRing().getPhysicalNode(id);
    if (node) {
      cluster.setNodeStatus(id, node.status === 'offline' ? 'online' : 'offline');
      bump();
    }
  };

  const handleFlush = (id: string) => {
    cluster.flushNode(id);
    bump();
  };

  const handleRemove = (id: string) => {
    cluster.removeNode(id);
    bump();
  };

  const handleAdd = (data: {
    name: string;
    ip: string;
    port: number;
    color: string;
    vnodesCount: number;
    memoryCapacity: number;
    evictionPolicy: EvictionPolicy;
  }) => {
    const node: PhysicalNode = {
      id: `node-${Date.now()}`,
      ...data,
      weight: 1,
      status: 'online',
      createdAt: Date.now(),
      stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
    };
    cluster.addNode(node);
    bump();
  };

  const handleGet = (key: string): CacheOperationResult => {
    const r = cluster.get(key);
    bump();
    return r;
  };

  const handleSet = (key: string, value: string): CacheOperationResult => {
    const r = cluster.set(key, value);
    bump();
    return r;
  };

  const handleDelete = (key: string): CacheOperationResult => {
    const r = cluster.delete(key);
    bump();
    return r;
  };

  const handlePreset = (preset: WorkloadPreset) => {
    cluster.populatePreset(preset.sampleKeys);
    bump();
  };

  const handleReset = () => {
    cluster.flushAll();
    cluster.populatePreset(WORKLOAD_PRESETS[0].sampleKeys);
    bump();
  };

  // Derived cluster data
  const nodes = cluster.getNodes();
  const online = nodes.filter((n) => n.status !== 'offline');
  const keys = cluster.getAllStoredKeys();
  const history = cluster.getOperationHistory();
  const hits = nodes.reduce((a, n) => a + n.stats.hits, 0);
  const misses = nodes.reduce((a, n) => a + n.stats.misses, 0);
  const hitRate = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  const nodeStores = useMemo(() => {
    const m = new Map<string, CacheItem[]>();
    nodes.forEach((n) => m.set(n.id, cluster.getNodeStore(n.id)));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const nodeShares = cluster.getRing().getNodeShares();
  const uniformity = cluster.getRing().getUniformityMetrics();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-2" suppressHydrationWarning>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodeCount={online.length}
        keyCount={keys.length}
        hitRate={hitRate}
        onReset={handleReset}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        {/* Section 1: Executive KPI Deck (Cluster Telemetry) */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cluster Telemetry & Health
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Real-time in-memory cluster metrics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <KpiCard
              label="Active Nodes"
              value={`${online.length} / ${nodes.length}`}
              sub="100% online"
              icon={Server}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <KpiCard
              label="Virtual Partitions"
              value={cluster.getRing().getVirtualNodes().length}
              sub={`${vnodesCount} per node`}
              icon={Layers}
              color="text-indigo-600"
              bgColor="bg-indigo-50"
            />
            <KpiCard
              label="Stored Items"
              value={keys.length}
              sub="Across 4 nodes"
              icon={Database}
              color="text-cyan-600"
              bgColor="bg-cyan-50"
            />
            <KpiCard
              label="Cache Hit Ratio"
              value={`${hitRate}%`}
              sub={`${hits} hits · ${misses} misses`}
              icon={Zap}
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <KpiCard
              label="Ring Uniformity"
              value={`${uniformity.uniformityScore}%`}
              sub={`σ = ±${uniformity.stdDev.toFixed(1)}%`}
              icon={PieChart}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          </div>
        </section>

        {/* Section 2: Active Workspace View */}
        <section className="space-y-4">
          {activeTab === 'ring' && (
            <HashRingVisualizer
              ring={cluster.getRing()}
              storedKeys={keys}
              lastOperation={history[0]}
              vnodesCount={vnodesCount}
              onVNodesCountChange={handleVNodesChange}
              onSelectNode={setInspectNode}
            />
          )}

          {activeTab === 'nodes' && (
            <ServersPanel
              nodes={nodes}
              nodeStores={nodeStores}
              nodeShares={nodeShares}
              onToggle={handleToggle}
              onFlush={handleFlush}
              onRemove={handleRemove}
              onInspect={setInspectNode}
              onAdd={handleAdd}
              vnodesCount={vnodesCount}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsPanel
              onGet={handleGet}
              onSet={handleSet}
              onDelete={handleDelete}
              onPreset={handlePreset}
              lastOp={history[0]}
              history={history}
              onShowTrace={setTraceOp}
            />
          )}

          {activeTab === 'benchmark' && <BenchmarkPanel nodes={nodes} />}
        </section>
      </main>

      {/* Production Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-500 font-medium">
        CacheRing • High-Performance Distributed Key-Value Cluster with Consistent Hashing Topology
      </footer>

      {/* Inspector Modals */}
      {inspectNode && (
        <NodeDetailModal
          node={inspectNode}
          items={nodeStores.get(inspectNode.id) || []}
          onClose={() => setInspectNode(null)}
          onDeleteItem={handleDelete}
          onFlushNode={handleFlush}
        />
      )}

      {traceOp && (
        <RoutingStepsModal operation={traceOp} onClose={() => setTraceOp(null)} />
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${bgColor} ${color} flex items-center justify-center`}>
          <Icon size={14} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          {value}
        </div>
        <div className="text-xs text-slate-500 font-medium mt-1">
          {sub}
        </div>
      </div>
    </div>
  );
}
