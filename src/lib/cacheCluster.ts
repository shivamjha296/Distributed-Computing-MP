import {
  PhysicalNode,
  CacheItem,
  CacheOperationResult,
  RoutingTraceHop,
  EvictionPolicy,
  HashAlgorithm,
} from './types';
import { ConsistentHashRing } from './consistentHashRing';
import { formatHexHash } from './hashAlgorithms';

export interface ClusterConfig {
  replicationFactor: number;
  hashAlgorithm: HashAlgorithm;
  simulatedNetworkLatencyMs: number;
}

export class DistributedCacheCluster {
  private ring: ConsistentHashRing;
  // NodeId -> Map<Key, CacheItem>
  private nodeStores: Map<string, Map<string, CacheItem>> = new Map();
  private config: ClusterConfig = {
    replicationFactor: 2,
    hashAlgorithm: 'murmur3',
    simulatedNetworkLatencyMs: 12,
  };
  private operationHistory: CacheOperationResult[] = [];

  constructor(initialNodes?: PhysicalNode[], config?: Partial<ClusterConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.ring = new ConsistentHashRing(initialNodes || [], this.config.hashAlgorithm);

    // Initialize stores for each node
    for (const node of this.ring.getPhysicalNodes()) {
      this.nodeStores.set(node.id, new Map());
    }
  }

  public getRing(): ConsistentHashRing {
    return this.ring;
  }

