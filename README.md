# Distributed Cache System with Consistent Hashing & Dynamo Ring Architecture

> A high-performance, fault-tolerant distributed in-memory key-value cache and partitioning simulator built with Next.js, TypeScript, and interactive SVG topology visualization.

---

## 📌 1. Project Overview & Architectural Motivation

In modern cloud computing and large-scale web systems, centralized caching databases (like a single Redis or Memcached instance) inevitably become a throughput bottleneck and a single point of failure (SPOF). To scale horizontally, cached data must be distributed across an autonomous cluster of storage nodes.

### ⚠️ The Problem with Naive Modulo Hashing (`hash(key) % N`)
The traditional approach to partitioning keys across $N$ servers relies on modular arithmetic:
$$\text{serverIndex} = \text{hash}(\text{key}) \pmod N$$

While simple, this strategy suffers from a catastrophic flaw during dynamic cluster resizing:
- When scaling up from $N$ to $N+1$ nodes (or when a server fails, dropping to $N-1$), the modulo denominator shifts for **every key in the system**.
- Mathematically, approximately $\frac{N}{N+1}$ (i.e., **80% to 90%**) of all cached keys immediately re-hash to an incorrect server.
- **The Consequence:** A sudden **Cache Avalanche / DB Stampede**. Because almost every client request now misses the cache simultaneously, millions of read requests hit the backend persistence database at once, causing connection pool exhaustion, cascading timeouts, and service downtime.

### ✅ The Solution: Consistent Hashing
Introduced by Karger et al. (1997), **Consistent Hashing** maps both servers and data keys to a circular integer continuum (a hash ring spanning $0$ to $2^{32} - 1$).
- Keys are assigned to the immediate successor node encountered while traversing the ring clockwise.
- When a server is added or removed, **only keys in the immediately adjacent partition interval migrate** (strictly bounded to $\approx \frac{1}{N+1}$ of the total keyspace).
- All remaining nodes and partitions remain completely unaffected, maintaining continuous cache hit rates and preventing database overload.

---

## 🏗️ 2. System Architecture & Core Modules

The platform is designed as an interactive, real-time distributed system simulator with zero static mockups. Every calculation, hash projection, memory eviction, and network hop is executed dynamically in code.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|     Interactive RPC Console  |  Synthetic Traffic Generator (Zipfian / Uniform)   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ [Key Hash: Murmur3 / FNV-1a]
+-----------------------------------------------------------------------------------+
|                        CONSISTENT HASH RING COORDINATOR                           |
|       Scalar Continuum: [0, 2^32 - 1] (Mapped to 360° Circular Geometry)          |
|            Sorted Virtual Nodes (VNodes): Binary Search O(log M)                  |
|                   Clockwise Successor Partition Resolution                        |
+-----------------------------------------------------------------------------------+
                       │                                    │
                       ▼ Primary Write/Read                 ▼ Asynchronous Replication
