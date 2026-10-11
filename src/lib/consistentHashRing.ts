import { PhysicalNode, VirtualNode, RingPartition, HashAlgorithm } from './types';
import { computeHash, hashToAngle, HASH_RING_MAX } from './hashAlgorithms';

export class ConsistentHashRing {
  private physicalNodes: Map<string, PhysicalNode> = new Map();
  private vnodes: VirtualNode[] = [];
  private hashAlgo: HashAlgorithm = 'murmur3';

  constructor(nodes: PhysicalNode[] = [], hashAlgo: HashAlgorithm = 'murmur3') {
    this.hashAlgo = hashAlgo;
    nodes.forEach((n) => this.addNode(n));
  }

  public setHashAlgorithm(algo: HashAlgorithm) {
    this.hashAlgo = algo;
    this.rebuildRing();
  }

  public getHashAlgorithm(): HashAlgorithm {
    return this.hashAlgo;
  }

  public addNode(node: PhysicalNode): void {
    this.physicalNodes.set(node.id, { ...node });
    this.rebuildRing();
  }

  public removeNode(nodeId: string): void {
    this.physicalNodes.delete(nodeId);
    this.rebuildRing();
  }

  public updateNode(node: PhysicalNode): void {
    if (this.physicalNodes.has(node.id)) {
      this.physicalNodes.set(node.id, { ...node });
      this.rebuildRing();
    }
  }

  public setNodeStatus(nodeId: string, status: PhysicalNode['status']): void {
    const node = this.physicalNodes.get(nodeId);
    if (node) {
      node.status = status;
      this.physicalNodes.set(nodeId, { ...node });
    }
  }

  public getPhysicalNodes(): PhysicalNode[] {
    return Array.from(this.physicalNodes.values());
  }

  public getPhysicalNode(id: string): PhysicalNode | undefined {
    return this.physicalNodes.get(id);
  }

  public getVirtualNodes(): VirtualNode[] {
    return this.vnodes;
  }

  /**
   * Rebuilds and sorts all virtual nodes on the 32-bit hash ring
   */
  public rebuildRing(): void {
    this.vnodes = [];

    for (const node of this.physicalNodes.values()) {
      // Calculate effective vnodes taking weight into account
      const effectiveVNodes = Math.max(1, Math.round(node.vnodesCount * (node.weight || 1)));

      for (let i = 0; i < effectiveVNodes; i++) {
        // High entropy seed string for uniform dispersion
        const token = `${node.id}#vn:${i}:${node.ip}:${node.port}`;
        const hash = computeHash(token, this.hashAlgo);
        const angle = hashToAngle(hash);

        this.vnodes.push({
          id: `${node.id}#v${i}`,
          physicalNodeId: node.id,
          index: i,
          hash,
          angle,
        });
      }
    }

    // Sort virtual nodes in ascending order by hash
    this.vnodes.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Binary search for the first virtual node whose hash >= keyHash (clockwise successor)
   * Wraps around to index 0 if keyHash is greater than all vnodes
   */
  public findSuccessorIndex(keyHash: number): number {
    if (this.vnodes.length === 0) return -1;

    let low = 0;
    let high = this.vnodes.length - 1;
    let result = 0; // default wrap-around

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.vnodes[mid].hash >= keyHash) {
        result = mid;
        high = mid - 1; // look for earlier match
      } else {
        low = mid + 1;
      }
    }

