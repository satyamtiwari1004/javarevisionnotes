import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "What is Kafka?",
    icon: "◎",
    color: "#06B6D4",
    desc: "Distributed event streaming platform — core philosophy and positioning.",
    topics: [
      {
        n: "Kafka in one sentence & the problem it solves",
        tag: "CONCEPT",
        desc: `Apache Kafka is a distributed, partitioned, replicated commit log service that acts as a real-time event streaming platform.

Before Kafka, companies had a spaghetti of point-to-point integrations: every producer system had to know about every consumer system. Adding one new consumer meant wiring it to every producer. N producers × M consumers = N×M connections to build, maintain, and monitor.

Kafka solves this with a central nervous system. Producers write events to Kafka once. Any number of consumers read from Kafka independently, at their own pace, without producers knowing they exist. This decouples systems in space (different services) and in time (consumers can be offline and catch up later).

The mental model: Kafka is like a persistent, replayable, highly scalable messaging log — think of it as a distributed append-only ledger that everyone writes to and reads from.`,
        code: `// ── Before Kafka (point-to-point spaghetti) ──────────────
//
//   OrderService ──→ InventoryService
//   OrderService ──→ EmailService
//   OrderService ──→ AnalyticsService
//   OrderService ──→ FraudService
//   OrderService ──→ ShippingService
//
//   Adding a 6th consumer means touching OrderService again!
//   If EmailService is down, OrderService must retry or data is lost.

// ── After Kafka (hub-and-spoke) ───────────────────────────
//
//   OrderService ──→ [Kafka Topic: orders] ──→ InventoryService
//                                          ──→ EmailService
//                                          ──→ AnalyticsService
//                                          ──→ FraudService
//                                          ──→ ShippingService
//
//   Adding new consumer: zero changes to OrderService.
//   EmailService offline? Kafka holds messages, catches up on restart.
//   AnalyticsService wants to reprocess last 7 days? Just replay the log.

// ── Core capabilities ─────────────────────────────────────
// 1. PUBLISH / SUBSCRIBE  — decouple producers from consumers
// 2. STORAGE              — retain events for configurable duration (days, forever)
// 3. STREAM PROCESSING    — process events in real time (Kafka Streams / ksqlDB)
// 4. HIGH THROUGHPUT      — millions of events/sec on commodity hardware
// 5. FAULT TOLERANCE      — data replicated across multiple brokers
// 6. SCALABILITY          — add brokers/partitions without downtime`
      },
      {
        n: "Kafka vs traditional message queues (RabbitMQ, ActiveMQ)",
        tag: "CONCEPT",
        desc: `Traditional message queues (RabbitMQ, JMS, ActiveMQ) follow a "consume and delete" model — once a consumer reads a message it's gone. Kafka is fundamentally different: it's a log, not a queue.

Key differences:

MESSAGE DELETION: Queues delete on acknowledgement. Kafka retains messages for a configured retention period regardless of consumption — multiple consumers can read the same message independently.

CONSUMER CONTROL: In queues, the broker tracks which messages are unacknowledged and retries. In Kafka, the consumer tracks its own position (offset) and decides when to move forward.

REPLAY: Queues cannot replay processed messages. Kafka can replay any historical event by resetting the consumer's offset.

ORDERING: Queues generally don't guarantee ordering under concurrency. Kafka guarantees ordering within a partition.

THROUGHPUT: Traditional queues optimise for smart routing (complex filter expressions, dead letter queues). Kafka optimises for raw throughput and durability at massive scale.

USE CASE FIT: Use RabbitMQ for task queues, RPC-style work distribution, and complex routing. Use Kafka for event streaming, audit logs, change data capture, and building event-driven architectures.`,
        code: `// ── Comparison table ──────────────────────────────────────
//
//  Feature              RabbitMQ / JMS          Apache Kafka
//  ─────────────────────────────────────────────────────────────
//  Model                Message Queue           Distributed Log
//  Message lifetime     Deleted after ack       Retained (configurable)
//  Consumer tracking    Broker tracks           Consumer tracks (offset)
//  Replay               ✗ Not possible          ✓ Reset offset anytime
//  Ordering             Per-queue               Per-partition (guaranteed)
//  Throughput           ~50k msg/s              ~1M+ msg/s per node
//  Consumer groups      Competing consumers      Independent consumer groups
//  Push/Pull            Push to consumer         Pull by consumer
//  Routing              Complex (exchanges/keys) Simple (topic + partition key)
//  Persistence          Optional                 Core feature (always)
//  Best for             Task queues, RPC         Event streaming, CDC, logs

// ── When to choose Kafka ──────────────────────────────────
// ✓ Multiple independent consumer teams need the same events
// ✓ You need replay / reprocessing of historical events
// ✓ High throughput (millions of events/sec)
// ✓ Event sourcing / audit trail (events as the source of truth)
// ✓ Change Data Capture (stream DB changes downstream)
// ✓ Real-time analytics pipelines

// ── When to choose a traditional queue ───────────────────
// ✓ Simple task/job queuing (one worker processes each task)
// ✓ RPC-style request/reply patterns
// ✓ Complex routing logic (headers, topic exchanges, wildcards)
// ✓ Small-scale deployments where Kafka's operational overhead is too high`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Core Architecture",
    icon: "⬡",
    color: "#A855F7",
    desc: "Brokers, topics, partitions, offsets — the physical and logical building blocks.",
    topics: [
      {
        n: "Brokers & the Kafka cluster",
        tag: "ARCHITECTURE",
        desc: `A Kafka cluster consists of one or more servers called brokers. Each broker is a JVM process running on a machine (or container) that stores data on local disk and serves producer/consumer requests over TCP.

BROKER ROLE: Every broker stores a subset of the data (partitions), handles read/write requests, and participates in replication. No broker is "special" — they are peers.

CONTROLLER: One broker in the cluster acts as the Controller. It manages partition leader election, cluster membership, and configuration changes. With KRaft mode (Kafka 3.x), the controller quorum uses Raft consensus and no longer requires ZooKeeper.

BOOTSTRAP SERVERS: Clients don't need to know all brokers. They connect to any broker in the bootstrap list, which returns the full cluster metadata. After that, clients communicate directly with the correct broker for each partition.

CLUSTER SIZING: A typical production cluster starts at 3 brokers (minimum for fault tolerance with replication factor 3). Large companies run thousands of brokers handling petabytes of data.`,
        code: `// ── Broker anatomy ────────────────────────────────────────
//
//  ┌─────────────────────────────────────────────────────┐
//  │                  Kafka Cluster                      │
//  │                                                     │
//  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
//  │  │   Broker 1   │  │   Broker 2   │  │ Broker 3 │  │
//  │  │ (Controller) │  │              │  │          │  │
//  │  │              │  │              │  │          │  │
//  │  │ orders-P0    │  │ orders-P0    │  │ orders-P1│  │
//  │  │ (Leader)     │  │ (Follower)   │  │ (Leader) │  │
//  │  │              │  │              │  │          │  │
//  │  │ orders-P1    │  │ orders-P1    │  │ orders-P0│  │
//  │  │ (Follower)   │  │ (Follower)   │  │ (Follower│  │
//  │  └──────────────┘  └──────────────┘  └──────────┘  │
//  └─────────────────────────────────────────────────────┘

// ── Producer/Consumer cluster connection ───────────────────
Properties props = new Properties();
props.put("bootstrap.servers", "broker1:9092,broker2:9092,broker3:9092");
// Client uses ONE of these to get metadata → then talks to correct broker
// If broker1 is down, client tries broker2, then broker3

// ── Broker config highlights ──────────────────────────────
# server.properties
broker.id=1                          # unique per broker
listeners=PLAINTEXT://0.0.0.0:9092  # what port to listen on
log.dirs=/var/kafka/data             # where partitions are stored on disk
num.partitions=3                     # default partitions for new topics
default.replication.factor=3         # default replication for new topics
log.retention.hours=168              # retain data for 7 days
log.segment.bytes=1073741824         # 1GB segment file size`
      },
      {
        n: "Topics, Partitions & Offsets",
        tag: "ARCHITECTURE",
        desc: `These three concepts form the backbone of all of Kafka's guarantees.

TOPIC: A named stream of records. Logical category like "orders", "user-clicks", "payment-events". Like a database table, but append-only and partitioned.

PARTITION: Each topic is split into N partitions. A partition is an ordered, immutable sequence of records stored on disk as a log file on one broker. Partitions are the unit of parallelism — more partitions = more producers/consumers can work in parallel.

OFFSET: Every record in a partition has a monotonically increasing integer ID called its offset. Offset 0 is the first record, offset 1 is the second, etc. Offsets are local to each partition (partition 0 and partition 1 both start at offset 0).

WHY THIS MATTERS:
- Ordering is guaranteed within a partition, not across partitions.
- The partition key determines which partition a record goes to (hash of key % num_partitions).
- A consumer's position is completely described by (topic, partition, offset).
- To replay events, reset the offset to an earlier value.`,
        code: `// ── Visual: Topic "orders" with 3 partitions ─────────────
//
//  Partition 0:  [off:0] [off:1] [off:2] [off:3] [off:4] ...
//  Partition 1:  [off:0] [off:1] [off:2] ...
//  Partition 2:  [off:0] [off:1] [off:2] [off:3] [off:4] [off:5] ...
//                                                           ▲
//                                              newest record (high-watermark)
//
//  Offsets are LOCAL to each partition. They never repeat within a partition.

// ── Partition key routing ─────────────────────────────────
ProducerRecord<String, String> record = new ProducerRecord<>(
    "orders",          // topic
    "customer-123",    // partition KEY → same key always → same partition
    orderJson          // value
);
// All events for customer-123 land in the same partition → ordered per customer

// Without a key → round-robin across partitions (default in recent Kafka)
ProducerRecord<String, String> noKey = new ProducerRecord<>("orders", orderJson);

// ── Choosing number of partitions ────────────────────────
// Rule of thumb:
//   Max consumer throughput per partition ≈ 50 MB/s (disk I/O bound)
//   Target throughput / 50 MB/s = minimum partitions
//
//   If you expect 10 consumers per consumer group → need ≥ 10 partitions
//   (a partition can only be assigned to ONE consumer per group)
//
//   WARNING: You can increase partitions but NEVER decrease.
//            Increasing partitions breaks key ordering guarantees.

// ── Check offsets via CLI ─────────────────────────────────
# Show current offsets for a consumer group
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --describe

# Output:
# TOPIC    PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# orders   0          1024            1100            76
# orders   1          890             891             1
# orders   2          755             755             0`
      },
      {
        n: "Leaders, Followers & In-Sync Replicas (ISR)",
        tag: "ARCHITECTURE",
        desc: `Kafka replicates each partition across multiple brokers for fault tolerance. This replication is based on a leader-follower model.

LEADER: One replica of each partition is designated the leader. ALL reads and writes for that partition go through the leader. Only the leader communicates with producers and consumers.

FOLLOWERS: The remaining replicas are followers. They passively replicate data from the leader by polling it continuously. Followers do not serve reads — they exist purely for redundancy.

IN-SYNC REPLICA (ISR): A follower is "in-sync" if it has replicated all messages up to the high-watermark and hasn't fallen behind by more than replica.lag.time.max.ms (default 30 seconds). The ISR set is dynamic — a slow follower is removed from ISR.

HIGH-WATERMARK: The offset up to which all ISR replicas have confirmed receipt. Consumers can only read up to the high-watermark (ensuring they never see uncommitted data).

ACKS AND ISR: The producer's acks setting determines how many ISR members must confirm a write before it's considered successful. acks=all means all ISR members must confirm — strongest durability guarantee.`,
        code: `// ── ISR and replication visual ────────────────────────────
//
//  Topic "orders" Partition 0  (replication factor = 3)
//
//  Broker 1 [LEADER]   offset: 0..100  ← Producer writes here
//  Broker 2 [FOLLOWER] offset: 0..100  ← In ISR (caught up)
//  Broker 3 [FOLLOWER] offset: 0..95   ← Possibly removed from ISR
//                                         (lagging > lag.time.max.ms)
//
//  ISR = [Broker1, Broker2]   (Broker3 temporarily removed)
//
//  High-watermark = 100 (both ISR brokers confirmed up to 100)
//  Consumers can read up to offset 100

// ── Producer acks settings ────────────────────────────────
props.put("acks", "0");    // Fire and forget — no confirmation, fastest, data loss risk
props.put("acks", "1");    // Leader confirms — leader crashes before replication = data loss
props.put("acks", "all"); // ALL ISR confirms — strongest, no data loss (recommended)

// ── What happens when leader fails ───────────────────────
// 1. Controller detects leader Broker1 is down (via heartbeat timeout)
// 2. Controller elects a new leader from the ISR (e.g. Broker2)
// 3. Controller updates ZooKeeper/KRaft metadata
// 4. Clients get metadata update, redirect writes to Broker2
// 5. Broker1 restarts, becomes follower, syncs from Broker2
//    → if "unclean.leader.election.enable=false" (default), only ISR members
//      can be elected → guarantees no data loss
//    → if "true", any replica can become leader → possible data loss but
//      higher availability

// ── min.insync.replicas ───────────────────────────────────
# Minimum ISR replicas that must acknowledge a write
# With replication.factor=3 and min.insync.replicas=2:
# - If 2 brokers are up and in ISR → writes succeed (acks=all)
# - If only 1 broker is up → writes fail with NotEnoughReplicasException
# - This prevents silent data loss
min.insync.replicas=2`
      },
      {
        n: "ZooKeeper vs KRaft mode",
        tag: "ARCHITECTURE",
        desc: `Historically, Kafka used Apache ZooKeeper for cluster coordination — storing broker metadata, partition assignments, leader elections, and consumer group offsets. ZooKeeper is a separate distributed system that Kafka depended on.

PROBLEMS WITH ZOOKEEPER:
- Extra operational complexity: you run and monitor two distributed systems.
- Scalability bottleneck: ZooKeeper struggles when partition count reaches hundreds of thousands.
- Slow recovery: metadata propagation through ZooKeeper slows failover times.

KRAFT (Kafka Raft): Introduced in Kafka 2.8 (preview) and production-ready in Kafka 3.3+. KRaft replaces ZooKeeper by embedding a Raft consensus protocol directly into Kafka brokers. A subset of brokers form the Controller Quorum (using Raft) to manage metadata.

BENEFITS OF KRAFT:
- Single system to operate (no ZooKeeper cluster needed).
- Supports millions of partitions (ZooKeeper was limited to ~200k).
- Faster leader election and metadata propagation.
- Simplified security configuration.
- ZooKeeper was officially removed in Kafka 4.0.`,
        code: `// ── ZooKeeper era (pre-Kafka 3.3) ────────────────────────
//
//  ZooKeeper Ensemble (3 nodes)
//       │
//       ├── /brokers/ids/[1,2,3]       ← broker registration
//       ├── /brokers/topics/orders/...  ← partition assignments
//       ├── /controller                 ← which broker is controller
//       └── /consumers/...             ← consumer group offsets (old)
//
//  Every broker watches ZooKeeper. Controller watches for broker joins/leaves.
//  ZooKeeper is a separate process — must be separately deployed, monitored, scaled.

// ── KRaft era (Kafka 3.3+ production) ───────────────────
//
//  Kafka Cluster (combined mode: 3 nodes are both broker + controller)
//
//  ┌──────────────┐    Raft    ┌──────────────┐    Raft    ┌──────────────┐
//  │  Broker 1   │◄──────────►│  Broker 2   │◄──────────►│  Broker 3   │
//  │  (Controller│            │  (Controller│            │  (Controller │
//  │   Quorum)   │            │   Quorum)   │            │   Quorum)   │
//  └──────────────┘            └──────────────┘            └──────────────┘
//  Metadata stored in an internal Kafka topic: __cluster_metadata
//  No ZooKeeper needed!

# KRaft configuration (server.properties)
process.roles=broker,controller        # this node is both broker and controller
node.id=1
controller.quorum.voters=1@broker1:9093,2@broker2:9093,3@broker3:9093
listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
controller.listener.names=CONTROLLER

# Format storage before first start (KRaft specific)
kafka-storage.sh format -t $(kafka-storage.sh random-uuid) -c server.properties`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Producers",
    icon: "⊕",
    color: "#10B981",
    desc: "How producers write records — batching, compression, idempotency, and delivery guarantees.",
    topics: [
      {
        n: "Producer internals — record accumulator, batching & sending",
        tag: "PRODUCER",
        desc: `Understanding the producer's internal pipeline is key to tuning throughput vs. latency.

When you call producer.send(), the record does NOT go to the network immediately. It enters the RecordAccumulator — an in-memory buffer organised by (topic, partition). Records accumulate there until either:
  - A batch reaches batch.size bytes (default 16KB), OR
  - linger.ms milliseconds pass (default 0 — meaning send immediately)

The Sender thread (background thread) takes batches from the accumulator and sends them to the appropriate broker's leader. Multiple batches for different partitions can be sent in a single network request (pipelining).

KEY INSIGHT: linger.ms=0 optimises for lowest latency (every record sent as soon as possible). linger.ms=5 trades 5ms of latency for much better throughput by building larger batches. High throughput systems set linger.ms=5-20 and batch.size=65536+.`,
        code: `// ── Producer config for high throughput ─────────────────
Properties props = new Properties();
props.put("bootstrap.servers", "broker1:9092,broker2:9092");
props.put("key.serializer",   "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// Batching
props.put("batch.size",    65536);   // 64KB batch size (default 16KB)
props.put("linger.ms",     10);      // wait up to 10ms to fill batch
props.put("buffer.memory", 67108864); // 64MB total producer buffer (default 32MB)

// Compression
props.put("compression.type", "snappy"); // snappy | gzip | lz4 | zstd | none
// Snappy: fast compression, good ratio — best for most cases
// Gzip:   slower, better ratio — good for text/JSON
// LZ4:    fastest compression — best for high throughput
// Zstd:   best ratio — good when bandwidth is the bottleneck

// Reliability
props.put("acks", "all");            // all ISR must confirm
props.put("retries", Integer.MAX_VALUE); // retry until success (with idempotency)
props.put("delivery.timeout.ms", 120000); // 2 minutes total timeout for delivery

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// ── Send with callback ────────────────────────────────────
ProducerRecord<String, String> record = new ProducerRecord<>("orders", "key", "value");

producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        log.error("Send failed", exception);
    } else {
        log.info("Sent to {}-{} offset {}",
            metadata.topic(), metadata.partition(), metadata.offset());
    }
});

// ── Synchronous send (blocks until acknowledged) ──────────
try {
    RecordMetadata meta = producer.send(record).get();
    System.out.println("Offset: " + meta.offset());
} catch (ExecutionException e) {
    System.err.println("Send failed: " + e.getCause());
}

producer.flush();  // force send of buffered records
producer.close();  // flush + close connections`
      },
      {
        n: "Idempotent producer & exactly-once semantics (EOS)",
        tag: "PRODUCER",
        desc: `Kafka provides three delivery guarantee levels for producers:

AT-MOST-ONCE: Messages may be lost but never duplicated. Producer sends without retries (acks=0 or retries=0). Simplest but weakest.

AT-LEAST-ONCE: Messages never lost but may be duplicated. Producer retries on failure (acks=all, retries=MAX_INT). On network timeout, producer may retry a message the broker already committed → duplicate.

EXACTLY-ONCE (EOS): Messages delivered exactly once — no loss, no duplicates. Requires:
  1. IDEMPOTENT PRODUCER (enable.idempotence=true): Kafka assigns each producer a PID (Producer ID) and each record a sequence number. Broker detects and deduplicates retries within a session.
  2. TRANSACTIONAL PRODUCER: Groups multiple sends into an atomic transaction. Either ALL succeed or NONE are visible to consumers. Used in Kafka Streams for read-process-write pipelines.

IMPORTANT: Exactly-once is only guaranteed for Kafka-to-Kafka flows (not external systems like databases). For database sinks, you need idempotent consumption on the consumer side.`,
        code: `// ── AT-MOST-ONCE (fire and forget) ───────────────────────
props.put("acks", "0");
props.put("retries", 0);
producer.send(record);  // no callback, no error handling

// ── AT-LEAST-ONCE ─────────────────────────────────────────
props.put("acks", "all");
props.put("retries", Integer.MAX_VALUE);
props.put("enable.idempotence", false);  // duplicates possible on retry
producer.send(record, callback);

// ── IDEMPOTENT PRODUCER (removes duplicates within a session) ──
props.put("enable.idempotence", true);  // sets acks=all, retries=MAX automatically
// Each (producerId, partition, sequenceNumber) triple is unique
// Broker rejects duplicate sequence numbers → no duplicates on retry
// LIMITATION: Only deduplicates within one producer session (new PID on restart)

// ── EXACTLY-ONCE via Transactions ─────────────────────────
props.put("enable.idempotence", true);
props.put("transactional.id", "order-processor-1");  // unique per producer instance
                                                       // must survive restarts

KafkaProducer<String, String> txProducer = new KafkaProducer<>(props);
txProducer.initTransactions();  // register with broker's transaction coordinator

try {
    txProducer.beginTransaction();

    // All sends within the transaction are atomic
    txProducer.send(new ProducerRecord<>("processed-orders", key, processedValue));
    txProducer.send(new ProducerRecord<>("audit-log", key, auditValue));

    // Commit offsets of consumed records atomically with the produced records
    // (used in Kafka Streams / consume-process-produce loop)
    txProducer.sendOffsetsToTransaction(offsetsMap, consumerGroupMetadata);

    txProducer.commitTransaction();  // atomic — all or nothing
} catch (Exception e) {
    txProducer.abortTransaction();   // rollback all sends in this transaction
    throw e;
}
// Consumers using isolation.level=read_committed only see committed records`
      },
      {
        n: "Partitioner — how records land on partitions",
        tag: "PRODUCER",
        desc: `The partitioner determines which partition a ProducerRecord is routed to. This has major implications for ordering, hotspots, and load balancing.

DEFAULT PARTITIONER (Kafka 2.4+): If a key is present, uses murmur2 hash of the key modulo numPartitions. Records with the same key always go to the same partition → ordering guarantee per key. If no key, uses sticky partitioning — fills one partition's batch before moving to the next (better batching than pure round-robin).

ROUND-ROBIN PARTITIONER (old default before 2.4): Distributes records evenly across partitions. Poor batching — each record may go to a different partition, creating many tiny batches.

NULL KEY: With no key, records are spread across partitions in a sticky (then round-robin) manner. You lose ordering guarantees across all partitions.

CUSTOM PARTITIONER: Implement the Partitioner interface when you need business-logic based routing (e.g., route VIP customers to a dedicated partition, geo-based routing, etc.).

HOTSPOT WARNING: If you use a skewed key (e.g., all events have key="US"), one partition gets all the traffic while others sit idle. Monitor partition lag to detect hotspots.`,
        code: `// ── Key-based partitioning (same key → same partition) ───
// Good for: ordering per entity (user, order, device)
producer.send(new ProducerRecord<>("events", "user-123", eventJson));
producer.send(new ProducerRecord<>("events", "user-123", event2Json));
// Both records go to the same partition → guaranteed ordering for user-123

// ── No key (sticky partitioning) ─────────────────────────
producer.send(new ProducerRecord<>("events", eventJson));
// Goes to current sticky partition, switches after batch is full

// ── Explicit partition override ────────────────────────────
producer.send(new ProducerRecord<>("events", 2, "key", value));
// Always goes to partition 2 — useful for testing

// ── Custom Partitioner ────────────────────────────────────
public class VipPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();

        // Route VIP customers to partition 0, others spread across rest
        if (key != null && key.toString().startsWith("VIP-")) {
            return 0;
        }
        // Non-VIP: spread across remaining partitions
        return (Utils.murmur2(keyBytes) & Integer.MAX_VALUE) % (numPartitions - 1) + 1;
    }

    @Override public void configure(Map<String, ?> configs) {}
    @Override public void close() {}
}

// Register custom partitioner
props.put("partitioner.class", VipPartitioner.class.getName());`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Consumers",
    icon: "⊛",
    color: "#F59E0B",
    desc: "Consumer groups, offset management, rebalancing, and delivery guarantees on the consumer side.",
    topics: [
      {
        n: "Consumer groups & partition assignment",
        tag: "CONSUMER",
        desc: `Consumer groups are the fundamental unit of scalable consumption in Kafka.

CONSUMER GROUP: A set of consumers sharing the same group.id. Kafka assigns each partition to exactly one consumer within a group at any time. This provides automatic load balancing.

THE GOLDEN RULE: One partition can be read by only one consumer per group at a time. This is what prevents duplicate processing within a group. Multiple groups can read the same partitions independently.

SCALE UP: If a topic has 6 partitions and you start 3 consumers in a group, each gets 2 partitions. Start a 4th consumer? Kafka rebalances, and one consumer gets 0 partitions (idle — can't have more active consumers than partitions). Start a 7th consumer? Also idle.

MULTIPLE GROUPS: The same topic can be consumed by many independent groups. An analytics group and an email group both read "orders" — each at their own pace, with independent offsets. This is the key advantage over traditional queues.

GROUP COORDINATOR: A broker acts as the Group Coordinator for each consumer group. It manages heartbeats, tracks which consumers are alive, and triggers rebalances.`,
        code: `// ── Consumer group visual ────────────────────────────────
//
//  Topic "orders" — 6 partitions: P0, P1, P2, P3, P4, P5
//
//  Consumer Group "order-processor" (3 consumers):
//    Consumer A → P0, P1
//    Consumer B → P2, P3
//    Consumer C → P4, P5
//
//  Consumer Group "analytics" (2 consumers):
//    Consumer X → P0, P1, P2
//    Consumer Y → P3, P4, P5
//
//  BOTH groups read ALL partitions independently!
//  Adding Consumer D to "order-processor" triggers rebalance:
//    Consumer A → P0, P1
//    Consumer B → P2, P3
//    Consumer C → P4
//    Consumer D → P5

// ── Basic consumer setup ──────────────────────────────────
Properties props = new Properties();
props.put("bootstrap.servers", "broker1:9092");
props.put("group.id", "order-processor");
props.put("key.deserializer",   "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("auto.offset.reset",  "earliest"); // start from beginning if no committed offset

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("orders"));  // subscribe to topic (dynamic assignment)

// ── Poll loop ─────────────────────────────────────────────
try {
    while (true) {
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
        for (ConsumerRecord<String, String> record : records) {
            System.out.printf("partition=%d offset=%d key=%s value=%s%n",
                record.partition(), record.offset(), record.key(), record.value());
            process(record);
        }
        consumer.commitSync();  // commit after processing batch
    }
} finally {
    consumer.close();  // triggers graceful rebalance
}`
      },
      {
        n: "Offset management — auto vs manual commit",
        tag: "CONSUMER",
        desc: `Offsets represent a consumer's position in a partition. Managing offsets correctly is essential for achieving the delivery guarantee you want.

AUTO COMMIT (enable.auto.commit=true, default): Kafka commits the offset of the last polled record every auto.commit.interval.ms (default 5 seconds). This can cause:
- Duplicate processing: consumer crashes after processing but before auto-commit → records re-delivered.
- Data loss: offset committed before processing completes → consumer crashes mid-processing, skips those records on restart.

MANUAL COMMIT — SYNC (commitSync()): Blocks until broker acknowledges the commit. Reliable but slower. Use after processing a batch.

MANUAL COMMIT — ASYNC (commitAsync()): Non-blocking. Does not retry on failure — could lead to offset going backward if a later commit succeeds first. Often used with a callback for logging.

BEST PRACTICE: Use commitSync() at the end of each batch for at-least-once. For exactly-once with external systems, use idempotent consumer logic (process-then-commit, with deduplication on the consumer side).`,
        code: `// ── Auto commit (default) — may cause duplicates ─────────
props.put("enable.auto.commit",           true);
props.put("auto.commit.interval.ms",      5000); // commit every 5s
// RISK: crash between poll() and next auto-commit → reprocess on restart

// ── Manual commitSync after each batch ────────────────────
props.put("enable.auto.commit", false);

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> rec : records) {
        processRecord(rec);  // process FIRST
    }
    consumer.commitSync();   // THEN commit — at-least-once guarantee
    // If crash between process and commit → records re-delivered on restart
    // Ensure processRecord() is idempotent!
}

// ── Manual commitSync per partition (fine-grained) ────────
Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
for (ConsumerRecord<String, String> rec : records) {
    processRecord(rec);
    offsets.put(
        new TopicPartition(rec.topic(), rec.partition()),
        new OffsetAndMetadata(rec.offset() + 1)  // commit NEXT offset to read
    );
}
consumer.commitSync(offsets);

// ── Manual commitAsync (non-blocking) ────────────────────
for (ConsumerRecord<String, String> rec : records) processRecord(rec);
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) log.error("Async commit failed", exception);
});

// ── auto.offset.reset behaviour ───────────────────────────
props.put("auto.offset.reset", "earliest"); // start from beginning (no prior offset)
props.put("auto.offset.reset", "latest");   // start from now (skip historical)
props.put("auto.offset.reset", "none");     // throw exception if no offset found`
      },
      {
        n: "Rebalancing — cooperative vs eager",
        tag: "CONSUMER",
        desc: `A rebalance is triggered when the consumer group membership changes: a consumer joins, leaves, or crashes. During a rebalance, partition assignments are redistributed among the surviving consumers.

EAGER REBALANCE (stop-the-world): All consumers stop consuming and revoke ALL their partitions simultaneously. Then new assignments are calculated and distributed. This causes a complete consumption pause — the "stop-the-world" gap can last seconds or more on large groups. Default before Kafka 2.4.

COOPERATIVE/INCREMENTAL REBALANCE (Kafka 2.4+): Only the partitions that need to move are revoked. Consumers keep their unaffected partitions and continue processing. Multiple rounds of small rebalances instead of one big stop-the-world event. Use CooperativeStickyAssignor.

STICKY ASSIGNOR: Tries to keep existing assignments when rebalancing, minimising the number of partition moves. Reduces rebalance duration.

SESSION TIMEOUT vs HEARTBEAT: Consumers send heartbeats to the group coordinator every heartbeat.interval.ms (default 3s). If no heartbeat within session.timeout.ms (default 45s), consumer is declared dead → rebalance triggered. Tune these for your processing latency.`,
        code: `// ── Partition assignors ──────────────────────────────────
// RangeAssignor (default): assigns contiguous partitions per topic — may be uneven
// RoundRobinAssignor: round-robin across all topics — more even
// StickyAssignor: eager but minimises partition movement
// CooperativeStickyAssignor: incremental rebalance (recommended for new apps)

props.put("partition.assignment.strategy",
    "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");

// ── Rebalance listener — handle partition revocation ──────
consumer.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        // Called before partitions are taken away from this consumer
        // COMMIT OFFSETS HERE to avoid reprocessing
        log.info("Partitions revoked: {}", partitions);
        consumer.commitSync(currentOffsets);  // save progress
        // Also: flush any in-memory state for these partitions
    }

    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        // Called when new partitions are assigned to this consumer
        log.info("Partitions assigned: {}", partitions);
        // Load state for newly assigned partitions if needed
    }

    @Override
    public void onPartitionsLost(Collection<TopicPartition> partitions) {
        // Called in cooperative rebalance when partitions are lost without revocation
        // e.g., consumer is considered dead before it revoked
        log.warn("Partitions lost (no revocation): {}", partitions);
    }
});

// ── Heartbeat and timeout tuning ─────────────────────────
props.put("heartbeat.interval.ms",   3000);  // heartbeat every 3s
props.put("session.timeout.ms",     45000);  // dead after 45s of no heartbeat
props.put("max.poll.interval.ms",  300000);  // 5 min to process between polls
// If processing takes longer than max.poll.interval.ms → consumer is considered dead
// → increase max.poll.interval.ms or reduce records per poll
props.put("max.poll.records",          500); // max records per poll() call`
      },
      {
        n: "Consumer lag & backpressure",
        tag: "CONSUMER",
        desc: `Consumer lag is the difference between the latest offset in a partition (log-end-offset) and the consumer's committed offset (current-offset). It measures how far behind a consumer group is.

LAG = LOG-END-OFFSET − CURRENT-OFFSET

WHY LAG MATTERS: Lag tells you if your consumers are keeping up with the producers. Rising lag means your consumers can't process events as fast as they arrive — a scaling problem. Zero lag means consumers are caught up.

CAUSES OF LAG: Slow processing logic, downstream database bottleneck, GC pauses, consumer group rebalances, insufficient partitions (can't add more consumers), or simply a traffic spike.

REDUCING LAG:
1. Add more partitions (prerequisite: need more partitions than current count).
2. Add more consumers to the group (up to numPartitions).
3. Optimise processing logic (async I/O, batch DB inserts).
4. Increase max.poll.records to process more per iteration.
5. Use parallel processing within each consumer.

MONITORING: Use Kafka's built-in kafka-consumer-groups.sh, or Confluent Control Center, or export metrics to Prometheus/Grafana via JMX.`,
        code: `// ── Check lag via CLI ────────────────────────────────────
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group order-processor \
  --describe

// Output:
// GROUP           TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
// order-processor orders  0          5120            5200            80   ← lagging!
// order-processor orders  1          4890            4890            0    ← caught up
// order-processor orders  2          3100            3200            100  ← lagging!

// ── Reset offsets (replay / skip) ────────────────────────
# Replay from beginning
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor --topic orders \
  --reset-offsets --to-earliest --execute

# Skip to latest (discard backlog)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor --topic orders \
  --reset-offsets --to-latest --execute

# Reset to specific offset
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor --topic orders \
  --reset-offsets --to-offset 1000 --execute

# Reset to specific datetime
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor --topic orders \
  --reset-offsets --to-datetime 2025-01-01T00:00:00.000 --execute

// ── Programmatic lag monitoring ───────────────────────────
Map<TopicPartition, Long> endOffsets = consumer.endOffsets(partitions);
Map<TopicPartition, OffsetAndMetadata> committed = consumer.committed(new HashSet<>(partitions));

for (TopicPartition tp : partitions) {
    long logEnd = endOffsets.get(tp);
    long current = committed.get(tp) != null ? committed.get(tp).offset() : 0;
    long lag = logEnd - current;
    metrics.gauge("kafka.consumer.lag", lag, "partition", tp.partition() + "");
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Storage & Retention",
    icon: "◫",
    color: "#EF4444",
    desc: "How Kafka stores data on disk — segments, indexes, compaction, and retention policies.",
    topics: [
      {
        n: "Log segments, indexes & disk storage",
        tag: "STORAGE",
        desc: `Kafka stores each partition as a series of segment files on disk. Understanding this helps you tune performance and understand Kafka's durability model.

SEGMENT FILES: A partition's data is stored in segment files (default 1GB each). Each segment consists of three files:
- .log: the actual record data (append-only)
- .index: sparse offset-to-position index (maps offset → byte offset in .log)
- .timeindex: sparse timestamp-to-offset index (maps timestamp → offset)

ACTIVE SEGMENT: Only the newest segment is active — it receives new writes. All older segments are read-only.

READ PATH: Consumer requests offset X → look up .index to find byte position → seek in .log file → read records. This is why Kafka read is O(1) — direct seek rather than scan.

PAGE CACHE: Kafka relies heavily on the OS page cache. Active segments are kept in RAM by the OS, making reads as fast as memory access for recent data. This is why Kafka runs best on machines with lots of RAM, but the RAM is used for page cache (not JVM heap).

SEQUENTIAL I/O: All writes are appended to the end of the active segment — sequential disk writes, which are nearly as fast as RAM on spinning disks and extremely fast on SSDs. This is Kafka's core performance trick.`,
        code: `// ── Partition directory structure on disk ────────────────
//
//  /var/kafka/data/orders-0/           ← partition directory
//    00000000000000000000.log          ← segment 0: records 0..999
//    00000000000000000000.index        ← offset index for segment 0
//    00000000000000000000.timeindex    ← timestamp index for segment 0
//    00000000000000001000.log          ← segment 1: records 1000..1999
//    00000000000000001000.index
//    00000000000000001000.timeindex
//    00000000000000002000.log          ← active segment (currently being written)
//    00000000000000002000.index
//    00000000000000002000.timeindex
//    leader-epoch-checkpoint
//
//  Filename = first offset in segment (zero-padded to 20 chars)

// ── Segment configuration ─────────────────────────────────
log.segment.bytes=1073741824          # 1GB: roll to new segment when this size hit
log.segment.ms=604800000              # 7 days: roll to new segment after this time
log.index.interval.bytes=4096         # index entry every 4KB of data
log.index.size.max.bytes=10485760     # max index file size: 10MB

// ── Viewing segment contents (for debugging) ──────────────
kafka-dump-log.sh \
  --files /var/kafka/data/orders-0/00000000000000000000.log \
  --print-data-log

// Output:
// Dumping /var/kafka/data/orders-0/00000000000000000000.log
// Starting offset: 0
// baseOffset: 0 lastOffset: 5 count: 6 ...
//   | offset: 0 ... key: order-123 payload: {"id":"order-123", ...}
//   | offset: 1 ... key: order-124 payload: {"id":"order-124", ...}`
      },
      {
        n: "Retention policies — time-based, size-based & log compaction",
        tag: "STORAGE",
        desc: `Kafka does NOT delete records when they are consumed. Deletion is driven by retention policy.

TIME-BASED RETENTION (default): Records are deleted when they are older than log.retention.hours (default 168 = 7 days). Deletion happens at the segment level — entire segments are deleted when all their records are older than the threshold.

SIZE-BASED RETENTION: Records are deleted when the total size of all segments for a partition exceeds log.retention.bytes. Oldest segments are deleted first.

LOG COMPACTION: Instead of deleting by age, Kafka retains the LATEST value for each key indefinitely. Old entries for the same key are compacted (deleted). Log-compacted topics are ideal for representing current state — like a changelog for a key-value store. The topic always retains at least one record per key.

CLEANUP POLICIES:
- cleanup.policy=delete (default): time/size-based deletion
- cleanup.policy=compact: log compaction (keep latest per key)
- cleanup.policy=compact,delete: compact + then delete old compacted records

USE CASES:
- Event logs, analytics → delete policy (care about recent events)
- Database changelogs, configuration → compact policy (care about current state)`,
        code: `// ── Time-based retention ─────────────────────────────────
log.retention.hours=168          # 7 days (default)
log.retention.minutes=1440       # 1 day (more granular)
log.retention.ms=86400000        # 1 day in milliseconds (most granular)

// ── Size-based retention ──────────────────────────────────
log.retention.bytes=10737418240  # 10GB per partition
# -1 = unlimited size (rely on time-based only)

// ── Per-topic retention override ─────────────────────────
kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic audit-events \
  --config retention.ms=2592000000   # 30 days for audit logs

kafka-topics.sh --bootstrap-server localhost:9092 \
  --alter --topic user-profiles \
  --config cleanup.policy=compact    # compact: keep latest profile per user-id

// ── Log compaction visual ─────────────────────────────────
//
//  Before compaction (key → value history):
//  [user-1:v1] [user-2:v1] [user-1:v2] [user-3:v1] [user-2:v2] [user-1:v3]
//
//  After compaction:
//  [user-1:v3] [user-2:v2] [user-3:v1]
//  ← only the LATEST value per key is retained ─────────────
//
//  Tombstone: produce a record with key=X, value=null
//  → tells Kafka to delete all records for key X after compaction

// ── Compact topic configuration ───────────────────────────
cleanup.policy=compact
min.cleanable.dirty.ratio=0.5    # compact when 50% of log is "dirty" (has duplicates)
min.compaction.lag.ms=0          # how long a record must remain uncompacted
delete.retention.ms=86400000     # how long tombstones (null values) are kept`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Delivery Guarantees",
    icon: "✓",
    color: "#8B5CF6",
    desc: "End-to-end exactly-once, at-least-once, and at-most-once — when each applies and how to achieve them.",
    topics: [
      {
        n: "At-most-once, at-least-once, exactly-once — full picture",
        tag: "GUARANTEE",
        desc: `Delivery guarantees span both the producer → Kafka leg AND the Kafka → consumer leg. You must achieve your desired guarantee on BOTH sides.

AT-MOST-ONCE:
- Producer: acks=0, retries=0 (may lose data)
- Consumer: commit offsets BEFORE processing (may skip records on crash)
- Use case: metrics where occasional loss is acceptable; high-frequency telemetry

AT-LEAST-ONCE:
- Producer: acks=all, retries=MAX, enable.idempotence=false (may duplicate)
- Consumer: commit offsets AFTER processing (may reprocess on crash)
- Use case: any system that can tolerate or deduplicate duplicates (most common choice)
- Consumer must be idempotent: processing the same record twice has the same effect as once

EXACTLY-ONCE (Kafka-to-Kafka):
- Producer: enable.idempotence=true + transactional.id
- Consumer: isolation.level=read_committed
- Use case: Kafka Streams pipelines, any consume-process-produce pipeline entirely in Kafka

EXACTLY-ONCE (Kafka-to-External):
- No built-in EOS for external systems (databases, APIs)
- Achieve with: idempotent consumer logic + deduplication on consumer side
- Pattern: store offset in same DB transaction as processed result
  → if transaction commits, offset is saved → no reprocessing
  → if transaction rolls back, offset not saved → reprocess (idempotent → no duplicate)`,
        code: `// ── Producer side of each guarantee ──────────────────────

// AT-MOST-ONCE (fastest, weakest)
props.put("acks", "0");           // no confirmation
props.put("retries", 0);          // no retry

// AT-LEAST-ONCE (balanced, most common)
props.put("acks", "all");
props.put("retries", Integer.MAX_VALUE);
props.put("enable.idempotence", false); // without idempotence, may duplicate

// EXACTLY-ONCE (Kafka-to-Kafka only)
props.put("enable.idempotence", true);
props.put("transactional.id", "unique-app-instance-id");

// ── Consumer side of each guarantee ──────────────────────

// AT-MOST-ONCE: commit BEFORE processing
ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
consumer.commitSync();    // ← commit offset FIRST
for (ConsumerRecord<String, String> r : records) {
    process(r);           // if crash here, records skipped on restart
}

// AT-LEAST-ONCE: commit AFTER processing
for (ConsumerRecord<String, String> r : records) {
    process(r);           // process FIRST
}
consumer.commitSync();    // ← commit AFTER — reprocess on crash (ensure idempotent!)

// EXACTLY-ONCE: transactional consumer + read_committed
props.put("isolation.level", "read_committed"); // skip uncommitted (aborted txn) records

// ── Idempotent consumer pattern (for external systems) ────
// Store offset in same database transaction as business data:
@Transactional
public void processRecord(ConsumerRecord<String, String> record) {
    // Check if already processed (using offset as deduplication key)
    if (offsetRepo.existsByTopicPartitionOffset(
            record.topic(), record.partition(), record.offset())) {
        log.info("Duplicate detected, skipping offset {}", record.offset());
        return;
    }
    // Process business logic
    orderService.save(buildOrder(record.value()));
    // Save offset in same transaction
    offsetRepo.save(new ProcessedOffset(record.topic(), record.partition(), record.offset()));
}
// commit offset to Kafka AFTER @Transactional succeeds`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Kafka Streams",
    icon: "≋",
    color: "#06B6D4",
    desc: "Library for building stateful stream processing applications entirely in Java — no separate cluster needed.",
    topics: [
      {
        n: "Kafka Streams concepts — topology, KStream, KTable, KGroupedStream",
        tag: "STREAMS",
        desc: `Kafka Streams is a Java library (not a separate cluster) that lets you build stream processing applications that read from Kafka, transform data, and write back to Kafka.

TOPOLOGY: A directed acyclic graph (DAG) of processing nodes. Source nodes read from Kafka topics. Processor nodes transform/filter/aggregate. Sink nodes write to Kafka topics. The topology is submitted once and runs continuously.

KSTREAM: An unbounded stream of records. Each record is an independent event. Think of it as a stream of INSERT-only records. Map, filter, join, aggregate operations.

KTABLE: A changelog stream where each record is an UPDATE to a key's value. Only the latest value per key matters (like a database table). Backed by a local RocksDB state store.

KGROUPEDSTREAM / KGROUPEDTABLE: Intermediate representations after groupByKey() or groupBy() — precursor to aggregation operations.

GLOBALKTABLE: Like KTable but replicated to ALL application instances (not partitioned). Useful for lookup tables (e.g., user profiles) that every partition's processing needs access to.

WINDOWING: Aggregate events within time windows — tumbling (non-overlapping), hopping (overlapping), sliding (event-time), session (activity gaps).`,
        code: `// ── Simple Kafka Streams application ─────────────────────
StreamsBuilder builder = new StreamsBuilder();

// SOURCE: read from "orders" topic
KStream<String, String> ordersStream = builder.stream("orders");

// FILTER: only process high-value orders
KStream<String, String> highValueOrders = ordersStream
    .filter((key, value) -> {
        Order order = parseOrder(value);
        return order.getTotal() > 1000.0;
    });

// MAP: transform value
KStream<String, String> enriched = highValueOrders
    .mapValues(value -> enrich(value));

// SINK: write to "high-value-orders" topic
enriched.to("high-value-orders");

// ── KTable — stateful aggregation ────────────────────────
KStream<String, Order> orders = builder.stream("orders",
    Consumed.with(Serdes.String(), orderSerde));

// Count orders per customer
KTable<String, Long> orderCountPerCustomer = orders
    .groupByKey()                      // group by the record's key (customerId)
    .count(Materialized.as("order-count-store"));  // store count in RocksDB

// Convert back to stream and write to topic
orderCountPerCustomer
    .toStream()
    .to("order-counts-per-customer");

// ── Windowed aggregation — sum revenue per hour ──────────
KStream<String, Double> revenue = builder.stream("payments",
    Consumed.with(Serdes.String(), Serdes.Double()));

KTable<Windowed<String>, Double> hourlyRevenue = revenue
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
    .reduce(Double::sum);

// ── Stream-Table join (enrich events with lookup data) ────
KStream<String, Order> orderStream = builder.stream("orders");
KTable<String, Customer> customerTable = builder.table("customers");

KStream<String, EnrichedOrder> enrichedOrders = orderStream.join(
    customerTable,
    (order, customer) -> new EnrichedOrder(order, customer)
    // join by key: order.key must be customerId
);

// ── Topology description (for debugging) ─────────────────
Topology topology = builder.build();
System.out.println(topology.describe());
// Prints the full DAG of source → processor → sink nodes`
      },
      {
        n: "State stores, windowing & fault tolerance in Kafka Streams",
        tag: "STREAMS",
        desc: `Kafka Streams is stateful — it maintains local state for aggregations, joins, and other operations. Understanding how state is managed is key to building reliable stream processors.

STATE STORES: Backed by RocksDB (embedded key-value store on local disk). Each Kafka Streams instance maintains its own state store for the partitions it owns. RocksDB allows state larger than available RAM.

CHANGELOGS: Every state store is backed by an internal changelog Kafka topic (e.g., app-name-order-count-store-changelog). Every state update is written to the changelog. If the instance crashes, it rebuilds state by replaying the changelog.

STANDBY REPLICAS: Configure num.standby.replicas to maintain warm copies of state stores on other instances. On failure, a standby can take over without full replay.

INTERACTIVE QUERIES: Query state stores directly from the application (or via REST) without routing through Kafka. Useful for building real-time dashboards on aggregated data.

WINDOWING TYPES:
- Tumbling: fixed-size, non-overlapping (hourly, daily)
- Hopping: fixed-size, overlapping (last 1 hour, computed every 15 min)
- Sliding: windows defined by time difference between events
- Session: windows close after a gap of inactivity`,
        code: `// ── Streams application config ────────────────────────────
Properties streamsProps = new Properties();
streamsProps.put(StreamsConfig.APPLICATION_ID_CONFIG,    "order-processor"); // consumer group ID
streamsProps.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
streamsProps.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
streamsProps.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
streamsProps.put(StreamsConfig.STATE_DIR_CONFIG, "/var/kafka-streams"); // RocksDB location
streamsProps.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1); // 1 warm standby replica

KafkaStreams streams = new KafkaStreams(builder.build(), streamsProps);

// ── Windowing types ───────────────────────────────────────
// Tumbling window — 1 hour, non-overlapping
TimeWindows tumblingWindow = TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1));

// Hopping window — 1 hour wide, advances every 15 min (events counted in 4 windows)
TimeWindows hoppingWindow = TimeWindows
    .ofSizeAndGrace(Duration.ofHours(1), Duration.ofMinutes(5))
    .advanceBy(Duration.ofMinutes(15));

// Session window — gap of 30 min inactivity closes the session
SessionWindows sessionWindow = SessionWindows
    .ofInactivityGapAndGrace(Duration.ofMinutes(30), Duration.ofMinutes(5));

// ── Interactive queries — read state from outside ─────────
// Query a specific key from a state store
ReadOnlyKeyValueStore<String, Long> store = streams.store(
    StoreQueryParameters.fromNameAndType("order-count-store", QueryableStoreTypes.keyValueStore())
);

Long orderCount = store.get("customer-123");

// Iterate all entries in a store
try (KeyValueIterator<String, Long> iter = store.all()) {
    while (iter.hasNext()) {
        KeyValue<String, Long> entry = iter.next();
        System.out.println(entry.key + " → " + entry.value);
    }
}

// ── Graceful shutdown ─────────────────────────────────────
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    streams.close(Duration.ofSeconds(30)); // wait up to 30s for clean shutdown
}));

streams.start();`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Schema Registry",
    icon: "⊟",
    color: "#EC4899",
    desc: "Confluent Schema Registry — managing Avro/JSON/Protobuf schemas with compatibility enforcement.",
    topics: [
      {
        n: "Why Schema Registry & schema evolution",
        tag: "SCHEMA",
        desc: `Without a schema registry, Kafka messages are opaque bytes. Producers and consumers need to agree on the format out of band. If a producer changes the message structure, consumers break silently.

SCHEMA REGISTRY solves this by:
1. Storing schemas centrally (keyed by subject = topic name + "-key" or "-value").
2. Assigning each schema a unique integer ID.
3. Producers embed just the schema ID (4 bytes) in each message header.
4. Consumers look up the schema by ID to deserialize — they can get the schema even if they didn't exist when the producer wrote the message.
5. Enforcing COMPATIBILITY rules to prevent breaking changes.

COMPATIBILITY MODES:
- BACKWARD (default): New schema can read old data. Consumers can upgrade first. Add fields with defaults, delete optional fields.
- FORWARD: Old schema can read new data. Producers can upgrade first. Delete fields with defaults, add optional fields.
- FULL: Both backward and forward compatible.
- NONE: No compatibility checking.

WIRE FORMAT (Confluent): [magic byte 0x00][schema ID (4 bytes)][Avro/JSON/Protobuf bytes]`,
        code: `// ── Avro schema example (user-profile-value.avsc) ────────
{
  "type": "record",
  "name": "UserProfile",
  "namespace": "com.myapp.avro",
  "fields": [
    {"name": "userId",    "type": "string"},
    {"name": "email",     "type": "string"},
    {"name": "createdAt", "type": "long",   "logicalType": "timestamp-millis"},
    {"name": "premium",   "type": "boolean","default": false}
  ]
}

// ── Register schema (via REST API) ────────────────────────
curl -X POST http://schema-registry:8081/subjects/user-profiles-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "{\"type\":\"record\",\"name\":\"UserProfile\",...}"}'
// Response: {"id": 1}

// ── Producer with Avro serializer ────────────────────────
props.put("key.serializer",   "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
props.put("schema.registry.url", "http://schema-registry:8081");

KafkaProducer<String, GenericRecord> producer = new KafkaProducer<>(props);

Schema schema = new Schema.Parser().parse(new File("user-profile.avsc"));
GenericRecord user = new GenericData.Record(schema);
user.put("userId", "user-123");
user.put("email", "alice@example.com");
user.put("createdAt", System.currentTimeMillis());
user.put("premium", true);

producer.send(new ProducerRecord<>("user-profiles", "user-123", user));

// ── Consumer with Avro deserializer ───────────────────────
props.put("value.deserializer", "io.confluent.kafka.serializers.KafkaAvroDeserializer");
props.put("schema.registry.url", "http://schema-registry:8081");
props.put("specific.avro.reader", true); // use generated class (vs GenericRecord)

// ── Schema evolution: BACKWARD compatible change ──────────
// Adding a NEW field with a default is backward compatible:
{
  "fields": [
    {"name": "userId",     "type": "string"},
    {"name": "email",      "type": "string"},
    {"name": "createdAt",  "type": "long"},
    {"name": "premium",    "type": "boolean", "default": false},
    {"name": "tier",       "type": "string",  "default": "BASIC"}  // ← NEW, has default
  ]
}
// Old consumers reading new messages: "tier" field filled with default "BASIC" ✓

// ── Schema compatibility check ────────────────────────────
curl http://schema-registry:8081/compatibility/subjects/user-profiles-value/versions/latest \
  -X POST \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "...new schema..."}'
// Response: {"is_compatible": true}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Kafka Connect",
    icon: "⇄",
    color: "#10B981",
    desc: "Scalable, fault-tolerant data integration framework — connectors for databases, files, cloud services.",
    topics: [
      {
        n: "Kafka Connect architecture — source & sink connectors",
        tag: "CONNECT",
        desc: `Kafka Connect is a framework for reliably streaming data between Kafka and external systems (databases, files, Elasticsearch, S3, etc.) without writing custom code.

SOURCE CONNECTOR: Reads from an external system and writes to a Kafka topic. Example: Debezium reads MySQL binlog → publishes change events to Kafka.

SINK CONNECTOR: Reads from a Kafka topic and writes to an external system. Example: JDBC Sink Connector reads from Kafka → inserts into PostgreSQL.

WORKERS: Connect runs as one or more Worker processes. Workers are where connectors and tasks actually run. Workers handle fault tolerance, offset storage, and configuration.

TASKS: Each connector spawns one or more tasks (the unit of parallelism). A source connector with 3 tables might run 3 tasks in parallel — one per table.

DISTRIBUTED MODE (production): Multiple worker processes form a Connect cluster. They share work automatically. If a worker fails, tasks are redistributed.

STANDALONE MODE (development): Single worker process. Offsets stored in a local file. Not fault-tolerant.

OFFSET STORAGE: Source connectors store their position (e.g., binlog position, file offset) in a Kafka topic (connect-offsets). This enables fault-tolerant, resumable reads.`,
        code: `// ── Debezium MySQL Source Connector config ────────────────
{
  "name": "mysql-source-connector",
  "config": {
    "connector.class":      "io.debezium.connector.mysql.MySqlConnector",
    "tasks.max":            "1",
    "database.hostname":    "mysql-host",
    "database.port":        "3306",
    "database.user":        "debezium",
    "database.password":    "secret",
    "database.server.id":   "184054",
    "database.server.name": "mydb",        // prefix for topic names
    "database.include.list":"orders_db",   // which databases
    "table.include.list":   "orders_db.orders,orders_db.customers",
    "database.history.kafka.bootstrap.servers": "broker:9092",
    "database.history.kafka.topic": "schema-changes.mydb",
    // Produces topics: mydb.orders_db.orders, mydb.orders_db.customers
    "transforms":           "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState"
  }
}

// ── JDBC Sink Connector config ────────────────────────────
{
  "name": "postgres-sink-connector",
  "config": {
    "connector.class":     "io.confluent.connect.jdbc.JdbcSinkConnector",
    "tasks.max":           "3",
    "connection.url":      "jdbc:postgresql://pg-host:5432/analytics",
    "connection.user":     "kafkawriter",
    "connection.password": "secret",
    "topics":              "processed-orders",
    "auto.create":         "true",   // create table if not exists
    "auto.evolve":         "true",   // add columns if schema changes
    "insert.mode":         "upsert", // upsert, insert, or update
    "pk.mode":             "record_key",
    "pk.fields":           "order_id"
  }
}

// ── Deploy connector via REST API ─────────────────────────
curl -X POST http://connect-host:8083/connectors \
  -H "Content-Type: application/json" \
  -d @mysql-source-connector.json

# Check status
curl http://connect-host:8083/connectors/mysql-source-connector/status

# List all connectors
curl http://connect-host:8083/connectors

# Pause / resume
curl -X PUT http://connect-host:8083/connectors/mysql-source-connector/pause
curl -X PUT http://connect-host:8083/connectors/mysql-source-connector/resume

// ── Internal Connect topics ───────────────────────────────
connect-configs    # connector and task configurations
connect-offsets    # source connector offsets (current position)
connect-status     # connector and task status`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Performance & Tuning",
    icon: "⚡",
    color: "#F97316",
    desc: "Key configuration knobs for throughput, latency, and reliability across producers, brokers, and consumers.",
    topics: [
      {
        n: "Producer tuning — throughput vs latency vs durability",
        tag: "TUNING",
        desc: `Producer tuning is a three-way trade-off: throughput (msgs/sec), latency (time until delivered), and durability (guarantee against data loss). You tune knobs along each axis depending on your SLA.

THROUGHPUT-OPTIMISED: Large batches, compression, async sends, low acks requirement. Best for metrics, logs, analytics pipelines.

LATENCY-OPTIMISED: Small or no batching, no compression, synchronous sends. Best for real-time event pipelines where sub-10ms matters.

DURABILITY-OPTIMISED: acks=all, retries=MAX, idempotence=true, min.insync.replicas=2. Best for financial transactions, order processing, audit events.

COMPRESSION: Always consider compression for large string/JSON payloads. Snappy compresses at ~2:1 with minimal CPU overhead. LZ4 is faster. Gzip gives better ratios but uses more CPU. Compression happens on the producer side, decompression on consumer side.`,
        code: `// ── High Throughput config ────────────────────────────────
props.put("batch.size",         131072);  // 128KB batches
props.put("linger.ms",          20);      // wait 20ms to fill batch
props.put("compression.type",   "lz4");   // fastest compression
props.put("acks",               "1");     // only leader confirms (some loss risk)
props.put("buffer.memory",      134217728); // 128MB send buffer
props.put("max.in.flight.requests.per.connection", 5); // 5 parallel sends

// ── Low Latency config ─────────────────────────────────────
props.put("batch.size",   1);        // send immediately (no batching)
props.put("linger.ms",    0);        // zero wait
props.put("compression.type", "none"); // no compression overhead
props.put("acks",         "1");      // single broker confirmation

// ── High Durability config ────────────────────────────────
props.put("acks",               "all");
props.put("retries",            Integer.MAX_VALUE);
props.put("enable.idempotence", true);
props.put("max.in.flight.requests.per.connection", 5); // 5 ok with idempotence
props.put("delivery.timeout.ms", 300000); // 5 min total delivery timeout
props.put("request.timeout.ms",  30000);  // 30s per request attempt

// Broker side
min.insync.replicas=2  # require at least 2 ISR to ack

// ── Compression benchmark (100M JSON records ~500 bytes each) ─
// No compression:  100 MB/s throughput, 5 GB storage/hour
// Snappy:          95 MB/s throughput, 2.5 GB storage/hour (2:1)
// LZ4:             98 MB/s throughput, 2.8 GB storage/hour (1.8:1)
// Gzip:            70 MB/s throughput, 1.5 GB storage/hour (3.3:1) ← best ratio
// Zstd:            85 MB/s throughput, 1.3 GB storage/hour (3.8:1) ← best ratio/speed`
      },
      {
        n: "Consumer & broker tuning — throughput, lag, partition count",
        tag: "TUNING",
        desc: `Consumer tuning focuses on maximising throughput and minimising lag while keeping memory and CPU usage reasonable. Broker tuning focuses on disk I/O, network, and replication performance.

CONSUMER THROUGHPUT: Increase max.poll.records, use multi-threaded processing within a consumer (separate thread pool from poll loop), and process records in bulk (batch DB inserts rather than one-by-one).

PARTITION COUNT: The main lever for parallelism. More partitions = more consumers = more throughput. But too many partitions has costs: more open file handles, longer leader election, more memory in brokers.

BROKER DISK: Use SSDs for best performance. Separate OS disk from data disk. Use JBOD (multiple disks) — Kafka can stripe partitions across disks (log.dirs with multiple paths).

NETWORK: Each broker handles multiple replication connections. num.replica.fetchers controls how many threads pull data from the leader. Increase for faster replication.`,
        code: `// ── Consumer performance config ──────────────────────────
props.put("max.poll.records",         1000);  // process 1000 records per poll
props.put("fetch.min.bytes",          65536); // wait for 64KB before returning
props.put("fetch.max.wait.ms",        500);   // or wait up to 500ms
props.put("max.partition.fetch.bytes",1048576); // 1MB per partition per fetch

// ── Multi-threaded consumer pattern ──────────────────────
// Single poll thread + worker thread pool (doesn't move offset automatically)
ExecutorService executor = Executors.newFixedThreadPool(10);

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    List<Future<?>> futures = new ArrayList<>();

    for (ConsumerRecord<String, String> record : records) {
        futures.add(executor.submit(() -> processRecord(record)));
    }

    // Wait for all workers to finish before committing
    for (Future<?> f : futures) f.get();
    consumer.commitSync();
    // NOTE: manual offset management needed for true parallel processing
    // Consider using one consumer per thread with manual partition assignment
}

// ── Broker: number of partitions rule of thumb ───────────
// Target throughput per topic: T MB/s
// Producer throughput per partition: p MB/s (≈ 50 MB/s for fast producers)
// Consumer throughput per partition: c MB/s (≈ 50 MB/s for fast consumers)
// Partitions = max(T/p, T/c)
//
// Also: partitions >= max consumers in any consumer group
// Also: partitions are forever (can increase, never decrease)
// Recommendation: start with 3x expected consumers, allow headroom to scale

// ── Broker performance config ─────────────────────────────
num.io.threads=8                     # threads for disk I/O (= num disks)
num.network.threads=3                # threads for network requests
num.replica.fetchers=4               # threads pulling from leader for replication
log.dirs=/disk1/kafka,/disk2/kafka   # multiple disks = higher I/O
socket.send.buffer.bytes=1048576     # OS send buffer
socket.receive.buffer.bytes=1048576  # OS receive buffer
socket.request.max.bytes=104857600   # max request size`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Security",
    icon: "🔐",
    color: "#EF4444",
    desc: "Authentication (SASL), encryption (TLS), authorisation (ACLs) — securing Kafka in production.",
    topics: [
      {
        n: "TLS encryption, SASL authentication & ACL authorisation",
        tag: "SECURITY",
        desc: `A production Kafka cluster needs three layers of security:

1. ENCRYPTION IN TRANSIT (TLS/SSL): Prevents eavesdropping on data between clients and brokers, and between brokers (for replication). Configure listeners with SSL and provide keystore/truststore.

2. AUTHENTICATION (SASL): Verifies the identity of clients and brokers. Options:
   - SASL/PLAIN: Username/password (use only over TLS). Simple but credentials sent in plaintext.
   - SASL/SCRAM-SHA-256/512: Salted Challenge Response — more secure than PLAIN, credentials not sent in cleartext.
   - SASL/GSSAPI (Kerberos): Enterprise standard, integrates with existing Kerberos/Active Directory.
   - SASL/OAUTHBEARER: OAuth2 tokens — ideal for cloud-native/microservice environments.

3. AUTHORISATION (ACLs): Controls which authenticated principals can perform which operations on which resources (topics, consumer groups, cluster).
   ACL structure: Principal X can [READ/WRITE/CREATE/DELETE/DESCRIBE/ALTER] on [Topic/Group/Cluster] Y from host Z.`,
        code: `# ── Broker: enable SSL + SASL ────────────────────────────
# server.properties
listeners=SASL_SSL://0.0.0.0:9093
advertised.listeners=SASL_SSL://broker1.company.com:9093
security.inter.broker.protocol=SASL_SSL
sasl.mechanism.inter.broker.protocol=SCRAM-SHA-256
sasl.enabled.mechanisms=SCRAM-SHA-256

ssl.keystore.location=/etc/kafka/ssl/kafka.server.keystore.jks
ssl.keystore.password=keystorePassword
ssl.key.password=keyPassword
ssl.truststore.location=/etc/kafka/ssl/kafka.server.truststore.jks
ssl.truststore.password=truststorePassword
ssl.client.auth=required  # require client certificates too

# ── Create SCRAM credentials ──────────────────────────────
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config 'SCRAM-SHA-256=[iterations=8192,password=producer-secret]' \
  --entity-type users --entity-name order-producer

kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config 'SCRAM-SHA-256=[iterations=8192,password=consumer-secret]' \
  --entity-type users --entity-name order-consumer

// ── Client SASL/SCRAM config ──────────────────────────────
props.put("security.protocol",       "SASL_SSL");
props.put("sasl.mechanism",          "SCRAM-SHA-256");
props.put("sasl.jaas.config",
    "org.apache.kafka.common.security.scram.ScramLoginModule required " +
    "username=\"order-producer\" password=\"producer-secret\";");
props.put("ssl.truststore.location", "/etc/kafka/ssl/client.truststore.jks");
props.put("ssl.truststore.password", "truststorePassword");

// ── ACLs — grant order-producer write access ─────────────
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:order-producer \
  --operation Write \
  --operation Describe \
  --topic orders

# Grant order-consumer read access + consumer group access
kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:order-consumer \
  --operation Read \
  --operation Describe \
  --topic orders

kafka-acls.sh --bootstrap-server localhost:9092 \
  --add \
  --allow-principal User:order-consumer \
  --operation Read \
  --group order-processor-group

# List ACLs
kafka-acls.sh --bootstrap-server localhost:9092 --list --topic orders`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Failure & Retry Mechanisms",
    icon: "↺",
    color: "#F43F5E",
    desc: "Producer retries, consumer error handling, dead-letter topics, retry topics, and circuit breakers.",
    topics: [
      {
        n: "Producer failure & retry — what can go wrong and how Kafka handles it",
        tag: "FAILURE",
        desc: `Producer failures fall into two categories: retriable and non-retriable.

RETRIABLE ERRORS: Transient conditions that may resolve on their own. Kafka's producer will automatically retry these if retries > 0.
- LeaderNotAvailableException — partition leader is being elected (milliseconds)
- NotLeaderForPartitionException — producer's cached metadata is stale
- RequestTimeoutException — broker too slow to respond within request.timeout.ms
- NetworkException — connection dropped mid-flight
- NotEnoughReplicasException — ISR size dropped below min.insync.replicas temporarily

NON-RETRIABLE ERRORS: Logic or configuration problems that retrying won't fix.
- MessageTooLargeException — record exceeds max.message.bytes
- RecordTooLargeException — exceeds max.request.size on producer
- SerializationException — serializer threw an exception
- InvalidTopicException — topic name is invalid
- UnknownTopicOrPartitionException — topic doesn't exist (and auto-create is off)

RETRY STORM RISK: Retrying too aggressively under load amplifies the problem. Use exponential backoff (retry.backoff.ms, retry.backoff.max.ms in Kafka 3.x). With enable.idempotence=true, retries are safe — broker deduplicates them via sequence numbers.

IN-FLIGHT REQUESTS: max.in.flight.requests.per.connection=1 guarantees ordering on retry — but kills throughput. With enable.idempotence=true, you can use up to 5 in-flight requests safely, and Kafka guarantees ordering even under retries.`,
        code: `// ── Producer retry configuration ─────────────────────────
props.put("retries",                       Integer.MAX_VALUE); // retry indefinitely
props.put("retry.backoff.ms",              100);    // initial wait between retries: 100ms
props.put("retry.backoff.max.ms",          1000);   // max wait (exponential backoff cap)
props.put("request.timeout.ms",            30000);  // 30s per individual request
props.put("delivery.timeout.ms",           120000); // 2 min total time to deliver a record
                                                     // = linger.ms + batch time + retries
                                                     // If exceeded → fail with TimeoutException

props.put("max.in.flight.requests.per.connection", 5); // safe with idempotence
props.put("enable.idempotence", true); // sequence numbers prevent duplicate on retry

// ── Handling non-retriable errors in callback ─────────────
producer.send(record, (metadata, exception) -> {
    if (exception == null) {
        log.info("Sent to {}-{} @ offset {}", metadata.topic(), metadata.partition(), metadata.offset());
        return;
    }

    if (exception instanceof RetriableException) {
        // Kafka already retried based on config — this callback fires after all retries exhausted
        log.error("Retriable error after all retries: {}", exception.getMessage());
        deadLetterQueue.send(record, exception); // save to DLQ for manual investigation
    } else {
        // Non-retriable: no point retrying
        log.error("Non-retriable error, dropping record: {}", exception.getMessage());
        alertOpsTeam(record, exception);
    }
});

// ── Retry with exponential backoff (application-level) ────
// For cases where you need custom retry logic beyond Kafka's built-in
public void sendWithBackoff(ProducerRecord<String, String> record, int maxAttempts) {
    int attempt = 0;
    long backoffMs = 100;
    while (attempt < maxAttempts) {
        try {
            producer.send(record).get(30, TimeUnit.SECONDS);
            return; // success
        } catch (ExecutionException e) {
            if (e.getCause() instanceof RetriableException && attempt < maxAttempts - 1) {
                log.warn("Attempt {} failed, retrying in {}ms", attempt + 1, backoffMs);
                Thread.sleep(backoffMs);
                backoffMs = Math.min(backoffMs * 2, 30_000); // cap at 30s
                attempt++;
            } else {
                throw new RuntimeException("Send failed after " + attempt + " attempts", e);
            }
        }
    }
}`
      },
      {
        n: "Consumer failure — exception handling, retry topics & dead-letter topics",
        tag: "FAILURE",
        desc: `Consumer failures are more complex than producer failures because the consumer has already received the record — the question is what to do when processing fails.

NAIVE APPROACH — skip on exception: Catch the exception, log it, and move on. Simple but data is silently lost. Never acceptable for business-critical events.

BLOCKING RETRY IN THE POLL LOOP: Retry the failed record N times before committing. If all retries fail, either skip or stop the consumer. Problem: blocks processing of all subsequent records in the partition — one bad record can halt the consumer indefinitely (poison pill).

RETRY TOPICS (preferred for resilience): On failure, publish the failed record to a retry topic (e.g. orders.retry.1, orders.retry.2, orders.retry.3) with increasing delays. A separate consumer reads retry topics with a delay. After N retry topics are exhausted, publish to the dead-letter topic. This pattern is popularised by Spring Kafka's @RetryableTopic.

DEAD-LETTER TOPIC (DLT): The final destination for records that could not be processed after all retries. The DLT preserves the original record + error metadata (exception class, message, stack trace as headers). A team can manually inspect, fix the bug, and replay from the DLT.

CIRCUIT BREAKER PATTERN: If a downstream system (database, API) is down, retrying immediately floods it further. A circuit breaker opens after N consecutive failures, rejecting calls fast for a cooldown period before trying again.`,
        code: `// ── Pattern 1: Retry topics with Spring Kafka ─────────────
@Component
public class OrderConsumer {

    // Spring Kafka will auto-create:
    //   orders.retry.0  (retried after 1s)
    //   orders.retry.1  (retried after 2s)
    //   orders.retry.2  (retried after 4s)
    //   orders.DLT      (dead-letter — no more retries)
    @RetryableTopic(
        attempts        = "4",                     // 1 original + 3 retries
        backoff         = @Backoff(delay = 1000, multiplier = 2.0, maxDelay = 10_000),
        autoCreateTopics = "true",
        dltTopicSuffix  = ".DLT",
        include         = {TransientDataAccessException.class, // which exceptions to retry
                           ResourceAccessException.class},
        exclude         = {NonTransientDataAccessException.class} // don't retry these
    )
    @KafkaListener(topics = "orders", groupId = "order-processor")
    public void consume(ConsumerRecord<String, String> record) {
        orderService.process(record.value());  // throws → triggers retry
    }

    // Called ONLY when all retries are exhausted
    @DltHandler
    public void handleDlt(ConsumerRecord<String, String> record,
                          @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMsg) {
        log.error("DLT: failed record key={} error={}", record.key(), errorMsg);
        // Persist to a dead_letter_events DB table for ops team
        dltRepository.save(new DeadLetterEvent(record, errorMsg));
        alertingService.sendPagerDuty("Order processing failed after all retries", record);
    }
}

// ── Pattern 2: Manual retry topic implementation ───────────
@KafkaListener(topics = "orders", groupId = "order-processor")
public void consume(ConsumerRecord<String, String> record) {
    try {
        orderService.process(record.value());
    } catch (TransientException e) {
        // Route to retry topic with delay header
        Headers headers = new RecordHeaders();
        headers.add("retryCount",   intToBytes(getRetryCount(record) + 1));
        headers.add("originalTopic",  record.topic().getBytes());
        headers.add("failureReason",  e.getMessage().getBytes());

        int retryCount = getRetryCount(record);
        String retryTopic = retryCount < 3
            ? "orders.retry." + retryCount
            : "orders.DLT";

        retryProducer.send(new ProducerRecord<>(retryTopic, null,
            record.key(), record.value(), headers));
    } catch (PermanentException e) {
        // Non-retriable → straight to DLT
        dltProducer.send(new ProducerRecord<>("orders.DLT", record.key(), record.value()));
    }
}

// ── Pattern 3: Circuit Breaker with Resilience4j ──────────
CircuitBreaker cb = CircuitBreakerRegistry.ofDefaults()
    .circuitBreaker("order-db", CircuitBreakerConfig.custom()
        .failureRateThreshold(50)          // open at 50% failure rate
        .waitDurationInOpenState(Duration.ofSeconds(30)) // stay open 30s
        .slidingWindowSize(10)             // measure over last 10 calls
        .build());

@KafkaListener(topics = "orders", groupId = "order-processor")
public void consume(ConsumerRecord<String, String> record) {
    CheckedRunnable saveOrder = cb.decorateCheckedRunnable(
        () -> orderService.save(record.value())
    );
    Try.run(saveOrder)
       .onFailure(CallNotPermittedException.class, ex -> {
           log.warn("Circuit OPEN — routing to retry topic");
           retryProducer.send(new ProducerRecord<>("orders.retry.0", record.key(), record.value()));
       })
       .onFailure(ex -> {
           log.error("Order save failed", ex);
           dltProducer.send(new ProducerRecord<>("orders.DLT", record.key(), record.value()));
       });
}`
      },
      {
        n: "Broker failure — partition failover, unclean election, data loss scenarios",
        tag: "FAILURE",
        desc: `When a broker fails, Kafka must elect new leaders for all partitions that had their leader on the failed broker. Understanding the failure modes helps you configure the system correctly.

CLEAN FAILOVER: Broker fails gracefully (shutdown). All in-sync replicas have all messages. Controller elects a new leader from the ISR. No data loss. Client gets metadata refresh and reconnects to new leader.

UNCLEAN FAILOVER: Broker fails unexpectedly (power cut, OOM kill). If all ISR replicas also fail, the only remaining replica may be out-of-sync (a lagging follower). Two choices:
1. unclean.leader.election.enable=false (default): Wait for an ISR replica to come back. Partition is unavailable until then. Guarantees no data loss.
2. unclean.leader.election.enable=true: Elect the out-of-sync follower as leader immediately. Partition becomes available but messages not replicated to it are LOST permanently.

NETWORK PARTITION (split-brain): Broker is alive but unreachable from the controller. Controller thinks it's dead and elects a new leader. The old leader is still alive, still accepting writes from producers with stale metadata. When it rejoins, its unacknowledged writes are truncated to match the new leader's log. This is why acks=all is critical — it only returns success after ISR confirmation.

CONTROLLER FAILURE: Controller broker dies. Another broker is elected as controller via ZooKeeper watch or Raft election in KRaft mode. Usually resolves in under 30 seconds. During this window, no new leader elections can happen (but existing producers/consumers continue normally).`,
        code: `// ── Replica assignment and failure handling config ────────

# Replication factor — minimum 3 for production
default.replication.factor=3

# CRITICAL: Prevent data loss on unclean failover
unclean.leader.election.enable=false   # never elect out-of-sync replica as leader

# ISR requirements
min.insync.replicas=2   # with RF=3: tolerate 1 broker failure and still write
                        # if only 1 ISR remains → writes throw NotEnoughReplicasException

# Replica lag before being removed from ISR
replica.lag.time.max.ms=30000   # follower has 30s to catch up before removed from ISR

# ── Timeline of a broker failure (Broker 2 dies) ────────
//
// T=0s  : Broker 2 stops sending heartbeats to ZooKeeper/Controller
// T=10s : ZooKeeper session timeout fires (zookeeper.session.timeout.ms)
// T=10s : Controller detects Broker 2 dead, starts leader election
// T=11s : Controller picks Broker 3 (in ISR) as new leader for affected partitions
// T=11s : Controller writes new assignment to ZooKeeper/KRaft metadata
// T=12s : All brokers receive updated metadata
// T=12s : Producers/Consumers get 403 on next request, refresh metadata
// T=13s : Producers/Consumers redirect to Broker 3 — normal operation resumes
// Total: ~13 seconds of disruption (tunable)

// ── Producer config to survive broker failure ─────────────
props.put("acks", "all");                       // only succeed when all ISR confirm
props.put("retries", Integer.MAX_VALUE);        // retry through the failover window
props.put("retry.backoff.ms", 200);             // wait 200ms between retries
props.put("delivery.timeout.ms", 60000);        // keep trying for 60s
props.put("request.timeout.ms", 30000);         // individual request timeout
props.put("metadata.max.age.ms", 300000);       // refresh metadata every 5 min proactively
props.put("reconnect.backoff.ms", 50);          // 50ms before reconnecting to broker
props.put("reconnect.backoff.max.ms", 1000);    // max 1s reconnect backoff

// ── Consumer config to survive broker failure ────────────
props.put("session.timeout.ms",    45000);  // 45s before consumer considered dead
props.put("heartbeat.interval.ms", 3000);   // heartbeat every 3s (< session.timeout/3)
props.put("fetch.max.wait.ms",     500);    // wait 500ms for data if none available
props.put("connections.max.idle.ms", 540000); // close idle connections after 9 min

// ── Checking under-replicated partitions (key health metric) ─
kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --under-replicated-partitions
// Should return nothing in a healthy cluster
// Any output means a partition has fewer replicas in ISR than replication.factor

kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --unavailable-partitions
// Returns partitions with no leader — completely offline, needs immediate attention`
      },
      {
        n: "Poison pills, infinite retry loops & monitoring failure pipelines",
        tag: "FAILURE",
        desc: `A poison pill is a record that always causes the consumer to fail — due to a schema change, corrupted data, unexpected null, or a logic bug. Without proper handling, a poison pill causes an infinite retry loop that blocks the entire partition.

DETECTING A POISON PILL: The consumer fails on the same offset repeatedly. Lag stays stuck at the same value. The same record keeps appearing in error logs.

HANDLING STRATEGIES:
1. Skip and log: Log the bad record with full context, commit the offset, move on. Data is lost but pipeline continues. Only acceptable for non-critical data (analytics, metrics).
2. Route to DLT immediately: If processing fails and you've already retried N times, and the error is deserialization-related (always fails), skip retries and send straight to DLT.
3. Seek past the record: Manually seek the consumer past the offending offset. Use admin tools or a SeekToCurrentErrorHandler in Spring Kafka.
4. Pause and alert: Pause the consumer, alert ops, wait for a human to fix the data or the bug, then resume. Zero data loss, but the pipeline halts.

MONITORING A FAILURE PIPELINE: Track retry topic lag (should drain over time — if it doesn't, the retries are failing too), DLT record count (any records in DLT need human attention), and the exception class distribution (classifies failures by type).`,
        code: `// ── Spring Kafka: DefaultErrorHandler (replaces legacy SeekToCurrentErrorHandler) ──
@Configuration
public class KafkaErrorHandlerConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, String> template) {

        // Dead-letter publishing recoverer — sends failed record to "topic.DLT"
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
            template,
            (record, exception) -> {
                // Route deserialization errors straight to DLT (no retries)
                if (exception.getCause() instanceof DeserializationException) {
                    return new TopicPartition(record.topic() + ".DLT", record.partition());
                }
                // Other errors: retry topic based on current attempt count
                return new TopicPartition(record.topic() + ".DLT", record.partition());
            }
        );

        // Add metadata headers to DLT record
        recoverer.setHeadersFunction((consumerRecord, exception) -> {
            Headers headers = new RecordHeaders();
            headers.add("exception-class",   exception.getClass().getName().getBytes());
            headers.add("exception-message", exception.getMessage().getBytes());
            headers.add("original-topic",    consumerRecord.topic().getBytes());
            headers.add("original-partition",intToBytes(consumerRecord.partition()));
            headers.add("original-offset",   longToBytes(consumerRecord.offset()));
            headers.add("failed-at",         Instant.now().toString().getBytes());
            return headers;
        });

        // Exponential backoff: 1s → 2s → 4s → 8s → 10s (capped), then DLT
        FixedBackOff backOff = new FixedBackOff(1000L, 3L); // 3 retries, 1s apart
        ExponentialBackOffWithMaxRetries expBackOff = new ExponentialBackOffWithMaxRetries(3);
        expBackOff.setInitialInterval(1000);
        expBackOff.setMultiplier(2.0);
        expBackOff.setMaxInterval(10_000);

        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, expBackOff);

        // Never retry these — straight to DLT
        handler.addNotRetryableExceptions(
            DeserializationException.class,
            ClassCastException.class,
            ConstraintViolationException.class
        );

        // Always retry these even if not in the default list
        handler.addRetryableExceptions(
            TransientDataAccessException.class
        );

        return handler;
    }
}

// ── Monitoring metrics to track ───────────────────────────
// Consumer group lag on retry topics (should trend DOWN not UP):
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-processor-retry --describe

// Count records in DLT:
kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic orders.DLT --time -1   # -1 = latest offset = total records

// Prometheus metrics to alert on:
// kafka_consumer_group_lag{topic="orders.DLT"} > 0   → records stuck in DLT
// kafka_consumer_group_lag{topic="orders.retry.2"} > 100  → retries not draining
// rate(kafka_producer_record_error_total[5m]) > 0.01  → producer errors rising`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Patterns & Best Practices",
    icon: "★",
    color: "#F59E0B",
    desc: "Event-driven architecture patterns, common pitfalls, and production-readiness checklist.",
    topics: [
      {
        n: "Event-driven patterns — Event Sourcing, CQRS, Outbox",
        tag: "PATTERN",
        desc: `Kafka enables powerful event-driven architecture patterns. These patterns appear constantly in large-scale system design interviews and production systems.

EVENT SOURCING with Kafka: Instead of storing current state in a database, store the sequence of events that led to that state. Kafka's log IS the event store. Replay events to rebuild state or populate new read models. Kafka's retention and compaction make it ideal for this.

CQRS (Command Query Responsibility Segregation): Separate write (command) and read (query) models. Commands go to Kafka → stream processors update multiple read stores (PostgreSQL for reports, Elasticsearch for search, Redis for caching). Each read store is optimised for its query pattern.

OUTBOX PATTERN: Solves the dual-write problem — how to atomically update a database AND publish to Kafka. Solution: write to an "outbox" table in the SAME database transaction as your business data. A separate process (Debezium CDC) reads from the outbox table via the database's change log and publishes to Kafka. Guarantees exactly-once-style semantics at the database level.

SAGA PATTERN: Long-running distributed transactions across services. Each service publishes events when it completes its step. If a step fails, compensating events trigger rollbacks in completed steps.`,
        code: `// ── Outbox Pattern implementation ────────────────────────
// Step 1: Write to DB and outbox in ONE transaction
@Transactional
public Order placeOrder(CreateOrderRequest req) {
    // Business logic
    Order order = new Order(req);
    orderRepository.save(order);

    // Write to outbox table in SAME transaction
    OutboxEvent event = new OutboxEvent(
        UUID.randomUUID(),          // event_id
        "orders",                   // topic
        order.getId().toString(),   // message_key (partition key)
        serialize(new OrderPlacedEvent(order)), // payload
        "OrderPlaced",              // event_type
        LocalDateTime.now()         // created_at
    );
    outboxRepository.save(event);   // same DB transaction

    return order;  // transaction commits → both order + outbox row saved atomically
}

// Step 2: Debezium CDC reads outbox table → publishes to Kafka automatically
// Debezium connector config:
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.table.include.list": "public.outbox_events",
  "transforms": "outbox",
  "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
  "transforms.outbox.table.field.event.key": "message_key",
  "transforms.outbox.table.field.event.type": "event_type",
  "transforms.outbox.route.by.field": "topic"
}
// → OrderPlaced events appear in "orders" Kafka topic
// → Exactly-once guaranteed by DB transaction + Debezium offset tracking

// ── CQRS with Kafka read model update ─────────────────────
// Write side: REST endpoint → save order + publish event
// Read side:  Kafka consumer updates multiple read stores

@KafkaListener(topics = "orders", groupId = "read-model-updater")
public void updateReadModels(OrderPlacedEvent event) {
    // Update PostgreSQL analytics table
    analyticsRepo.save(new OrderAnalyticsRow(event));

    // Update Elasticsearch for full-text search
    elasticsearchClient.index(buildOrderDocument(event));

    // Update Redis cache for fast dashboard queries
    redisTemplate.opsForValue().set(
        "customer:" + event.getCustomerId() + ":orderCount",
        incrementAndGet(event.getCustomerId())
    );
}`
      },
      {
        n: "Common Kafka pitfalls & production checklist",
        tag: "PATTERN",
        desc: `These are the most common mistakes teams make when adopting Kafka, and the checklist to make a cluster production-ready.

PITFALL 1 — Too few partitions: You set 1 partition per topic. Can't scale consumers. Can't achieve parallelism. Start with at least 3, ideally more. Remember: you can increase but never decrease.

PITFALL 2 — Ignoring consumer lag: No monitoring = no visibility into whether consumers are keeping up. Lag is the most important Kafka operational metric. Alert when lag exceeds threshold.

PITFALL 3 — Not handling rebalances: Not committing offsets before revocation → reprocesses records from last committed offset. Always implement ConsumerRebalanceListener.

PITFALL 4 — Not setting retention appropriately: Default 7-day retention may be too short for audit logs, too long for high-volume telemetry. Set per-topic retention.

PITFALL 5 — Using String serialization for complex types: No schema enforcement. Schema drift causes silent deserialization failures. Use Avro/Protobuf with Schema Registry.

PITFALL 6 — Undersized records: Thousands of tiny messages per second cause high metadata overhead. Batch at the application level before producing.

PITFALL 7 — Synchronous sends in high-throughput paths: producer.send().get() blocks. Use async sends with callbacks.`,
        code: `// ── Production Kafka checklist ───────────────────────────

// RELIABILITY
// ✓ replication.factor >= 3 for all production topics
// ✓ min.insync.replicas = replication.factor - 1 (e.g. 2 for RF=3)
// ✓ acks = all on producers for critical data
// ✓ enable.idempotence = true to prevent producer duplicates
// ✓ unclean.leader.election.enable = false to prevent data loss
// ✓ Consumer implements ConsumerRebalanceListener and commits before revoke

// PERFORMANCE
// ✓ Partitions >= max consumers in any consumer group
// ✓ Compression enabled (snappy or lz4 for most workloads)
// ✓ linger.ms > 0 for throughput-sensitive producers
// ✓ batch.size tuned to match linger.ms and payload size
// ✓ max.poll.interval.ms > longest processing time per batch

// OBSERVABILITY
// ✓ Consumer lag monitored and alerted (alert at > 10k lag or rising trend)
// ✓ Producer error rate monitored (RecordErrorRate, RecordRetryRate)
// ✓ Broker disk usage alerted (> 70% full)
// ✓ Under-replicated partitions alert (should be 0 in steady state)
// ✓ Active controller count = 1 (0 or 2 indicates a problem)
// ✓ ISR shrink/expand rate monitored (high rate = broker instability)

// OPERATIONS
// ✓ Topic retention configured per use case
// ✓ Schema Registry deployed with compatibility rules set
// ✓ TLS + SASL configured (never run Kafka without auth in production)
// ✓ Quotas set per client to prevent one app starving others
// ✓ Rack awareness configured for multi-AZ deployments
// ✓ Cluster monitoring: Prometheus + Grafana with Kafka exporter

// KAFKA CONFIGURATION TO SET ON EVERY PRODUCTION CLUSTER
auto.create.topics.enable=false       # never allow auto-creation
delete.topic.enable=true              # allow topic deletion (controlled)
unclean.leader.election.enable=false  # no data loss from ISR-less election
log.message.format.version=latest     # use latest message format
offsets.retention.minutes=10080       # 7 days for consumer group offsets`
      },
    ]
  },
];

// ── Tag palette ──────────────────────────────────────────────────
const TAG_META = {
  CONCEPT:      { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  ARCHITECTURE: { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  PRODUCER:     { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  CONSUMER:     { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  STORAGE:      { bg: "#3A0E0E", text: "#EF4444", border: "#4A1212" },
  GUARANTEE:    { bg: "#2D1A4A", text: "#8B5CF6", border: "#3A2060" },
  STREAMS:      { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  SCHEMA:       { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  CONNECT:      { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  TUNING:       { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  SECURITY:     { bg: "#3A0E0E", text: "#EF4444", border: "#4A1212" },
  PATTERN:      { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  FAILURE:      { bg: "#3A0E1A", text: "#F43F5E", border: "#4A1222" },
};

export default function KafkaReference() {
  return (
    <RevisionNotesLayout
      pageKey="kafka"
      title="Kafka Theory & Concepts"
      subtitle="Deep-dive on Apache Kafka architecture, guarantees, streams, connect, and patterns."
      categoryIcon="📨"
      categoryColor="#EF4444"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}

export { SECTIONS };
