import { computeHash } from './hashAlgorithms';
import { ConsistentHashRing } from './consistentHashRing';
import { PhysicalNode } from './types';

export interface BenchmarkRunResult {
  keyCount: number;
  initialNodeCount: number;
  newNodeCount: number;
  action: 'ADD_NODE' | 'REMOVE_NODE';
  
  // Consistent Hashing metrics
  consistentMovedCount: number;
  consistentMovedPercent: number;
  consistentRetainedCount: number;
  consistentRetainedPercent: number;
  theoreticalConsistentPercent: number; // ~ 1 / (N+1)
  
  // Modulo Hashing metrics
  moduloMovedCount: number;
  moduloMovedPercent: number;
  moduloRetainedCount: number;
  moduloRetainedPercent: number;
  theoreticalModuloPercent: number; // ~ N / (N+1)
  
  keySamples: {
    key: string;
    consistentInitialNode: string;
    consistentNewNode: string;
    consistentMoved: boolean;
    moduloInitialNode: number;
    moduloNewNode: number;
    moduloMoved: boolean;
  }[];
}

/**
 * Runs a comparative churn benchmark comparing Consistent Hashing vs Naive Modulo Hashing
 */
export function runComparativeBenchmark(
  currentNodes: PhysicalNode[],
  action: 'ADD_NODE' | 'REMOVE_NODE',
  keyCount: number = 200,
  vnodesPerNode: number = 5
): BenchmarkRunResult {
  const initialCount = currentNodes.length;
  const newCount = action === 'ADD_NODE' ? initialCount + 1 : Math.max(1, initialCount - 1);

  // Generate synthetic test keys
  const keys: string[] = [];
  for (let i = 1; i <= keyCount; i++) {
    keys.push(`cache:item_${i}`);
  }

  // Setup Initial Consistent Hashing Ring
  const initialRing = new ConsistentHashRing(
    currentNodes.map((n) => ({ ...n, vnodesCount: vnodesPerNode }))
  );

  // Setup New Consistent Hashing Ring
  let newNodes: PhysicalNode[];
  if (action === 'ADD_NODE') {
    const newNode: PhysicalNode = {
      id: `node-${Date.now()}`,
      name: `Node ${String.fromCharCode(65 + initialCount)}`,
      ip: `192.168.1.${100 + initialCount}`,
      port: 8080 + initialCount,
      color: '#f59e0b',
      vnodesCount: vnodesPerNode,
      status: 'online',
      memoryCapacity: 20,
      evictionPolicy: 'LRU',
      weight: 1,
      createdAt: Date.now(),
      stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
    };
    newNodes = [...currentNodes, newNode];
  } else {
    // Remove last node
    newNodes = currentNodes.slice(0, Math.max(1, currentNodes.length - 1));
  }

  const newRing = new ConsistentHashRing(
    newNodes.map((n) => ({ ...n, vnodesCount: vnodesPerNode }))
  );

  let consistentMovedCount = 0;
  let moduloMovedCount = 0;
  const keySamples: BenchmarkRunResult['keySamples'] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const hash = computeHash(key, 'murmur3');

    // 1. Consistent Hashing evaluation
    const initialLookup = initialRing.lookup(key, 1, false);
    const newLookup = newRing.lookup(key, 1, false);

    const cInitial = initialLookup.primaryNode?.name || 'Unknown';
    const cNew = newLookup.primaryNode?.name || 'Unknown';
    const cMoved = cInitial !== cNew;
    if (cMoved) consistentMovedCount++;

    // 2. Naive Modulo Hashing evaluation: hash % N
    const mInitial = hash % initialCount;
    const mNew = hash % newCount;
    const mMoved = mInitial !== mNew;
    if (mMoved) moduloMovedCount++;

    if (i < 25) {
      keySamples.push({
        key,
        consistentInitialNode: cInitial,
        consistentNewNode: cNew,
        consistentMoved: cMoved,
        moduloInitialNode: mInitial,
        moduloNewNode: mNew,
        moduloMoved: mMoved,
      });
    }
  }

  const consistentMovedPercent = Number(((consistentMovedCount / keyCount) * 100).toFixed(1));
  const consistentRetainedPercent = Number((100 - consistentMovedPercent).toFixed(1));
  
  const moduloMovedPercent = Number(((moduloMovedCount / keyCount) * 100).toFixed(1));
  const moduloRetainedPercent = Number((100 - moduloMovedPercent).toFixed(1));

  const theoreticalConsistentPercent = Number(
    ((1 / (action === 'ADD_NODE' ? initialCount + 1 : initialCount)) * 100).toFixed(1)
  );
  const theoreticalModuloPercent = Number((100 - theoreticalConsistentPercent).toFixed(1));

  return {
    keyCount,
    initialNodeCount: initialCount,
    newNodeCount: newCount,
    action,
    consistentMovedCount,
    consistentMovedPercent,
    consistentRetainedCount: keyCount - consistentMovedCount,
    consistentRetainedPercent,
    theoreticalConsistentPercent,
    moduloMovedCount,
    moduloMovedPercent,
    moduloRetainedCount: keyCount - moduloMovedCount,
    moduloRetainedPercent,
    theoreticalModuloPercent,
    keySamples,
  };
}