  public getConfig(): ClusterConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ClusterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.hashAlgorithm) {
      this.ring.setHashAlgorithm(newConfig.hashAlgorithm);
    }
  }

  public getNodes(): PhysicalNode[] {
    return this.ring.getPhysicalNodes();
  }

  public getNodeStore(nodeId: string): CacheItem[] {
    const store = this.nodeStores.get(nodeId);
    if (!store) return [];
    return Array.from(store.values());
  }

  public getAllStoredKeys(): CacheItem[] {
    const items: CacheItem[] = [];
    for (const store of this.nodeStores.values()) {
      for (const item of store.values()) {
        if (!item.isReplica) {
          items.push(item);
        }
      }
    }
    return items;
  }

  public getOperationHistory(): CacheOperationResult[] {
    return [...this.operationHistory];
  }

  public clearHistory(): void {
    this.operationHistory = [];
  }

  public addNode(node: PhysicalNode): { migratedKeysCount: number } {
    this.ring.addNode(node);
    if (!this.nodeStores.has(node.id)) {
      this.nodeStores.set(node.id, new Map());
    }
    const migrated = this.rebalanceKeys();
    return { migratedKeysCount: migrated };
  }

  public removeNode(nodeId: string): { migratedKeysCount: number } {
    this.ring.removeNode(nodeId);
    this.nodeStores.delete(nodeId);
    const migrated = this.rebalanceKeys();
    return { migratedKeysCount: migrated };
  }

  public setNodeStatus(nodeId: string, status: PhysicalNode['status']): void {
    this.ring.setNodeStatus(nodeId, status);
  }

  public flushNode(nodeId: string): void {
    const store = this.nodeStores.get(nodeId);
    if (store) {
      store.clear();
    }
  }

  public flushAll(): void {
    for (const store of this.nodeStores.values()) {
      store.clear();
    }
    for (const node of this.ring.getPhysicalNodes()) {
      node.stats = { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 };
    }
    this.operationHistory = [];
  }

  /**
   * Sweeps and removes keys that have exceeded their TTL
   */
  public sweepExpiredKeys(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const store of this.nodeStores.values()) {
      for (const [key, item] of Array.from(store.entries())) {
        if (item.expiresAt && item.expiresAt <= now) {
          store.delete(key);
          expiredCount++;
        }
      }
    }

    return expiredCount;
  }

  /**
   * Evicts an item from a node based on its configured policy
   */
  private evictFromNode(
    node: PhysicalNode,
    store: Map<string, CacheItem>
  ): CacheItem | undefined {
    if (store.size === 0) return undefined;

    let victimKey: string | undefined;

    if (node.evictionPolicy === 'LRU') {
      // Find least recently accessed
      let oldestAccess = Infinity;
      for (const [k, item] of store.entries()) {
        if (item.lastAccessedAt < oldestAccess) {
          oldestAccess = item.lastAccessedAt;
          victimKey = k;
        }
      }
    } else if (node.evictionPolicy === 'LFU') {
      // Find least frequently accessed
      let minCount = Infinity;
      let oldestAccess = Infinity;
      for (const [k, item] of store.entries()) {
        if (item.accessCount < minCount) {
          minCount = item.accessCount;
          oldestAccess = item.lastAccessedAt;
          victimKey = k;
        } else if (item.accessCount === minCount && item.lastAccessedAt < oldestAccess) {
          oldestAccess = item.lastAccessedAt;
          victimKey = k;
        }
      }
    } else {
      // FIFO: oldest createdAt
      let oldestCreated = Infinity;
      for (const [k, item] of store.entries()) {
        if (item.createdAt < oldestCreated) {
          oldestCreated = item.createdAt;
          victimKey = k;
        }
      }
    }

    if (victimKey) {
      const victim = store.get(victimKey);
      store.delete(victimKey);
      node.stats.evictions++;
      return victim;
    }

    return undefined;
  }

  /**
   * Internal write to a physical node's storage
   */
  private writeToNodeStore(
    node: PhysicalNode,
    item: CacheItem
  ): { evictedKey?: string } {
    let store = this.nodeStores.get(node.id);
    if (!store) {
      store = new Map();
      this.nodeStores.set(node.id, store);
    }

    let evictedKey: string | undefined;

    // Check capacity if adding a new key
    if (!store.has(item.key) && store.size >= node.memoryCapacity) {
      const evicted = this.evictFromNode(node, store);
      if (evicted) {
        evictedKey = evicted.key;
      }
    }

    store.set(item.key, { ...item });
    node.stats.writes++;
    return { evictedKey };
  }

  /**
   * SET operation with Consistent Hashing routing, TTL, and Quorum Replication
   */
  public set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): CacheOperationResult {
    const startTime = performance.now();
    const traceHops: RoutingTraceHop[] = [];
    const now = Date.now();
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? now + ttlSeconds * 1000 : undefined;

    // Step 1: Compute Hash
    const lookupResult = this.ring.lookup(key, this.config.replicationFactor, false);
    const { keyHash, angle, targetVNode, primaryNode, replicaNodes } = lookupResult;

    traceHops.push({
      step: 1,
      title: 'Key Hashing',
      description: `Key "${key}" hashed using ${this.config.hashAlgorithm.toUpperCase()}`,
      detail: `Hash: ${formatHexHash(keyHash)} (${keyHash} unsigned 32-bit), Angle: ${angle.toFixed(1)}°`,
      type: 'hash',
      timestamp: Date.now(),
    });

    if (!primaryNode || !targetVNode) {
      return {
        operation: 'SET',
        key,
        value,
        keyHash,
        angle,
        replicaNodes: [],
        status: 'ERROR',
        latencyMs: 1,
        traceHops: [
          ...traceHops,
          {
            step: 2,
            title: 'Cluster Empty',
            description: 'No active nodes available in the hash ring.',
            type: 'completed',
            timestamp: Date.now(),
          },
        ],
        timestamp: Date.now(),
      };
    }

    // Step 2: Binary Search Successor on Ring
    traceHops.push({
      step: 2,
      title: 'Successor Binary Search',
      description: `Clockwise traversal located virtual node ${targetVNode.id}`,
      detail: `VNode Hash: ${formatHexHash(targetVNode.hash)} (${targetVNode.angle.toFixed(1)}°) maps to ${primaryNode.name} (${primaryNode.ip})`,
      type: 'ring-search',
      vnodeId: targetVNode.id,
      nodeId: primaryNode.id,
      timestamp: Date.now(),
    });

    // Step 3: Check Primary Node Status
    let actualPrimary = primaryNode;
    let isPrimaryDown = primaryNode.status === 'offline';

    if (isPrimaryDown) {
      traceHops.push({
        step: 3,
        title: 'Primary Node Offline',
        description: `Primary node ${primaryNode.name} is down! Initiating failover protocol.`,
        type: 'failover',
        nodeId: primaryNode.id,
        timestamp: Date.now(),
      });

      // Find first available live replica
      const liveReplica = replicaNodes.find((r) => r.status !== 'offline');
      if (liveReplica) {
        actualPrimary = liveReplica;
        traceHops.push({
          step: 4,
          title: 'Failover Coordinator Selected',
          description: `Promoted replica ${liveReplica.name} (${liveReplica.ip}) to handle write.`,
          type: 'primary-route',
          nodeId: liveReplica.id,
          timestamp: Date.now(),
        });
      }
    } else {
      traceHops.push({
        step: 3,
        title: 'Coordinator Route',
        description: `Routed request payload to primary node ${primaryNode.name}`,
        detail: `Simulated network hop: ~${this.config.simulatedNetworkLatencyMs}ms`,
        type: 'primary-route',
        nodeId: primaryNode.id,
        timestamp: Date.now(),
      });
    }

    // Cache Item
    const primaryItem: CacheItem = {
      key,
      value,
      keyHash,
      sizeBytes: key.length + value.length + 32,
      primaryNodeId: primaryNode.id,
      storedOnNodeId: actualPrimary.id,
      isReplica: false,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      ttlSeconds,
      expiresAt,
    };

    let evictedKey: string | undefined;

    if (actualPrimary.status !== 'offline') {
      const writeRes = this.writeToNodeStore(actualPrimary, primaryItem);
      evictedKey = writeRes.evictedKey;

      traceHops.push({
        step: traceHops.length + 1,
        title: 'Primary Write Committed',
        description: `Written to memory on ${actualPrimary.name}. Policy: ${actualPrimary.evictionPolicy}. Max: ${actualPrimary.memoryCapacity}`,
        detail: evictedKey ? `Memory limit reached! Evicted key "${evictedKey}"` : 'Stored successfully.',
        type: 'cache-lookup',
        nodeId: actualPrimary.id,
        timestamp: Date.now(),
      });
    }

    // Step 4: Replicate to next R-1 nodes on the ring
    const successfulReplicas: PhysicalNode[] = [];
    if (this.config.replicationFactor > 1) {
      for (const replicaNode of replicaNodes) {
        if (replicaNode.id === actualPrimary.id) continue;
        if (replicaNode.status !== 'offline') {
          const replicaItem: CacheItem = {
            ...primaryItem,
            storedOnNodeId: replicaNode.id,
            isReplica: true,
          };
          this.writeToNodeStore(replicaNode, replicaItem);
          successfulReplicas.push(replicaNode);

          traceHops.push({
            step: traceHops.length + 1,
            title: `Replication Sync: ${replicaNode.name}`,
            description: `Asynchronously replicated key to next clockwise physical node ${replicaNode.name} (${replicaNode.ip})`,
            type: 'replica-forward',
            nodeId: replicaNode.id,
            timestamp: Date.now(),
          });
        }
      }
    }

    traceHops.push({
      step: traceHops.length + 1,
      title: 'Write Completed',
      description: `Quorum achieved: Written to primary and ${successfulReplicas.length} replica(s).`,
      type: 'completed',
      timestamp: Date.now(),
    });

    const elapsed = Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs);

    const result: CacheOperationResult = {
      operation: 'SET',
      key,
      value,
      keyHash,
      angle,
      targetVNode,
      primaryNode,
      replicaNodes: successfulReplicas,
      status: 'SET_OK',
      latencyMs: elapsed,
      traceHops,
      timestamp: Date.now(),
      evictedKey,
    };

    this.operationHistory.unshift(result);
    if (this.operationHistory.length > 50) this.operationHistory.pop();

    return result;
  }

  /**
   * GET operation with Consistent Hashing lookup, Hit/Miss check, and Automatic Failover
   */
  public get(key: string): CacheOperationResult {
    const startTime = performance.now();
    const traceHops: RoutingTraceHop[] = [];
    const now = Date.now();

    // Step 1: Compute Hash
    const lookupResult = this.ring.lookup(key, this.config.replicationFactor, false);
    const { keyHash, angle, targetVNode, primaryNode, replicaNodes } = lookupResult;

    traceHops.push({
      step: 1,
      title: 'Hash Calculation',
      description: `Client computed hash of "${key}" using ${this.config.hashAlgorithm.toUpperCase()}`,
      detail: `Hash: ${formatHexHash(keyHash)} (${angle.toFixed(1)}°)`,
      type: 'hash',
      timestamp: Date.now(),
    });

    if (!primaryNode || !targetVNode) {
      return {
        operation: 'GET',
        key,
        keyHash,
        angle,
        replicaNodes: [],
        status: 'ERROR',
        latencyMs: 1,
        traceHops,
        timestamp: Date.now(),
      };
    }

    traceHops.push({
      step: 2,
      title: 'Ring Lookup (Successor)',
      description: `Clockwise search found virtual node ${targetVNode.id}`,
      detail: `Maps to primary server: ${primaryNode.name} (${primaryNode.ip})`,
      type: 'ring-search',
      vnodeId: targetVNode.id,
      nodeId: primaryNode.id,
      timestamp: Date.now(),
    });

    // Check if primary is online
    if (primaryNode.status !== 'offline') {
      traceHops.push({
        step: 3,
        title: 'Querying Primary Node',
        description: `Dispatched read request to ${primaryNode.name}`,
        type: 'primary-route',
        nodeId: primaryNode.id,
        timestamp: Date.now(),
      });

      const store = this.nodeStores.get(primaryNode.id);
      const cached = store?.get(key);

      // Check TTL
      if (cached) {
        if (cached.expiresAt && cached.expiresAt <= now) {
          // Expired!
          store?.delete(key);
          primaryNode.stats.misses++;
          traceHops.push({
            step: 4,
            title: 'TTL Expired (Cache MISS)',
            description: `Key was present on ${primaryNode.name} but expired at ${new Date(cached.expiresAt).toLocaleTimeString()}`,
            type: 'cache-lookup',
            nodeId: primaryNode.id,
            timestamp: Date.now(),
          });

          const res: CacheOperationResult = {
            operation: 'GET',
            key,
            keyHash,
            angle,
            targetVNode,
            primaryNode,
            replicaNodes,
            status: 'MISS',
            latencyMs: Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs),
            traceHops,
            timestamp: Date.now(),
          };
          this.operationHistory.unshift(res);
          return res;
        }

        // Cache HIT!
        cached.lastAccessedAt = now;
        cached.accessCount++;
        primaryNode.stats.hits++;

        traceHops.push({
          step: 4,
          title: 'Cache HIT!',
          description: `Key found in memory on ${primaryNode.name}`,
          detail: `Value: "${cached.value}" | Access Count: ${cached.accessCount} | LRU Updated`,
          type: 'cache-lookup',
          nodeId: primaryNode.id,
          timestamp: Date.now(),
        });

        traceHops.push({
          step: 5,
          title: 'Response Returned',
          description: `Payload returned to client in ${Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs)}ms`,
          type: 'completed',
          timestamp: Date.now(),
        });

        const res: CacheOperationResult = {
          operation: 'GET',
          key,
          value: cached.value,
          keyHash,
          angle,
          targetVNode,
          primaryNode,
          replicaNodes,
          status: 'HIT',
          latencyMs: Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs),
          traceHops,
          timestamp: Date.now(),
        };
        this.operationHistory.unshift(res);
        return res;
      } else {
        // Cache MISS on primary
        primaryNode.stats.misses++;
        traceHops.push({
          step: 4,
          title: 'Cache MISS on Primary',
          description: `Key not found in local memory of ${primaryNode.name}`,
          type: 'cache-lookup',
          nodeId: primaryNode.id,
          timestamp: Date.now(),
        });
      }
    } else {
      // Primary is OFFLINE! Trigger Failover
      traceHops.push({
        step: 3,
        title: 'Primary Offline (Failover Triggered)',
        description: `Primary node ${primaryNode.name} is down! Checking replica nodes along the ring.`,
        type: 'failover',
        nodeId: primaryNode.id,
        timestamp: Date.now(),
      });
    }

    // Failover: Check replica nodes
    for (const replica of replicaNodes) {
      if (replica.status === 'offline') continue;

      traceHops.push({
        step: traceHops.length + 1,
        title: `Failover Read to Replica: ${replica.name}`,
        description: `Querying replica copy on ${replica.name} (${replica.ip})`,
        type: 'replica-forward',
        nodeId: replica.id,
        timestamp: Date.now(),
      });

      const repStore = this.nodeStores.get(replica.id);
      const repItem = repStore?.get(key);

      if (repItem) {
        if (!repItem.expiresAt || repItem.expiresAt > now) {
          repItem.lastAccessedAt = now;
          repItem.accessCount++;
          replica.stats.hits++;

          traceHops.push({
            step: traceHops.length + 1,
            title: 'Replica HIT (Failover Succeeded)',
            description: `Successfully served from replica node ${replica.name}! System demonstrated fault tolerance.`,
            detail: `Value: "${repItem.value}"`,
            type: 'cache-lookup',
            nodeId: replica.id,
            timestamp: Date.now(),
          });

          const res: CacheOperationResult = {
            operation: 'GET',
            key,
            value: repItem.value,
            keyHash,
            angle,
            targetVNode,
            primaryNode,
            replicaNodes,
            status: 'FAILOVER_HIT',
            latencyMs: Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs * 1.5),
            traceHops,
            timestamp: Date.now(),
          };
          this.operationHistory.unshift(res);
          return res;
        }
      }
    }

    // Full MISS
    traceHops.push({
      step: traceHops.length + 1,
      title: 'Cache MISS Confirmed',
      description: 'Key does not exist in primary or any available replicas. Fallback to Origin DB would occur.',
      type: 'completed',
      timestamp: Date.now(),
    });

    const finalRes: CacheOperationResult = {
      operation: 'GET',
      key,
      keyHash,
      angle,
      targetVNode,
      primaryNode,
      replicaNodes,
      status: 'MISS',
      latencyMs: Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs),
      traceHops,
      timestamp: Date.now(),
    };
    this.operationHistory.unshift(finalRes);
    return finalRes;
  }

  /**
   * DELETE key across cluster
   */
  public delete(key: string): CacheOperationResult {
    const startTime = performance.now();
    const traceHops: RoutingTraceHop[] = [];

    const lookupResult = this.ring.lookup(key, this.config.replicationFactor, false);
    const { keyHash, angle, targetVNode, primaryNode, replicaNodes } = lookupResult;

    traceHops.push({
      step: 1,
      title: 'Hash Key for Eviction',
      description: `Computed hash for delete: ${formatHexHash(keyHash)}`,
      type: 'hash',
      timestamp: Date.now(),
    });

    let deletedCount = 0;

    if (primaryNode) {
      const store = this.nodeStores.get(primaryNode.id);
      if (store?.delete(key)) {
        deletedCount++;
        primaryNode.stats.deletes++;
      }
    }

    for (const r of replicaNodes) {
      const repStore = this.nodeStores.get(r.id);
      if (repStore?.delete(key)) {
        deletedCount++;
        r.stats.deletes++;
      }
    }

    traceHops.push({
      step: 2,
      title: 'Evicted from Ring',
      description: `Removed from ${deletedCount} storage location(s).`,
      type: 'completed',
      timestamp: Date.now(),
    });

    const res: CacheOperationResult = {
      operation: 'DELETE',
      key,
      keyHash,
      angle,
      targetVNode,
      primaryNode,
      replicaNodes,
      status: 'DELETE_OK',
      latencyMs: Math.round(performance.now() - startTime + this.config.simulatedNetworkLatencyMs),
      traceHops,
      timestamp: Date.now(),
    };

    this.operationHistory.unshift(res);
    return res;
  }

  /**
   * Rebalance all existing keys across current ring topology
   * Returns count of migrated keys
   */
  public rebalanceKeys(): number {
    const allItems: CacheItem[] = [];

    // Collect all primary items
    for (const store of this.nodeStores.values()) {
      for (const item of store.values()) {
        if (!item.isReplica) {
          allItems.push({ ...item });
        }
      }
      store.clear();
    }

    let migrationCount = 0;

    for (const item of allItems) {
      const lookup = this.ring.lookup(item.key, this.config.replicationFactor, false);
      if (lookup.primaryNode) {
        if (lookup.primaryNode.id !== item.primaryNodeId) {
          migrationCount++;
        }
        item.primaryNodeId = lookup.primaryNode.id;
        item.storedOnNodeId = lookup.primaryNode.id;
        this.writeToNodeStore(lookup.primaryNode, item);

        // Replicas
        for (const rep of lookup.replicaNodes) {
          this.writeToNodeStore(rep, {
            ...item,
            storedOnNodeId: rep.id,
            isReplica: true,
          });
        }
      }
    }

    return migrationCount;
  }

  /**
   * Populate sample keys from a preset
   */
  public populatePreset(keys: { key: string; value: string; ttl?: number }[]): void {
    for (const k of keys) {
      this.set(k.key, k.value, k.ttl);
    }
  }
}
