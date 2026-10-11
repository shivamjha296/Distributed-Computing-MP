import { PhysicalNode, WorkloadPreset } from './types';

export const INITIAL_NODES: PhysicalNode[] = [
  {
    id: 'node-alpha',
    name: 'Node Alpha',
    ip: '192.168.1.101',
    port: 6379,
    color: '#2563eb', // Enterprise Blue
    vnodesCount: 5,
    status: 'online',
    memoryCapacity: 12,
    evictionPolicy: 'LRU',
    weight: 1,
    createdAt: 1700000000000,
    stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
  },
  {
    id: 'node-beta',
    name: 'Node Beta',
    ip: '192.168.1.102',
    port: 6380,
    color: '#059669', // Forest Emerald
    vnodesCount: 5,
    status: 'online',
    memoryCapacity: 12,
    evictionPolicy: 'LRU',
    weight: 1,
    createdAt: 1700000001000,
    stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
  },
  {
    id: 'node-gamma',
    name: 'Node Gamma',
    ip: '192.168.1.103',
    port: 6381,
    color: '#d97706', // Warm Amber
    vnodesCount: 5,
    status: 'online',
    memoryCapacity: 12,
    evictionPolicy: 'LFU',
    weight: 1,
    createdAt: 1700000002000,
    stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
  },
  {
    id: 'node-delta',
    name: 'Node Delta',
    ip: '192.168.1.104',
    port: 6382,
    color: '#475569', // Slate Steel
    vnodesCount: 5,
    status: 'online',
    memoryCapacity: 12,
    evictionPolicy: 'FIFO',
    weight: 1,
    createdAt: 1700000003000,
    stats: { hits: 0, misses: 0, writes: 0, deletes: 0, evictions: 0 },
  },
];

export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    name: 'E-Commerce Storefront',
    category: 'Retail & Cart',
    description: 'Hot product catalog items, flash deals with TTL, and shopping cart sessions.',
    sampleKeys: [
      { key: 'prod:macbook_pro_m3', value: '{"name":"MacBook Pro M3","price":1999,"stock":14}', ttl: 60 },
      { key: 'prod:iphone_16_pro', value: '{"name":"iPhone 16 Pro","price":1199,"stock":52}', ttl: 60 },
      { key: 'prod:sony_wh1000xm5', value: '{"name":"Sony WH-1000XM5","price":399,"stock":8}', ttl: 45 },
      { key: 'cart:session_4812', value: '{"items":["macbook_pro","airpods"],"total":2248}' },
      { key: 'flash_sale:deal_99', value: '{"discount":50,"code":"SAVE50"}' , ttl: 25 },
      { key: 'user:session_9901', value: '{"userId":"usr_9901","auth":true,"tier":"enterprise"}' },
      { key: 'prod:mechanical_keyboard', value: '{"name":"Keychron Q1","price":189,"stock":20}' },
      { key: 'search:query_headphones', value: '{"cached_results":[101,102,105]}' },
    ],
  },
  {
    name: 'Video Streaming & Social Feed',
    category: 'Media & Social',
    description: 'Trending media metadata, video stream chunks, and live user profiles.',
    sampleKeys: [
      { key: 'video:intro_consistent_hash', value: '{"title":"Consistent Hashing Architecture","views":12400,"res":"4K"}' },
      { key: 'stream:live_edge_cluster', value: '{"status":"live","bitrate":"6000kbps","viewers":580}', ttl: 30 },
      { key: 'user:account_7821', value: '{"username":"dev_operator","role":"admin","region":"us-east-1"}' },
      { key: 'channel:system_announcements', value: '{"members":250,"channel":"broadcast"}' },
      { key: 'trending:hashtags_today', value: '{"tags":["#ConsistentHashing","#DistributedSystems","#Cloud"]}', ttl: 40 },
      { key: 'video:dynamo_db_paper_breakdown', value: '{"author":"Amazon Systems Team","citations":4500}' },
    ],
  },
  {
    name: 'Microservice Auth & Rate Limiting',
    category: 'Infrastructure',
    description: 'JWT authorization tokens, API rate limiter buckets, and feature flags.',
    sampleKeys: [
      { key: 'jwt:auth_token_98214', value: '{"sub":"user_123","exp":1760000000,"scope":"read:write"}', ttl: 35 },
      { key: 'rate_limit:ip_103_21_244', value: '{"remaining":48,"reset":1710000000}', ttl: 20 },
      { key: 'flag:v2_ring_routing', value: '{"enabled":true,"rollout":100}' },
      { key: 'service:api_gateway_health', value: '{"status":"healthy","uptime":99.98}' },
      { key: 'cache:dns_resolver_entry', value: '{"cname":"cache.internal.cluster","ttl":300}' },
    ],
  },
];
