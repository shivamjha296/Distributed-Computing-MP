export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO';
export type NodeStatus = 'online' | 'degraded' | 'offline';
export type HashAlgorithm = 'murmur3' | 'fnv1a';

export interface VirtualNode {
  id: string; // e.g. "node-1#v0"
  physicalNodeId: string;
  index: number;
  hash: number; // 0 to 2^32 - 1
  angle: number; // 0 to 360 degrees
}

export interface PhysicalNode {
  id: string;
  name: string;
  ip: string;
  port: number;
  color: string;
  vnodesCount: number;
  status: NodeStatus;
  memoryCapacity: number; // max number of keys
  evictionPolicy: EvictionPolicy;
  weight: number; // relative weight
  createdAt: number;
  stats: {
    hits: number;
    misses: number;
    writes: number;
    deletes: number;
    evictions: number;
  };
}

export interface CacheItem {
  key: string;
  value: string;
  keyHash: number;
  sizeBytes: number;
  primaryNodeId: string;
  storedOnNodeId: string;
  isReplica: boolean;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttlSeconds?: number;
  expiresAt?: number;
}

export interface RingPartition {
  startHash: number;
  endHash: number;
  startAngle: number;
  endAngle: number;
  vnodeId: string;
  physicalNodeId: string;
  color: string;
  percentage: number;
}

export interface RoutingTraceHop {
  step: number;
  title: string;
  description: string;
  detail?: string;
  type: 'hash' | 'ring-search' | 'primary-route' | 'cache-lookup' | 'replica-forward' | 'failover' | 'completed';
  nodeId?: string;
  vnodeId?: string;
  timestamp: number;
}

export interface CacheOperationResult {
  operation: 'GET' | 'SET' | 'DELETE';
  key: string;
  value?: string;
  keyHash: number;
  angle: number;
  targetVNode?: VirtualNode;
  primaryNode?: PhysicalNode;
  replicaNodes: PhysicalNode[];
  status: 'HIT' | 'MISS' | 'SET_OK' | 'DELETE_OK' | 'FAILOVER_HIT' | 'FAILOVER_MISS' | 'ERROR';
  latencyMs: number;
  traceHops: RoutingTraceHop[];
  timestamp: number;
  evictedKey?: string;
}

export interface WorkloadPreset {
  name: string;
  description: string;
  category: string;
  sampleKeys: { key: string; value: string; ttl?: number }[];
}

export interface BenchmarkComparison {
  initialNodes: number;
  newNodes: number;
  keyCount: number;
  consistentChurnCount: number;
  consistentChurnPercent: number;
  moduloChurnCount: number;
  moduloChurnPercent: number;
  details: {
    consistentMovedKeys: { key: string; from: string; to: string }[];
    moduloMovedKeys: { key: string; from: number; to: number }[];
  };
}