+-----------------------------------------+   +-------------------------------------+
|           PRIMARY NODE (e.g. Node A)    |   |     REPLICA NODES (e.g. Node B, C)  |
| - Autonomous In-Memory Key-Value Store  |───▶ - R-1 Distinct Clockwise Servers    |
| - Eviction Policies: LRU / LFU / FIFO   |   | - High-Availability Read Failover   |
| - Background Real-Time TTL Countdown    |   | - Quorum Acknowledgement (R Factor) |
+-----------------------------------------+   +-------------------------------------+
```

---

## ⚙️ 3. How It Works (Detailed Mechanics)

### 3.1 32-Bit Scalar Hash Space
The system uses industry-standard 32-bit hash algorithms:
- **Murmur3 (32-bit)**: High avalanche factor, deterministic, and optimal for string hashing (used by Apache Cassandra and Redis).
- **FNV-1a (32-bit)**: Fast non-cryptographic bitwise multiplication hash.

Every key and server token is hashed to an unsigned 32-bit integer in the range:
$$0 \le H \le 4,294,967,295 \quad (2^{32} - 1)$$

This scalar value maps linearly to a $360^\circ$ circle angle for geometric routing and visualization:
$$\theta = \left(\frac{H}{2^{32} - 1}\right) \times 360^\circ$$

---

### 3.2 Virtual Nodes (VNodes) & Variance Elimination
A common pitfall in basic consistent hashing is **data skew (hotspots)**: if physical servers each have only one coordinate on the ring, statistical hash variance causes unequal arc lengths. One server might own 60% of the ring while another owns only 5%.

**Solution:** Each physical server is assigned $V$ virtual nodes (e.g., $V = 5$ to $15$ tokens per server):
$$\text{token} = \text{nodeId} + \text{"#vn:"} + i + \text{":"} + \text{ip} + \text{":"} + \text{port}$$
- Tokens are interleaved around the $360^\circ$ circumference.
- As $V$ increases, partition sizes converge toward the ideal uniform distribution ($\frac{100\%}{N}$ per node).
- The platform measures this in real time using the **Standard Deviation of Partition Shares ($\sigma$)** and provides an interactive slider to observe skew reduction dynamically.

---

### 3.3 Lookup Algorithm: $O(\log M)$ Clockwise Successor Search
1. The client receives a key $K$ (e.g., `prod:macbook_pro_m3`).
2. Compute $H_K = \text{hash}(K)$.
3. Perform a binary search (`upper_bound` / `bisect_right`) over the pre-sorted array of $M = N \times V$ virtual nodes:
   - Locate the smallest virtual node hash $H_V$ such that $H_V \ge H_K$.
   - If $H_K$ is greater than all nodes, wrap around clockwise to index $0$ ($H_0$).
4. The physical server owning $H_V$ is assigned as the **Coordinator / Primary Server**.

---

### 3.4 Dynamo-Style Quorum Replication ($R=1, 2, 3$) & Self-Healing Failover
To survive server crashes without data loss:
- When a write (`SET`) occurs, the coordinator writes to its local memory table and asynchronously forwards the key to the next $R - 1$ **distinct physical servers** clockwise on the ring.
- **Failover Demonstration:** When a server is marked as `FAILED / OFFLINE`, incoming `GET` requests detect the offline status and automatically failover to the first live replica node along the ring, serving the cached value as a `FAILOVER_HIT`.

---

### 3.5 Multi-Policy In-Memory Cache Tier
Each physical server manages an autonomous in-memory store with bounded capacity:
- **LRU (Least Recently Used)**: Evicts items with the oldest `lastAccessedAt` timestamp.
- **LFU (Least Frequently Used)**: Evicts items with the lowest access frequency (`accessCount`).
- **FIFO (First-In, First-Out)**: Evicts items with the oldest `createdAt` timestamp.
- **Dynamic TTL Sweep**: Keys with expiration limits are monitored by an active 1-second interval timer, removing expired keys lazily and in the background.

---

## 📊 4. Comparative Key Churn Benchmark

The platform includes a dedicated comparative analysis engine measuring data migration when scaling the cluster:

| Metric | Consistent Hashing | Naive Modulo Hashing (`hash % N`) |
| :--- | :--- | :--- |
| **Data Movement on Scale-Up ($N \to N+1$)** | $\approx \frac{1}{N+1}$ (**~15% – 20%**) | $\approx \frac{N}{N+1}$ (**~80% – 85%**) |
| **Data Movement on Scale-Down ($N \to N-1$)** | $\approx \frac{1}{N}$ (**~20% – 25%**) | $\approx \frac{N-1}{N}$ (**~75% – 80%**) |
| **Cache Continuity** | **High** (Unrelated partitions unaffected) | **Catastrophic** (Global cache invalidation) |
| **Backend DB Impact** | Minor re-warming spike | Massive DB connection pool exhaustion / stampede |

---

## 🚦 5. Synthetic Traffic Simulator & Telemetry

The platform provides a live traffic generator modeled on production load testing tools (like k6 or Locust):
- **Zipfian (Pareto 80/20 Power Law)**: 20% of hot keys generate 80% of read traffic, reflecting realistic production cache behavior.
- **Uniform Random Distribution**: Equi-probable key selection to verify ring load balancing across physical machines.
- **Live Telemetry**: Real-time throughput (QPS), live rolling hit ratio, and per-server request distribution charts.

---

## 💻 6. Technical Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (Strict type contracts for nodes, vnodes, cache entries, and trace hops)
- **Styling**: Vanilla CSS tokens + Tailwind CSS v4 in a clean, high-contrast light theme
- **Icons**: Lucide React
- **Graphics**: Interactive dynamic SVG (trigonometric polar-to-cartesian projection)

---

## 📁 7. Codebase Directory Structure

```
distributed-cache/
├── package.json                          # Next.js 16 + dependencies
├── README.md                             # Comprehensive technical documentation
├── next.config.ts                        # Build & Turbopack configurations
├── tsconfig.json                         # Strict TypeScript configuration
└── src/
    ├── lib/
    │   ├── types.ts                      # Core interfaces: PhysicalNode, VirtualNode, CacheItem
    │   ├── hashAlgorithms.ts             # Murmur3 (32-bit) and FNV-1a hash functions
    │   ├── consistentHashRing.ts         # Ring topology, binary search successor, VNodes
    │   ├── cacheCluster.ts               # Cluster state machine, LRU/LFU/FIFO, TTL, replication
    │   ├── benchmark.ts                  # Mathematical Churn rate comparison engine
    │   └── presets.ts                    # Realistic workload presets (E-commerce, Social, Auth)
    ├── components/
    │   ├── Navbar.tsx                    # Enterprise navigation bar & live cluster health
    │   ├── HashRingVisualizer.tsx        # 360° SVG ring with degree ticks, arcs & pins
    │   ├── ClusterNodeGrid.tsx           # Server node status tiles, memory bars, crash controls
    │   ├── InteractiveConsole.tsx        # Client RPC terminal for GET, SET, DEL queries
    │   ├── StepTraceDrawer.tsx           # 6-hop execution breakdown inspector
    │   ├── RebalanceBenchmarkModal.tsx     # Side-by-side churn comparison & audit table
    │   ├── NodeDetailModal.tsx           # Key-level memory inspector with live TTL timer
    │   ├── TrafficSimulator.tsx          # Zipfian traffic generator & load balance chart
    │   └── ProjectReportModal.tsx        # Technical architecture & evaluation defense guide
    └── app/
        ├── globals.css                   # Clean enterprise light theme styles
        ├── layout.tsx                    # Application shell & metadata
        └── page.tsx                      # Main state controller & real-time background timers
