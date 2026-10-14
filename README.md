# CacheRing — Distributed Key-Value Cluster with Consistent Hashing

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)

> **CacheRing** is an enterprise-grade distributed in-memory key-value caching system and topology coordinator powered by **32-Bit Murmur3 Consistent Hashing**. It features dynamic partition rebalancing, virtual node variance elimination, real-time clockwise successor routing, interactive SVG ring visualization, and live cluster rescaling analytics.

---

## 📑 Table of Contents

1. [Architectural Motivation](#-1-architectural-motivation)
2. [Mathematical & Algorithmic Foundation](#-2-mathematical--algorithmic-foundation)
3. [System Architecture & Data Flow](#-3-system-architecture--data-flow)
4. [Core Features & Modules](#-4-core-features--modules)
5. [Dynamic Real-Time Implementation](#-5-dynamic-real-time-implementation)
6. [Technology Stack](#-6-technology-stack)
7. [Repository File Structure](#-7-repository-file-structure)
8. [Local Installation & Execution](#-8-local-installation--execution)
9. [Operational Scenarios & Verification](#-9-operational-scenarios--verification)

---

## 📌 1. Architectural Motivation

In modern distributed infrastructure, centralized cache databases inevitably encounter horizontal scaling limits and become single points of failure (SPOF). Distributing key-value pairs across an autonomous cluster of independent storage nodes is required to achieve high throughput and elastic scaling.

### ⚠️ The Failure of Naive Modulo Hashing (`hash(key) % N`)

The traditional method of partitioning keys across $N$ servers relies on linear modular arithmetic:

$$\text{serverIndex} = \text{hash}(\text{key}) \pmod N$$

While simple to compute, this strategy suffers from catastrophic failure during cluster topology changes:
* **The Scaling Problem:** When scaling out from $N$ to $N+1$ servers (or scaling in to $N-1$ upon node failure), the modulo divisor shifts for virtually every key in the dataset.
* **Mass Key Churn:** Mathematically, approximately $\frac{N}{N+1}$ (**75% to 90%+**) of all keys immediately resolve to the wrong node.
* **The Consequence:** A sudden **Cache Avalanche**. Because nearly all lookups miss simultaneously, downstream primary databases face immediate request saturation, connection pool exhaustion, and cascading outages.

```
Linear Modulo (N -> N+1):
[Key 1: Hash 104] % 4 = Node 0  ──(Scale to 5)──> 104 % 5 = Node 4  (MIGRATED ❌)
[Key 2: Hash 217] % 4 = Node 1  ──(Scale to 5)──> 217 % 5 = Node 2  (MIGRATED ❌)
[Key 3: Hash 382] % 4 = Node 2  ──(Scale to 5)──> 382 % 5 = Node 2  (RETAINED ✅)
[Key 4: Hash 491] % 4 = Node 3  ──(Scale to 5)──> 491 % 5 = Node 1  (MIGRATED ❌)
Result: ~80% of all keys are reassigned!
```

### ✅ The Consistent Hashing Solution

Introduced by Karger et al. (1997), **Consistent Hashing** maps both physical servers and data keys to a continuous circular integer continuum ($0 \dots 2^{32} - 1$):
* Keys are assigned to the immediate **clockwise successor node** on the ring.
* When adding or removing a node, **only keys within the immediately adjacent partition interval migrate** (strictly bounded to $\approx \frac{1}{N+1}$ of the total keyspace).
* All other nodes and partitions remain completely undisturbed, preserving cache warmth and eliminating DB stampedes.

```
Consistent Hashing Ring (N -> N+1):
[Key 1: 0x24a1b0] ──> Clockwise Successor: Node A  ──(Add Node E)──> Node A  (RETAINED ✅)
[Key 2: 0x7c89f1] ──> Clockwise Successor: Node B  ──(Add Node E)──> Node B  (RETAINED ✅)
[Key 3: 0xa912c4] ──> Clockwise Successor: Node C  ──(Add Node E)──> Node E  (MIGRATED ✅ ~1/(N+1))
[Key 4: 0xe055a2] ──> Clockwise Successor: Node D  ──(Add Node E)──> Node D  (RETAINED ✅)
Result: Only ~20% of keys migrate to the newly added server!
```

---

## 📐 2. Mathematical & Algorithmic Foundation

### 2.1 32-Bit Integer Scalar Ring Space
CacheRing utilizes deterministic 32-bit **Murmur3** hashing (with optional FNV-1a support):
* Murmur3 produces a uniform, high-entropy 32-bit unsigned integer output:

$$H(x) \in [0, \; 2^{32} - 1] \quad \text{where} \quad 2^{32} - 1 = 4,294,967,295$$

* This linear integer scalar maps to a circular geometry ($0^\circ \text{ to } 360^\circ$):

$$\theta = \left(\frac{H(x)}{2^{32} - 1}\right) \times 360^\circ$$

---

### 2.2 Virtual Nodes (VNodes) & Statistical Variance Reduction
If each physical server occupies only a single position on the ring, random statistical variance causes unequal arc distribution (**data skew / hotspots**), where one server might own 60% of the ring while another owns 5%.

**Solution:** Each physical server is assigned $V$ virtual nodes (tokens interleaved across the circumference):

$$\text{token}_{i} = \text{nodeId} + \text{"#vn:"} + i + \text{":"} + \text{ip} + \text{":"} + \text{port}$$

* As $V$ increases from $1$ to $15+$, the law of large numbers forces partition arcs to converge toward an ideal uniform distribution ($\frac{100\%}{N}$ per node).
* The system evaluates load uniformity in real-time by calculating the **Standard Deviation of Partition Shares ($\sigma$)**:

$$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} \left(s_i - \bar{s}\right)^2}$$

$$\text{Uniformity Score} = \max\left(0, \; 100 - \left(\frac{\sigma}{\bar{s}}\right) \times 50\right)\%$$

---

### 2.3 Clockwise Successor Lookup: $O(\log M)$ Binary Search
Given a key $K$ and $M = N \times V$ sorted virtual nodes:
1. Compute the key's 32-bit hash: $H_K = \text{Murmur3}(K)$.
2. Execute a binary search (`upper_bound` / `bisect_right`) over the pre-sorted array of virtual nodes:
   $$\text{Find smallest } H_{V} \quad \text{such that} \quad H_{V} \ge H_{K}$$
3. **Wrap-Around Condition:** If $H_K > \max(H_V)$, wrap around clockwise to index $0$ ($H_0$).
4. The physical server owning the resolved virtual node is selected to handle the query.
5. Overall lookup complexity: **$O(\log M)$** with space complexity **$O(M)$**.

---

## 🏗️ 3. System Architecture & Data Flow

```mermaid
graph TD
    Client[Client / Operations Console] -->|Key String| HashEngine[32-Bit Murmur3 Hash Engine]
    HashEngine -->|32-Bit Hash Value| RingCoordinator[Consistent Hash Ring Coordinator]
    
    subgraph HashRingSpace ["32-Bit Circular Hash Continuum [0 .. 2^32 - 1]"]
        VNodeA1["vNode Alpha #0"]
        VNodeB1["vNode Beta #0"]
        VNodeC1["vNode Gamma #0"]
        VNodeD1["vNode Delta #0"]
        VNodeA2["vNode Alpha #1"]
        VNodeB2["vNode Beta #1"]
    end
    
    RingCoordinator -->|O(log M) Binary Search| HashRingSpace
    HashRingSpace -->|Clockwise Successor| NodeResolver[Physical Node Resolver]
    
    subgraph StorageNodes ["Physical Cache Storage Instances"]
        NodeA["Node Alpha (192.168.1.101:6379)\nIn-Memory Store Map"]
        NodeB["Node Beta (192.168.1.102:6380)\nIn-Memory Store Map"]
        NodeC["Node Gamma (192.168.1.103:6381)\nIn-Memory Store Map"]
        NodeD["Node Delta (192.168.1.104:6382)\nIn-Memory Store Map"]
    end
    
    NodeResolver -->|Route GET/SET/DELETE| StorageNodes
    StorageNodes -->|Return Value + Telemetry| Result[Execution Trace & Response Inspector]
```

---

## ⚡ 4. Core Features & Modules

### 1. Floating Capsule Island Navbar
* **Distinct Header Identity:** Features a floating rounded capsule (`rounded-full bg-black text-white shadow-2xl border border-neutral-800/90`) aligned edge-to-edge with the content grid (`max-w-7xl`).
* **Branded Circular Badge:** Displays the official geometric network hexagon logo inside an elevated white circular pill alongside the bold **CacheRing** brand mark.
* **Streamlined Navigation:** Four clean navigation tabs (**Ring Topology**, **Cluster Nodes**, **Data Console**, **Rebalance Analysis**) and a high-contrast white pill button for **Reset State**.

### 2. Executive Cluster Telemetry & Health Deck
* Displays real-time cluster KPIs in elevated white cards with dedicated color icon badges:
  * **Active Nodes:** Online instances versus total cluster capacity.
  * **Virtual Partitions:** Total active virtual nodes ($N \times V$) placed on the ring.
  * **Stored Items:** Live count of in-memory keys across all nodes.
  * **Cache Hit Ratio:** Cumulative cache hits versus misses with real-time percentage.
  * **Ring Uniformity:** Load balance score and standard deviation ($\sigma$).

### 3. Integrated Ring Topology Visualizer
* **Bold 40px Ring Circumference:** Robust SVG ring band (`INNER = 155px`, `OUTER = 195px`) ensuring immediate visibility.
* **Integrated Window Controls:** Virtual node density selector (`3`, `5`, `10`, `15`) and visibility toggles (`vNodes`, `Keys`) integrated directly into the graph header.
* **Sharp Partition Cutlines:** Crisp radial dividers between partitions and clear $0^\circ, 90^\circ, 180^\circ, 270^\circ$ hex coordinate markers.
* **Interactive Tooltip Inspector:** Hovering any node or key reveals its 32-bit hex hash, angle, key identifier, and partition owner.

### 4. Cluster Node Management Panel
* Production node instance inventory displaying endpoint, operational status (`Online` / `Offline`), ring share %, stored keys count, and throughput.
* **Live Node Actions:**
  * `View Keys`: Slide-over modal displaying in-memory key table with search filter and purge.
  * `Activate / Disable`: Toggles node state, dynamically rerouting requests to clockwise successors.
  * `Purge`: Flushes stored keys from the node instance.
  * `Remove`: Decommissions the node and automatically rebalances orphaned keys.
* **Provision Node Modal:** Dynamically introduces a new physical node into the active cluster with customizable color, IP, port, and virtual node count.

### 5. Interactive Key-Value Query Console
* Production query workbench supporting `GET`, `PUT`, and `DELETE` commands.
* Quick-pick sample key buttons and realistic workload presets (E-Commerce Storefront, Video Streaming, Microservice Auth).
* **Live Response Inspector:** Displays HTTP-like response status (`200 OK • Cache Hit`, `404 Not Found • Cache Miss`, `201 Created • Item Stored`), execution latency in milliseconds, target node, 32-bit hash, and payload viewer.
* **Audit Execution History:** Live table logging all recent cluster operations.

### 6. Diagnostic Execution Trace Inspector
* Hop-by-hop diagnostic timeline for every query:
  1. **Key Hashing:** Raw key string converted to 32-bit integer via Murmur3.
  2. **Ring Lookup:** Binary search locating first virtual node $\ge H(K)$.
  3. **Node Resolution:** Mapping virtual node token to physical cluster instance.
  4. **Cache Execution:** In-memory store operation executed with roundtrip latency measurement.

### 7. Topology Resizing & Rebalance Benchmark
* Real-time comparative simulation contrasting Consistent Hashing against Linear Modulo Hashing.
* Simulates Scale-Out ($N \to N+1$) and Scale-In ($N \to N-1$) across 100, 200, 500, or 1,000 keys.
* **KPI Comparisons:**
  * **Consistent Hashing Churn:** Quantifies remapped keys ($\approx 20\%$, theoretical bound $\approx \frac{1}{N+1}$).
  * **Modulo Hashing Churn:** Demonstrates mass churn ($\approx 80\%$, theoretical bound $\approx \frac{N}{N+1}$).
  * **Cache Miss Avoidance:** Demonstrates $+60\%$ to $+80\%$ key retention advantage.
* Side-by-side distribution migration bars and individual key sample audit records.

---

## 🔄 5. Dynamic Real-Time Implementation

Every component in CacheRing operates **100% dynamically** in memory:
* **No Mock Data:** Every key entered in the console is dynamically hashed with Murmur3, mathematically mapped to the ring, and written to an actual `Map<string, CacheItem>` on the designated node.
* **Live Key Migration:** Adding a server calls `rebalanceKeys()`, identifying which keys have their clockwise successor taken over by the new node and migrating them in real time.
* **Live Rebalance Benchmarks:** The benchmark executes live hash computations and ring searches across actual test keys to calculate genuine remapping percentages.

---

## 💻 6. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Server and client component rendering architecture |
| **Library** | **React 19** | Component lifecycle and dynamic reactive state |
| **Language** | **TypeScript 5** | Strict type definitions across cluster data models |
| **Styling** | **Tailwind CSS v4** | Modern utility-first styling and theme tokens |
| **Typography** | **Plus Jakarta Sans** | Modern geometric sans-serif for UI and telemetry |
| **Monospace** | **JetBrains Mono / System** | Precision display for 32-bit hex hashes and IPs |
| **Icons** | **Lucide React** | Clean, lightweight SVG icon system |
| **Graphics** | **SVG Geometry Engine** | Dynamic polar coordinate calculation ($r, \theta$) |

---

## 📁 7. Repository File Structure

```
distributed-cache/
├── public/
│   ├── logo.png                # Official CacheRing geometric network logo (transparent)
│   └── logo-transparent.png    # High-resolution transparent logo asset
├── src/
│   ├── app/
│   │   ├── globals.css         # Global stylesheet, Plus Jakarta Sans, card elevation
│   │   ├── layout.tsx          # Root layout, CacheRing metadata, favicon configuration
│   │   └── page.tsx            # Main application layout, KPI deck, active tab coordinator
│   ├── components/
│   │   ├── Navbar.tsx          # Floating rounded capsule pill navigation bar
│   │   ├── HashRingVisualizer.tsx # 40px thick ring visualizer with integrated toggles
│   │   ├── ClusterNodeGrid.tsx # Physical node management table & provisioning modal
│   │   ├── InteractiveConsole.tsx # KV query console, response inspector & audit log
│   │   ├── StepTraceDrawer.tsx # Diagnostic request execution hop trace modal
│   │   ├── RebalanceBenchmarkModal.tsx # Topology rescaling simulation & churn analysis
│   │   └── NodeDetailModal.tsx # In-memory key table slide-over with search filter
│   └── lib/
│       ├── hashAlgorithms.ts   # 32-bit Murmur3 and FNV-1a hash functions
│       ├── consistentHashRing.ts # ConsistentHashRing class, binary search, partition math
│       ├── cacheCluster.ts     # DistributedCacheCluster class, dynamic node stores, LRU
│       ├── benchmark.ts        # Rebalance comparison engine (Consistent vs Modulo)
│       ├── presets.ts          # Default nodes and workload datasets
│       └── types.ts            # Core TypeScript interfaces and type definitions
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
└── README.md                   # Comprehensive project documentation
```

---

## 🚀 8. Local Installation & Execution

### Prerequisites
* **Node.js**: v18.18.0 or newer
* **npm**: v9.0.0 or newer

### Setup Steps

1. **Clone or Navigate to the Workspace:**
   ```bash
   cd "d:/Desktop/DC MP/distributed-cache"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to: **`http://localhost:3000`**

4. **Build Production Bundle:**
   ```bash
   npm run build
   ```

5. **Start Production Server:**
   ```bash
   npm run start
   ```

---

## 🧪 9. Operational Scenarios & Verification

### Scenario A: Testing Dynamic Key Routing & Storage
1. Navigate to the **Data Console** tab.
2. Select **GET** and query an existing key: `prod:macbook_pro_m3`.
3. Observe the **Response Inspector**: returns `200 OK • Cache Hit`, displaying latency, target server, 32-bit Murmur3 hash, and JSON payload.
4. Click **Inspect Routing Trace** to review the exact step-by-step lookup path.
5. Select **PUT**, enter key `user:session_99` with payload `{"role":"admin"}`, and click **Execute PUT Request**.
6. Switch to the **Ring Topology** tab — observe the newly stored key dot positioned at its exact angle on the ring.

### Scenario B: Dynamic Node Scaling & Zero-Downtime Rebalancing
1. Navigate to the **Ring Topology** tab — note the partition distribution among existing nodes.
2. Switch to **Cluster Nodes** and click **Provision Node**.
3. Enter name `Node E`, select an accent color, and click **Provision & Rebalance**.
4. Return to **Ring Topology** — observe the newly generated partitions interleaved around the ring.
5. Inspect the telemetry: notice that only the minimum required keys migrated to Node E, while the rest remained in place.

### Scenario C: Simulating Churn Resistance (Benchmark)
1. Navigate to the **Rebalance Analysis** tab.
2. Select **Scale Out (+1 Node)** with a dataset size of **500 Keys**.
3. Click **Run Simulation**.
4. Review the results:
   * **Consistent Hashing:** Only $\approx 18\% - 22\%$ of keys migrate.
   * **Linear Modulo Hashing:** Over $\approx 80\% - 85\%$ of keys migrate.
   * **Advantage:** Preserves over $60\%$ of cache entries that would have otherwise caused backend database saturation.

---

## 📄 License
This project is released under the **MIT License**.