    return result;
  }

  /**
   * Lookup the primary coordinator node and replicas for a given key
   */
  public lookup(
    key: string,
    replicationFactor: number = 1,
    onlineOnly: boolean = false
  ): {
    keyHash: number;
    angle: number;
    targetVNode?: VirtualNode;
    primaryNode?: PhysicalNode;
    replicaNodes: PhysicalNode[];
    allReplicasIncludingOffline: PhysicalNode[];
  } {
    const keyHash = computeHash(key, this.hashAlgo);
    const angle = hashToAngle(keyHash);

    if (this.vnodes.length === 0) {
      return {
        keyHash,
        angle,
        replicaNodes: [],
        allReplicasIncludingOffline: [],
      };
    }

    const successorIdx = this.findSuccessorIndex(keyHash);
    const targetVNode = this.vnodes[successorIdx];
    const initialPrimaryNode = this.physicalNodes.get(targetVNode.physicalNodeId);

    // Collect distinct physical nodes for replicas along clockwise ring
    const distinctNodes: PhysicalNode[] = [];
    const seenPhysicalIds = new Set<string>();

    const totalVNodes = this.vnodes.length;
    for (let offset = 0; offset < totalVNodes; offset++) {
      const currentIdx = (successorIdx + offset) % totalVNodes;
      const v = this.vnodes[currentIdx];
      const pNode = this.physicalNodes.get(v.physicalNodeId);

      if (pNode && !seenPhysicalIds.has(pNode.id)) {
        seenPhysicalIds.add(pNode.id);
        distinctNodes.push(pNode);

        if (distinctNodes.length >= Math.max(1, replicationFactor)) {
          break;
        }
      }
    }

    const allReplicasIncludingOffline = [...distinctNodes];

    // If onlineOnly is requested, find the first online node as effective primary
    let primaryNode = initialPrimaryNode;
    let replicaNodes = distinctNodes.slice(1);

    if (onlineOnly && primaryNode?.status === 'offline') {
      const firstOnlineIdx = distinctNodes.findIndex((n) => n.status !== 'offline');
      if (firstOnlineIdx !== -1) {
        primaryNode = distinctNodes[firstOnlineIdx];
        replicaNodes = distinctNodes.filter((_, idx) => idx !== firstOnlineIdx);
      }
    }

    return {
      keyHash,
      angle,
      targetVNode,
      primaryNode,
      replicaNodes,
      allReplicasIncludingOffline,
    };
  }

  /**
   * Calculates partitions (ring intervals) owned by each virtual node
   */
  public getPartitions(): RingPartition[] {
    if (this.vnodes.length === 0) return [];

    const partitions: RingPartition[] = [];
    const total = this.vnodes.length;

    for (let i = 0; i < total; i++) {
      const currentVNode = this.vnodes[i];
      const prevVNode = this.vnodes[(i - 1 + total) % total];
      const pNode = this.physicalNodes.get(currentVNode.physicalNodeId);

      let hashSpan: number;
      if (i === 0) {
        // Wraparound partition from prevVNode to max, and 0 to currentVNode
        hashSpan = (HASH_RING_MAX - prevVNode.hash) + currentVNode.hash;
      } else {
        hashSpan = currentVNode.hash - prevVNode.hash;
      }

      const percentage = (hashSpan / HASH_RING_MAX) * 100;
      const startAngle = prevVNode.angle;
      const endAngle = currentVNode.angle;

      partitions.push({
        startHash: prevVNode.hash,
        endHash: currentVNode.hash,
        startAngle,
        endAngle,
        vnodeId: currentVNode.id,
        physicalNodeId: currentVNode.physicalNodeId,
        color: pNode?.color || '#6366f1',
        percentage,
      });
    }

    return partitions;
  }

  /**
   * Calculates total hash ring percentage owned by each physical node
   * and calculates standard deviation to evaluate balance uniformity.
   */
  public getNodeShares(): {
    nodeId: string;
    nodeName: string;
    sharePercent: number;
    color: string;
    status: PhysicalNode['status'];
    vnodesCount: number;
  }[] {
    const partitions = this.getPartitions();
    const shareMap = new Map<string, number>();

    for (const p of partitions) {
      shareMap.set(p.physicalNodeId, (shareMap.get(p.physicalNodeId) || 0) + p.percentage);
    }

    return Array.from(this.physicalNodes.values()).map((node) => ({
      nodeId: node.id,
      nodeName: node.name,
      sharePercent: shareMap.get(node.id) || 0,
      color: node.color,
      status: node.status,
      vnodesCount: node.vnodesCount,
    }));
  }

  /**
   * Calculate standard deviation of partition coverage across physical nodes
   * Lower standard deviation = more uniform distribution!
   */
  public getUniformityMetrics(): {
    idealPercent: number;
    stdDev: number;
    uniformityScore: number; // 0 to 100%
  } {
    const count = this.physicalNodes.size;
    if (count <= 1) return { idealPercent: 100, stdDev: 0, uniformityScore: 100 };

    const idealPercent = 100 / count;
    const shares = this.getNodeShares().map((s) => s.sharePercent);
    const variance =
      shares.reduce((acc, val) => acc + Math.pow(val - idealPercent, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // Score: 100 - (stdDev / idealPercent * 50 clamped)
    const uniformityScore = Math.max(0, Math.min(100, Math.round(100 - (stdDev / idealPercent) * 40)));

    return {
      idealPercent,
      stdDev,
      uniformityScore,
    };
  }
}