```

---

## 🚀 8. Getting Started

### Prerequisites
- Node.js version 18.x or later installed
- npm version 9.x or later

### Installation & Running Locally

1. Open a terminal in the project directory:
   ```bash
   npm run dev
   ```

2. Access the platform in your browser:
   👉 **http://localhost:3000**

3. Build for production (verifies static typing and optimization):
   ```bash
   npm run build
   ```

---

## 🎓 9. Evaluation & Defense Quick Reference

When presenting or defending this distributed computing implementation, focus on these core questions:

1. **Why does naive modulo hashing fail?**
   - Resizing from $N$ to $N+1$ changes the divisor for all keys, shifting 80–90% of data to the wrong node and triggering a cache stampede.
2. **How does Consistent Hashing isolate changes?**
   - Keys and servers map to a ring. When adding a server, only keys on the adjacent clockwise interval move ($\approx \frac{1}{N+1}$).
3. **What purpose do Virtual Nodes serve?**
   - They break continuous server ownership into fine interleaved segments, reducing partition size variance and eliminating hotspots.
4. **What is the query time complexity?**
   - Hashing is $O(L)$, successor search is $O(\log M)$ via binary search over sorted virtual nodes, and memory lookup is $O(1)$.
5. **How is fault tolerance guaranteed?**
   - Dynamo-style replication factors ($R=2, 3$) write asynchronously to adjacent servers; if a primary node crashes, requests seamlessly fail over to live replicas.
