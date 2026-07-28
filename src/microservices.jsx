import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Microservices Fundamentals",
    icon: "◎",
    color: "#06B6D4",
    desc: "Monolith vs microservices, core characteristics, and when the trade-off is actually worth it.",
    topics: [
      {
        n: "Monolith vs Microservices & Core Characteristics",
        star: true,
        tag: "OVERVIEW",
        desc: "A monolith is one deployable unit sharing one codebase/database; microservices split an app into small, independently deployable services that each own a business capability and talk over the network. The trade is simplicity for independence — more moving parts, but teams can ship without coordinating with everyone else.",
        theory: `DEFINITION: MICROSERVICES is an architectural style where an application is composed of small, independently deployable services, each owning a specific business capability, communicating over a network (usually HTTP/REST, gRPC, or async messaging). A MONOLITH is a single deployable unit containing all business capabilities (order management, inventory, payments) sharing one codebase, one database, one deployment pipeline.

EXPLANATION:
CORE CHARACTERISTICS of microservices:
  • INDEPENDENTLY DEPLOYABLE — one service can ship without redeploying others.
  • OWNS ITS DATA — each service has its own database/schema (no shared tables — see Database-per-Service).
  • ORGANIZED AROUND BUSINESS CAPABILITY — not technical layers (not "UI service" / "DB service" but "Order Service" / "Payment Service").
  • DECENTRALIZED GOVERNANCE — teams can pick different tech stacks/languages per service if it fits (polyglot).
  • FAILURE ISOLATION — one service crashing shouldn't cascade and take down the whole system (with proper resilience patterns — see later section).
  • SMART ENDPOINTS, DUMB PIPES — business logic lives in the services, not in an intelligent central bus (contrast with old-school ESB architectures).

CONWAY'S LAW: "Organizations design systems that mirror their own communication structure." Microservices work best when service boundaries mirror team boundaries — each team owns a service end-to-end (design, build, deploy, operate).

BOUNDED CONTEXT (from Domain-Driven Design): The right way to decide service boundaries — group by business domain/capability, not by technical layer. A common beginner mistake is splitting by layer (a "Controller Service", "Service-layer Service", "Repository Service") instead of by domain (Order Service, Inventory Service, Shipping Service) — the former just recreates a distributed monolith with all the network overhead and none of the independence benefits.

EXAMPLE: See the code panel — a monolith with controllers/services/repositories all in one process vs. order-service/payment-service/inventory-service each owning their own table and API; and the coordination difference when placing an order (one local DB transaction vs. multiple network calls needing a Saga).

WHY (use microservices): As a monolith grows, builds slow down, one team's bug can take down the whole app, scaling means scaling EVERYTHING (even parts that don't need it), and the codebase becomes tightly coupled ("big ball of mud"). Microservices let independent teams ship independently and scale only what needs scaling.

WHAT (they solve): Microservices solve ORGANIZATIONAL scaling as much as technical scaling — independent teams shipping independently without waiting on a shared release train, and the ability to scale/choose tech per capability.

WHY NOT (trade-offs): You trade in-process function calls for network calls (latency, partial failure, serialization overhead). You trade ACID transactions across the whole app for distributed transactions/eventual consistency (see Saga pattern). You add operational complexity: many deployables, need for service discovery, distributed tracing, centralized logging, container orchestration. RULE OF THUMB interviewers want to hear: if you don't have the team-size or operational maturity to handle the complexity, a well-structured "modular monolith" is often the better starting point.`,
        code: `// ── Monolith: everything in one process, one DB ──────────
// order-app/
//   src/
//     controllers/  OrderController, PaymentController, InventoryController
//     services/     OrderService, PaymentService, InventoryService
//     repositories/  (all talk to ONE shared database)
//   → single deploy, single scale unit, single point of failure

// ── Microservices: split by business capability ──────────
// order-service/     → owns Order table, exposes /orders API
// payment-service/   → owns Payment table, exposes /payments API
// inventory-service/ → owns Inventory table, exposes /inventory API
// Each is independently built, tested, deployed, and scaled.

// ── Bad split (by technical layer, NOT by domain) ─────────
// ❌ controller-service, business-logic-service, data-access-service
//    — every request still fans out across all three, network overhead
//      with zero independence gained; just a distributed monolith.

// ── Good split (by bounded context / business capability) ─
// ✓ order-service, catalog-service, shipping-service, payment-service
//    — each owns its data and can deploy on its own schedule.

// ── Example: placing an order — the coordination problem ──
// In a monolith:
function placeOrderMonolith(orderRequest) {
  const inventoryOk = InventoryService.reserve(orderRequest.items); // same process, same transaction
  const payment = PaymentService.charge(orderRequest.card, orderRequest.total);
  const order = OrderRepository.save(orderRequest); // all-or-nothing via a local DB transaction
  return order;
}

// In microservices: no single ACID transaction spans services —
// this exact coordination problem is what the Saga pattern (later section) solves.
async function placeOrderMicroservices(orderRequest) {
  const inventoryOk = await fetch('http://inventory-service/reserve', { /* ... */ });
  const payment = await fetch('http://payment-service/charge', { /* ... */ });
  const order = await fetch('http://order-service/orders', { /* ... */ });
  // What happens if payment succeeds but order-service is down? → needs a Saga / compensating action.
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "API Gateway",
    icon: "⛩",
    color: "#F59E0B",
    desc: "Single entry point pattern — routing, cross-cutting concerns, and the Backend-for-Frontend variant.",
    topics: [
      {
        n: "API Gateway Pattern & Backend-for-Frontend",
        star: true,
        tag: "GATEWAY",
        desc: "An API Gateway is a single front-door for all client traffic that routes to the right backend service and handles cross-cutting concerns (auth, rate limiting, caching) in one place instead of every client re-implementing them.",
        theory: `DEFINITION: An API GATEWAY is a single entry point that sits in front of all client requests and routes them to the appropriate backend service.

EXPLANATION: Without a gateway, clients (web, mobile) would need to know the network location of every microservice, call each directly, and handle cross-cutting concerns (auth, rate limiting, logging) themselves, repeated in every client. Client-side code also becomes tightly coupled to how you've decomposed services internally — refactoring service boundaries breaks every client.

Gateway responsibilities typically include:
  • ROUTING — path/host-based routing to the correct downstream service (/orders/* → order-service).
  • AUTHENTICATION/AUTHORIZATION — validate JWT/OAuth tokens once, at the edge, instead of in every service.
  • RATE LIMITING & THROTTLING — protect backend services from being overwhelmed.
  • REQUEST/RESPONSE TRANSFORMATION — adapt protocols (REST↔gRPC), aggregate responses from multiple services into one client-facing response.
  • CACHING — cache common responses at the edge.
  • LOAD BALANCING — distribute requests across service instances (or delegate to a dedicated load balancer/service mesh).
  • CROSS-CUTTING LOGGING/METRICS — centralized point to capture request metrics before fan-out.

API COMPOSITION: The gateway (or a dedicated aggregator service) calls MULTIPLE downstream services and combines their responses into a single response the client needs — e.g., a product page needing data from catalog-service, pricing-service, and reviews-service in one call, so the mobile client doesn't make 3 round trips.

BACKEND FOR FRONTEND (BFF): Instead of ONE generic gateway serving all client types, you build a SEPARATE gateway tailored per client type (mobile-BFF, web-BFF, partner-API-BFF) — each shaped exactly around that client's needs (mobile wants smaller payloads, fewer fields; web wants richer data). Avoids a single gateway accumulating conditional logic ("if mobile do X, if web do Y") that becomes a maintenance nightmare.

EXAMPLE: See the code panel — an Express gateway that validates a JWT once at the edge, proxies /orders, /payments, /inventory to their services, composes a product page from 3 backend calls in parallel, and runs mobile/web BFF routes behind a shared load balancer.

WHY: Centralizing cross-cutting concerns at the edge avoids duplicating auth/rate-limiting/logging logic in every client and every service, and decouples clients from the internal service topology.

WHAT (it protects against): Clients needing to know every service's network location, repeated cross-cutting logic per client, and client code breaking every time service boundaries are refactored internally.

WHY NOT / CAVEATS: The gateway itself becomes a SINGLE POINT OF FAILURE if not made highly available (run multiple instances behind a load balancer, since ALL traffic flows through it). Also watch for the gateway becoming a "smart pipe" that accumulates business logic — it should stay focused on cross-cutting/routing concerns, not business rules (that belongs in the services, per "smart endpoints, dumb pipes").`,
        code: `// ── Simple gateway routing (conceptual, e.g. using Express) ─
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Cross-cutting concern: auth check runs once, at the edge
app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!isValidJWT(token)) return res.status(401).send('Unauthorized');
  next();
});

// Route by path prefix to the correct downstream service
app.use('/orders', createProxyMiddleware({ target: 'http://order-service:8081' }));
app.use('/payments', createProxyMiddleware({ target: 'http://payment-service:8082' }));
app.use('/inventory', createProxyMiddleware({ target: 'http://inventory-service:8083' }));

// ── API composition — aggregate multiple services in one call ─
app.get('/product-page/:id', async (req, res) => {
  const [catalog, pricing, reviews] = await Promise.all([
    fetch('http://catalog-service/products/' + req.params.id).then(r => r.json()),
    fetch('http://pricing-service/price/' + req.params.id).then(r => r.json()),
    fetch('http://review-service/reviews/' + req.params.id).then(r => r.json()),
  ]);
  res.json({ ...catalog, price: pricing.amount, reviews }); // one response, 3 backend calls
});

// ── BFF pattern — tailored gateway per client type ────────
// mobile-bff/  → returns lean payloads (fewer fields, compressed images)
app.get('/mobile/product/:id', async (req, res) => {
  const full = await fetchFullProduct(req.params.id);
  res.json({ id: full.id, name: full.name, price: full.price }); // trimmed for mobile
});
// web-bff/    → returns full payload (rich descriptions, related products, SEO metadata)
app.get('/web/product/:id', async (req, res) => {
  const full = await fetchFullProduct(req.params.id);
  res.json(full); // everything the web client's rich UI needs
});

// ── High availability — gateway behind its own load balancer ─
//        ┌──────────────┐
// client │ Load Balancer│
//        └──────┬───────┘
//         ┌──────┴──────┐
//    Gateway-1      Gateway-2      ← multiple gateway instances, no single point of failure
//         └──────┬──────┘
//     ┌───────────┼───────────┐
// order-svc   payment-svc  inventory-svc`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Service Discovery",
    icon: "◐",
    color: "#0EA5E9",
    desc: "Service registry, client-side vs server-side discovery, and health checks in a dynamic, ephemeral environment.",
    topics: [
      {
        n: "Service Registry, Discovery Patterns & Health Checks",
        star: true,
        tag: "DISCOVERY",
        desc: "Service discovery answers \"how does Service A find a currently-healthy instance of Service B right now?\" in an environment where instances are constantly created and destroyed with new IPs — via a service registry, either queried by the client or by a stable router in front of it.",
        theory: `DEFINITION: A SERVICE REGISTRY is a database of available service instances and their network locations, kept up to date as instances start/stop (Eureka, Consul, etcd, Kubernetes' built-in DNS-based registry, Zookeeper).

EXPLANATION:
SELF-REGISTRATION PATTERN: Each service instance registers itself with the registry on startup and de-registers on graceful shutdown (and the registry uses periodic heartbeats to evict dead instances that didn't shut down gracefully — e.g., a crash).

THIRD-PARTY REGISTRATION PATTERN: A separate "registrar" process (rather than the service itself) polls the deployment environment (e.g., a container orchestrator) and registers/deregisters instances — decouples the service code from registry mechanics. Kubernetes uses this model: kubelet + the Kubernetes API server track pod lifecycle, and kube-proxy/DNS handle discovery — services don't self-register.

CLIENT-SIDE DISCOVERY: The CLIENT (or client library) queries the registry directly, gets back a list of healthy instances, and picks one itself (often combined with client-side load balancing).

SERVER-SIDE DISCOVERY: The client makes a request to a well-known, stable endpoint (a load balancer or the platform's router), and THAT component queries the registry and forwards the request. This is how Kubernetes Services + AWS ELB work.

HEALTH CHECKS: The registry only returns instances that are actually healthy. Two flavors — LIVENESS ("is the process still running?" — failing it restarts the container) and READINESS ("is this instance ready to accept traffic right now?" — failing it just pulls the instance from the LB pool, useful during slow startup/warm-up).

EXAMPLE: See the code panel — a Spring Boot service self-registering with Eureka on startup, a client-side discovery call picking an instance manually, and Kubernetes' DNS-based server-side discovery where the client just calls a stable service name.

WHY: Hardcoding IPs/hostnames doesn't work once instances are EPHEMERAL (auto-scaling, deployments, crashes/restarts each assign new IPs) — discovery lets services find each other dynamically and only routes to healthy instances.

WHAT (the two placement options): Client-side discovery (pro: one less network hop; con: discovery logic duplicated in every client/language — classic Netflix Eureka + Ribbon) vs server-side discovery (client needs no discovery logic at all; most modern systems favor this since it keeps clients simple).

WHY NOT / CAVEATS: Client-side discovery couples every client to registry mechanics and duplicates load-balancing logic per language. A registry or router that isn't itself highly available becomes a new single point of failure, so it needs the same HA treatment as any other critical shared component.`,
        code: `// ── Self-registration (e.g., with Netflix Eureka-style client) ─
// order-service startup:
@EnableEurekaClient
@SpringBootApplication
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
        // On startup, this instance auto-registers with the Eureka registry,
        // and sends periodic heartbeats to stay listed as healthy.
    }
}

// ── Client-side discovery — client queries registry directly ─
List<ServiceInstance> instances = discoveryClient.getInstances("payment-service");
ServiceInstance chosen = loadBalancer.choose(instances); // client picks one (e.g., round-robin)
String url = chosen.getUri() + "/charge";
restTemplate.postForObject(url, request, Response.class);
// Con: every client needs this discovery + LB logic baked in (per language/library)

// ── Server-side discovery — Kubernetes Service (DNS-based) ────
// Client code just calls a STABLE name — no discovery logic needed at all:
fetch('http://payment-service.default.svc.cluster.local/charge', { method: 'POST', body });
// Kubernetes' internal DNS + kube-proxy resolve "payment-service" to a
// currently-healthy pod IP, and load-balance across all matching pods —
// the registry lookup + instance selection is invisible to the client.

// apiVersion: v1
// kind: Service
// metadata:
//   name: payment-service
// spec:
//   selector:
//     app: payment-service      # matches pod labels — auto-updates as pods scale/restart
//   ports:
//     - port: 80
//       targetPort: 8080

// ── Health check endpoints (readiness vs liveness) ────────
app.get('/health/live', (req, res) => {
  res.status(200).send('OK'); // process is up — failing this restarts the container
});
app.get('/health/ready', (req, res) => {
  const dbConnected = checkDbConnection();
  if (!dbConnected) return res.status(503).send('Not ready'); // pulled from LB pool, not restarted
  res.status(200).send('Ready');
});

// kubernetes pod spec:
// livenessProbe:
//   httpGet: { path: /health/live, port: 8080 }
//   periodSeconds: 10
// readinessProbe:
//   httpGet: { path: /health/ready, port: 8080 }
//   periodSeconds: 5`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Load Balancing",
    icon: "⚖",
    color: "#10B981",
    desc: "Algorithms, client-side vs server-side load balancing, and Layer 4 vs Layer 7.",
    topics: [
      {
        n: "Load Balancing Algorithms & Placement",
        star: true,
        tag: "LOADBALANCE",
        desc: "A load balancer spreads requests across multiple instances of a service so no single instance is overwhelmed, and automatically routes around unhealthy ones — the choice of algorithm and layer (4 vs 7) determines how smart that routing can be.",
        theory: `DEFINITION: LOAD BALANCING is the practice of distributing incoming requests across multiple instances of a service, at either the transport layer (L4) or application layer (L7).

EXPLANATION:
COMMON ALGORITHMS:
  ROUND ROBIN — requests distributed sequentially across instances in a rotating order. Simple, works well when instances/requests are roughly equal in cost.
  WEIGHTED ROUND ROBIN — same idea, but instances with more capacity get proportionally more requests.
  LEAST CONNECTIONS — routes to whichever instance currently has the fewest active connections — better when request processing times vary a lot.
  LEAST RESPONSE TIME — routes to the instance responding fastest recently.
  IP HASH / CONSISTENT HASHING — routes based on a hash of the client IP (or another key) so the SAME client consistently reaches the SAME instance — useful for sticky sessions or cache locality.
  RANDOM — simplest possible, surprisingly effective at scale with large instance pools.

LAYER 4 vs LAYER 7: LAYER 4 balances based on IP + TCP/UDP port only, without inspecting HTTP content — faster, but can't route on path/headers/cookies. LAYER 7 inspects the actual HTTP request (path, headers, cookies, method) for smarter routing — more CPU cost, more flexibility; this is what API Gateways and most service meshes operate at.

WHERE IT HAPPENS: SERVER-SIDE LB — a dedicated component (hardware LB, AWS ELB/ALB, Kubernetes Service) sits between client and instances. CLIENT-SIDE LB — the client (or a sidecar proxy) holds the instance list and picks one itself — e.g., Netflix Ribbon, or a service mesh sidecar (Envoy) that does it transparently.

EXAMPLE: See the code panel — round robin and least-connections implementations, an NGINX weighted-upstream config with a backup server, a service-mesh sidecar transparently load-balancing outgoing calls, and the externalized-session fix that removes the need for sticky sessions.

WHY: Without load balancing, one instance could be overloaded while others sit idle, and a crashed/unhealthy instance would keep receiving traffic.

WHAT (the placement trade-off): Server-side LB keeps clients simple (unaware of individual instances); client-side LB removes a network hop but duplicates discovery+LB logic per client/language.

WHY NOT / CAVEATS — STICKY SESSIONS TRADE-OFF: Pinning a client to one instance (via IP hash or a session cookie) simplifies in-memory session state, but undermines even distribution and complicates taking that instance down for a deploy. The more scalable fix is usually to externalize session state (Redis) so ANY instance can serve ANY request, removing the need for stickiness entirely.`,
        code: `// ── Round robin (conceptual implementation) ───────────────
class RoundRobinBalancer {
  constructor(instances) { this.instances = instances; this.index = 0; }
  next() {
    const instance = this.instances[this.index];
    this.index = (this.index + 1) % this.instances.length;
    return instance; // cycles: A, B, C, A, B, C...
  }
}

// ── Least connections ──────────────────────────────────────
class LeastConnectionsBalancer {
  constructor(instances) {
    this.instances = instances.map(i => ({ ...i, activeConnections: 0 }));
  }
  next() {
    const chosen = this.instances.reduce((min, cur) =>
      cur.activeConnections < min.activeConnections ? cur : min
    );
    chosen.activeConnections++;
    return chosen; // release/decrement when the request completes
  }
}

// ── NGINX config — Layer 7, weighted, with health checks ──
// upstream payment_backend {
//   server 10.0.0.1:8080 weight=3;   // gets 3x traffic vs weight=1 servers
//   server 10.0.0.2:8080 weight=1;
//   server 10.0.0.3:8080 weight=1 backup;  // only used if others are down
// }
// server {
//   location /payments/ {
//     proxy_pass http://payment_backend;
//   }
// }

// ── Client-side LB via service mesh sidecar (conceptual) ──
// Application code just calls "payment-service" normally:
fetch('http://payment-service/charge', { method: 'POST', body });
// The Envoy sidecar proxy sitting next to this container intercepts the
// call, load-balances across healthy endpoints from the mesh's service
// discovery data, applies retries/circuit-breaking — invisible to app code.

// ── Sticky sessions vs externalized session (the better fix) ─
// ❌ sticky: session stored in-memory on instance-2; client MUST return to instance-2
app.post('/login', (req, res) => {
  req.session.userId = user.id; // in-memory — tied to this specific instance
});

// ✓ externalized: any instance can serve the request — no stickiness needed
app.post('/login', async (req, res) => {
  await redisClient.set('session:' + sessionId, JSON.stringify({ userId: user.id }));
  // load balancer is now free to route this client anywhere on future requests
});`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Inter-Service Communication & Resilience",
    icon: "⇄",
    color: "#EC4899",
    desc: "Sync vs async communication, and the resilience patterns (circuit breaker, retry, bulkhead) that keep failures from cascading.",
    topics: [
      {
        n: "Sync vs Async Communication & Circuit Breaker / Retry / Bulkhead",
        star: true,
        tag: "RESILIENCE",
        desc: "Sync calls block and can cascade failures upward through a service chain; async calls decouple caller from consumer in time. Circuit breakers, retries (with backoff+jitter), bulkheads, and timeouts are the standard toolkit to stop one slow/failing service from taking down everything that calls it.",
        theory: `DEFINITION: SYNCHRONOUS COMMUNICATION (REST, gRPC) — the caller sends a request and BLOCKS waiting for a response. ASYNCHRONOUS COMMUNICATION (message queues/event streams — RabbitMQ, Kafka) — the caller publishes a message and moves on immediately; consumers process it independently, whenever ready.

EXPLANATION:
THE CASCADING FAILURE PROBLEM: Service A calls B calls C. If C becomes slow, B's requests to C pile up, exhausting B's thread pool/connections. Now B is unresponsive to ITS callers (A), and the failure cascades upward — one slow downstream service can take down the whole call chain even though C never fully "crashed."

CIRCUIT BREAKER PATTERN: Wraps a call to a remote service and tracks failures. States: CLOSED (requests flow through, failures counted), OPEN (once failures cross a threshold, fails fast without attempting the call, for a cooldown period), HALF-OPEN (after cooldown, a few trial requests decide whether to close again or reopen). Netflix Hystrix popularized this; resilience4j is the modern JVM equivalent, Polly for .NET.

RETRY PATTERN: Automatically retries a failed call — MUST use exponential backoff plus jitter to avoid a "retry storm." Should be paired with a circuit breaker and applied ONLY to idempotent operations.

BULKHEAD PATTERN: Named after ship compartments that stop one flooded section sinking the whole ship. Isolates resources (thread/connection pools) PER downstream dependency so a slow call to C only exhausts C's allocation, not D's.

TIMEOUT: Every remote call needs an explicit timeout — without one, a hung downstream call can block a caller's thread/connection indefinitely.

IDEMPOTENCY: An operation is idempotent if performing it multiple times has the same effect as performing it once — implemented with an idempotency key (client-generated unique ID) checked against a dedupe store before processing.

EXAMPLE: See the code panel — a resilience4j circuit breaker config, exponential-backoff-with-jitter retry helper, per-dependency thread-pool bulkheads, and an idempotency-key check on a payment endpoint.

WHY: Sync communication is a simple mental model, easy to reason about — but couples the caller's availability to the callee's. Async decouples services in time and reduces cascading-failure risk.

WHAT (each pattern protects against): Circuit breakers stop hammering an already-struggling dependency; retries recover from transient failures; bulkheads contain the blast radius to one dependency; timeouts stop indefinite blocking; idempotency makes retries/at-least-once delivery safe.

WHY NOT / CAVEATS: Async adds complexity — eventual consistency, harder debugging (no simple call stack across services), and the need to design for at-least-once delivery. Retrying a non-idempotent call (e.g., "charge card") without an idempotency key can double-charge a customer. Retrying against an already-OPEN circuit defeats the point of the breaker.`,
        code: `// ── Synchronous call — the caller blocks and can cascade ──
async function placeOrder(orderRequest) {
  const inventory = await fetch('http://inventory-service/reserve', { /* ... */ }); // blocks
  // if inventory-service is slow, THIS request (and this thread/connection) is stuck too
}

// ── Asynchronous — publish and move on, consumer decouples ─
async function placeOrderAsync(orderRequest) {
  await messageQueue.publish('order.created', orderRequest); // returns immediately
  return { status: 'accepted' }; // caller doesn't wait for inventory/payment to actually process
}
// Elsewhere, independently:
messageQueue.subscribe('order.created', async (event) => {
  await reserveInventory(event); // runs whenever this consumer is ready, at its own pace
});

// ── Circuit breaker (using resilience4j-style config, Java) ─
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)                    // trip if 50% of calls fail
    .waitDurationInOpenState(Duration.ofSeconds(10)) // stay OPEN (fail fast) for 10s
    .slidingWindowSize(20)                        // evaluate over the last 20 calls
    .permittedNumberOfCallsInHalfOpenState(5)     // allow 5 trial calls when HALF_OPEN
    .build();

CircuitBreaker breaker = CircuitBreaker.of("paymentService", config);
Supplier<PaymentResponse> decorated = CircuitBreaker
    .decorateSupplier(breaker, () -> paymentClient.charge(request));
// When OPEN, calling decorated.get() throws immediately without hitting the network at all.

// ── Retry with exponential backoff + jitter ───────────────
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const baseDelay = 2 ** attempt * 100;        // 100, 200, 400, 800, 1600ms
      const jitter = Math.random() * 100;          // avoid every client retrying in lockstep
      await new Promise(r => setTimeout(r, baseDelay + jitter));
    }
  }
}

// ── Bulkhead — separate thread pools per dependency ───────
ThreadPoolBulkhead inventoryBulkhead = ThreadPoolBulkhead.of("inventory-service",
    ThreadPoolBulkheadConfig.custom().maxThreadPoolSize(10).build());
ThreadPoolBulkhead pricingBulkhead = ThreadPoolBulkhead.of("pricing-service",
    ThreadPoolBulkheadConfig.custom().maxThreadPoolSize(10).build());
// A hung pricing-service call exhausts only pricingBulkhead's 10 threads —
// inventory calls keep working fine on their own separate pool.

// ── Idempotency key — safe to retry without double side-effects ─
app.post('/payments/charge', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const existing = await db.payments.findByIdempotencyKey(idempotencyKey);
  if (existing) return res.json(existing); // already processed — return the same result, no double charge
  const payment = await chargeCard(req.body);
  await db.payments.save({ ...payment, idempotencyKey });
  res.json(payment);
});`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Database per Service & Data Consistency",
    icon: "⛁",
    color: "#F97316",
    desc: "Why each service owns its own data, the shared-database anti-pattern, and how to query/join across service boundaries.",
    topics: [
      {
        n: "Database-per-Service Pattern, Anti-Patterns & Cross-Service Queries",
        star: true,
        tag: "DATA",
        desc: "Each microservice should own its own private database, with no other service touching it directly — this is what makes services truly independently deployable, at the cost of losing simple SQL joins across services and full transactional consistency.",
        theory: `DEFINITION: DATABASE-PER-SERVICE — each microservice owns its own private database (or schema), and NO OTHER SERVICE is allowed to access it directly; all access goes through that service's API.

EXPLANATION:
WHY A SHARED DATABASE IS AN ANTI-PATTERN: If multiple services read/write the same tables directly, you've recreated tight coupling at the data layer — any schema change requires coordinating across every service touching that table, one service's heavy query load can degrade performance for all the others, and you lose the ability to choose the best database TYPE per service's needs (polyglot persistence).

THE HARD PART — NO CROSS-SERVICE JOINS: Two main approaches: (1) API COMPOSITION — the caller/gateway calls each service's API and joins data in application code; simple for a small number of services, doesn't scale well for large joins. (2) CQRS WITH A MATERIALIZED VIEW — maintain a separate, denormalized read-optimized view kept up to date by subscribing to events published by the owning services, trading staleness for faster/more flexible querying.

EVENTUAL CONSISTENCY: Because there's no single database transaction spanning services, data across services is only eventually consistent — the fundamental trade-off microservices make in exchange for independent scalability/deployability (exactly what the Saga pattern, next section, addresses for multi-step transactions).

EXAMPLE: See the code panel — order-service on Postgres, catalog-service on MongoDB, recommendation-service on Neo4j (polyglot persistence); an anti-pattern where shipping-service queries order-service's table directly vs. the fix of going through its API; and a CQRS materialized view kept in sync via an order.created event.

WHY: Independent schema evolution and independent scaling/tech choice per service require that no other service depend directly on your tables — otherwise every schema change becomes a cross-team coordination problem.

WHAT (the boundary that matters): SHARED LIBRARY vs SHARED DATABASE is a common point of confusion — sharing a common library (e.g., a logging utility or DTO validation library) is fine; sharing a database/schema is the anti-pattern. The boundary that must never be crossed is the DATA, not the code.

WHY NOT / CAVEATS: You lose simple SQL JOINs across services, must accept eventual consistency instead of a single ACID transaction, and API composition doesn't scale well for complex cross-service filtering — pushing you toward CQRS/materialized views for anything beyond simple joins.`,
        code: `// ── Database per service — each owns its schema exclusively ──
// order-service     → PostgreSQL: orders, order_items tables
// customer-service   → PostgreSQL: customers table (SEPARATE database/instance)
// catalog-service   → MongoDB: products collection (different DB TYPE — polyglot persistence)
// recommendation-svc → Neo4j: graph of user-product interactions

// ── Anti-pattern: shared database across services ─────────
// ❌ order-service AND shipping-service BOTH directly query "orders" table
//    in the same shared Postgres instance:
// order-service:    SELECT * FROM orders WHERE status = 'pending';
// shipping-service:  UPDATE orders SET shipped_at = NOW() WHERE id = ?;
// → any schema change to "orders" now requires coordinating BOTH teams —
//   this recreates monolith-style coupling, just distributed across processes.

// ── Fix: shipping-service goes through order-service's API instead ─
// shipping-service:
async function markShipped(orderId) {
  await fetch('http://order-service/orders/' + orderId + '/ship', { method: 'PATCH' });
  // order-service owns its own database and enforces its own invariants
}

// ── API composition for a cross-service "join" ────────────
app.get('/customer-orders/:customerId', async (req, res) => {
  const customer = await fetch('http://customer-service/customers/' + req.params.customerId)
    .then(r => r.json());
  const orders = await fetch('http://order-service/orders?customerId=' + req.params.customerId)
    .then(r => r.json());
  res.json({ ...customer, orders }); // "joined" in application code, not SQL
});

// ── CQRS — materialized view kept in sync via events ─────
// order-service publishes an event whenever an order changes:
async function createOrder(order) {
  await db.orders.save(order);
  await eventBus.publish('order.created', order); // notify subscribers
}

// A separate "order-search-service" subscribes and maintains its own
// denormalized, pre-joined read model (e.g., in Elasticsearch):
eventBus.subscribe('order.created', async (order) => {
  const customer = await customerServiceClient.get(order.customerId);
  await searchIndex.upsert({
    orderId: order.id,
    customerName: customer.name,   // denormalized — no live join needed at query time
    customerState: customer.state,
    total: order.total,
    status: order.status,
  });
});

// Querying is now a single fast read against the pre-joined view:
app.get('/search/orders', async (req, res) => {
  const results = await searchIndex.query({ status: 'pending', customerState: 'CA' });
  res.json(results); // no live cross-service calls at query time — trades a little staleness for speed
});`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Saga Pattern — Distributed Transactions",
    icon: "⛓",
    color: "#8B5CF6",
    desc: "Choreography vs orchestration, compensating transactions, and how to keep multi-service business transactions consistent.",
    topics: [
      {
        n: "Saga Pattern — Choreography, Orchestration & Compensating Transactions",
        star: true,
        tag: "SAGA",
        desc: "A Saga replaces one distributed ACID transaction (impractical across services) with a sequence of local transactions, each undone by a compensating transaction if a later step fails — coordinated either by events (choreography) or a central orchestrator.",
        theory: `DEFINITION: A SAGA is a sequence of local transactions, each in one service, with a defined way to UNDO prior steps (via compensating transactions) if a later step fails.

EXPLANATION: A single business transaction ("place an order") spans multiple services, each with its own database — there's no distributed ACID transaction across them (2-phase commit exists but doesn't scale well). Each local transaction updates its own service's database and triggers the next step (via an event, or an orchestrator's command).

CHOREOGRAPHY-BASED SAGA: No central coordinator — each service publishes events, others subscribe and react, publishing their own follow-up events. Decentralized, no single point of failure, good for simple sagas with few steps, but hard to reason about as steps grow (flow is implicit, scattered across handlers).

ORCHESTRATION-BASED SAGA: A dedicated ORCHESTRATOR explicitly tells each participant what to do next and triggers compensating actions on failure — centralized and explicit (often a state machine — AWS Step Functions, Camunda, Temporal). Easier to understand/monitor/debug as a unit, but the orchestrator becomes a critical component to build well.

COMPENSATING TRANSACTION: Semantically reverses a previously committed local transaction — e.g., "reserve inventory" ↔ "release inventory reservation"; "charge card" ↔ "refund card." These must be designed carefully since compensations can fail too.

EXAMPLE: See the code panel — a choreography saga where order/inventory/payment services each subscribe to the prior step's event and publish their own, versus an explicit orchestrator class that calls each service in sequence and compensates inline on failure.

WHY: Multi-step business transactions that span services still need a reliable way to reach a consistent end state (all steps succeed, or all effects are undone) without a real distributed transaction.

WHAT (choosing between the two): RULE OF THUMB — choreography for a small number of steps (2-3); orchestration once the saga has several steps or the "what happens on failure" logic gets complex and you want it visible in one place.

WHY NOT / CAVEATS — ISOLATION TRADE-OFF: Unlike a real ACID transaction, a saga doesn't give full ISOLATION — other transactions can see partial, in-progress state while the saga is still running (e.g., inventory looks reserved before payment has actually succeeded). This is an accepted trade-off, sometimes mitigated with semantic locks or only exposing "confirmed" state to readers.`,
        code: `// ── Choreography-based saga — order placement flow ────────
// order-service:
async function createOrder(orderRequest) {
  const order = await db.orders.save({ ...orderRequest, status: 'PENDING' });
  await eventBus.publish('order.created', order); // fire and forget — no coordinator
  return order;
}

// inventory-service listens, reacts, publishes its own event:
eventBus.subscribe('order.created', async (order) => {
  const reserved = await reserveInventory(order.items);
  if (reserved) {
    await eventBus.publish('inventory.reserved', order);
  } else {
    await eventBus.publish('inventory.reservation_failed', order); // triggers compensation downstream
  }
});

// payment-service listens for the NEXT step in the chain:
eventBus.subscribe('inventory.reserved', async (order) => {
  const charged = await chargeCard(order.customerId, order.total);
  if (charged) {
    await eventBus.publish('payment.completed', order);
  } else {
    await eventBus.publish('payment.failed', order); // compensating trigger
  }
});

// order-service listens for failures anywhere in the chain to compensate:
eventBus.subscribe('inventory.reservation_failed', async (order) => {
  await db.orders.update(order.id, { status: 'CANCELLED' });
});
eventBus.subscribe('payment.failed', async (order) => {
  await db.orders.update(order.id, { status: 'CANCELLED' });
  await eventBus.publish('inventory.release_requested', order); // compensate the EARLIER step
});
eventBus.subscribe('inventory.release_requested', async (order) => {
  await releaseInventory(order.items); // undo the reservation from step 1
});

// ── Orchestration-based saga — explicit central coordinator ─
class OrderSagaOrchestrator {
  async execute(orderRequest) {
    const order = await orderService.create(orderRequest);
    try {
      await inventoryService.reserve(order.items);          // step 1
      try {
        await paymentService.charge(order.customerId, order.total); // step 2
      } catch (paymentError) {
        await inventoryService.release(order.items);          // compensate step 1
        await orderService.cancel(order.id);
        throw paymentError;
      }
      await shippingService.scheduleDelivery(order);         // step 3
      await orderService.confirm(order.id);
    } catch (inventoryError) {
      await orderService.cancel(order.id);
      throw inventoryError;
    }
  }
  // The entire multi-step flow — including which steps compensate which —
  // is explicit and readable in ONE place, instead of scattered event handlers.
}

// ── Compensating transactions summary table (as comments) ─
// FORWARD ACTION            COMPENSATING ACTION
// reserveInventory()         releaseInventory()
// chargeCard()               refundCard()
// scheduleDelivery()         cancelDelivery()
// sendConfirmationEmail()    (often no compensation needed — side-effect-only, non-transactional)`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Advanced Patterns & Observability",
    icon: "⚡",
    color: "#10B981",
    desc: "CQRS, Event Sourcing, Strangler Fig migration, Sidecar/Service Mesh, and the observability trio: logs, metrics, traces.",
    topics: [
      {
        n: "CQRS, Event Sourcing, Strangler Fig, Sidecar & Observability",
        star: true,
        tag: "ADVANCED",
        desc: "Four advanced tools for four different problems — CQRS separates read/write models, Event Sourcing stores state as an event log, Strangler Fig migrates a monolith incrementally, and Sidecar/Service Mesh + the observability trio (logs/metrics/traces) keep a distributed system operable.",
        theory: `DEFINITION: CQRS (Command Query Responsibility Segregation) separates the model used to WRITE data from the model used to READ it. EVENT SOURCING stores the full sequence of state-changing events as the system of record instead of just current state. STRANGLER FIG is a strategy for incrementally migrating a monolith to microservices. A SIDECAR is a helper process deployed alongside a service instance for cross-cutting infrastructure concerns; a SERVICE MESH deploys one next to every instance system-wide.

EXPLANATION:
CQRS: Not required for every service — reach for it when read and write workloads have very different scaling/shape needs (writes simple, reads need complex filtering/search).

EVENT SOURCING: Current state is derived by replaying events (OrderCreated, ItemAdded, OrderShipped...). Often paired with CQRS: events are the write model, projections are the read model.

STRANGLER FIG PATTERN: Named after the vine that grows around a host tree and gradually replaces it. Steps: put a facade/gateway in front of the monolith → route ONE capability at a time to a new microservice while the facade still routes everything else to the monolith → repeat → eventually retire that part of the monolith.

SIDECAR & SERVICE MESH: A sidecar handles network retries, mTLS, load balancing, metrics collection so the main service's code doesn't implement any of it. A service mesh (Istio, Linkerd) is a sidecar proxy (Envoy) next to every instance, forming a uniform network layer without touching application code.

OBSERVABILITY — THE THREE PILLARS: CENTRALIZED LOGGING (every service ships logs to one place with a shared correlation/trace ID per request), METRICS (aggregated time-series — "the four golden signals": latency, traffic, errors, saturation — Prometheus + Grafana), DISTRIBUTED TRACING (a trace ID + per-service spans reconstruct the whole cross-service call graph — Jaeger, Zipkin, OpenTelemetry).

EXAMPLE: See the code panel — a CQRS write/read split, an event-sourced order replayed from its event log, a facade routing /orders to a new service while everything else still hits the legacy monolith, and a trace ID propagated across a service call via headers.

WHY: Distributed systems can't rely on a debugger or one log file — CQRS and event sourcing solve data-shape/audit problems, strangler fig solves migration risk, and sidecar/mesh plus the observability trio solve the "who's actually handling my request and why is it slow" problem.

WHAT (each one solves): CQRS — read/write models with very different needs. Event sourcing — full audit trail and point-in-time reconstruction for free. Strangler fig — a releasable, rollback-able path off a monolith instead of a risky big-bang rewrite. Sidecar/mesh — uniform resilience/security/observability without duplicating it per service/language.

WHY NOT / CAVEATS: Event sourcing adds significant complexity — querying "current state" requires replaying or maintaining projections, and event schemas need careful versioning over time. CQRS and a mesh are both overhead you shouldn't add to a simple service with uniform query needs and few dependencies.`,
        code: `// ── CQRS — separate write model and read model ────────────
// Write side — enforces invariants, normalized schema:
async function placeOrder(cmd) {
  if (cmd.items.length === 0) throw new Error('Order must have items');
  await db.orders.insert({ id: cmd.orderId, items: cmd.items, status: 'PENDING' });
  await eventBus.publish('order.placed', cmd);
}
// Read side — denormalized, optimized purely for fast queries:
app.get('/orders/search', async (req, res) => {
  const results = await readDb.orderSearchView.find(req.query); // pre-joined, indexed for search
  res.json(results);
});

// ── Event sourcing — store events, derive current state ───
const orderEvents = [
  { type: 'OrderCreated', orderId: 'O1', items: ['sku-1'] },
  { type: 'ItemAdded', orderId: 'O1', item: 'sku-2' },
  { type: 'OrderShipped', orderId: 'O1', trackingId: 'T123' },
];
function replay(events) {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'OrderCreated': return { items: [...event.items], status: 'CREATED' };
      case 'ItemAdded':    return { ...state, items: [...state.items, event.item] };
      case 'OrderShipped': return { ...state, status: 'SHIPPED', trackingId: event.trackingId };
      default: return state;
    }
  }, {});
}
const currentState = replay(orderEvents); // { items: [sku-1, sku-2], status: 'SHIPPED', trackingId: 'T123' }

// ── Strangler fig — facade routes incrementally to new services ─
app.use('/orders', (req, res) => {
  // step 1 of migration: orders already moved to the new microservice
  proxyTo('http://order-service:8081', req, res);
});
app.use('/', (req, res) => {
  // everything else still goes to the legacy monolith, for now
  proxyTo('http://legacy-monolith:8080', req, res);
});
// Next sprint: add app.use('/payments', ...) pointing at a new payment-service,
// shrinking the monolith's surface area one capability at a time.

// ── Distributed tracing — propagating a trace ID across services ─
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || generateTraceId(); // propagate or start new
  next();
});
async function callInventoryService(req, orderItems) {
  return fetch('http://inventory-service/reserve', {
    method: 'POST',
    headers: { 'x-trace-id': req.traceId }, // pass the SAME trace ID downstream
    body: JSON.stringify(orderItems),
  });
  // every log line and span in inventory-service tags itself with this same
  // trace ID, so a tracing tool (Jaeger/Zipkin) can reconstruct the full
  // cross-service call graph for this one request.
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Circuit Breaker — Deep Dive",
    icon: "◯",
    color: "#F43F5E",
    desc: "The three states in detail, configuring thresholds correctly, and fallback strategies when the circuit is open.",
    topics: [
      {
        n: "Circuit Breaker States, Thresholds & Fallbacks",
        star: true,
        tag: "CIRCUITBREAKER",
        desc: "A deeper look at circuit breakers — the exact CLOSED/OPEN/HALF-OPEN mechanics, the configuration knobs interviewers expect you to name, what should and shouldn't count as a \"failure,\" and what to actually return to the user when the circuit is open.",
        theory: `DEFINITION: A CIRCUIT BREAKER wraps a remote call and stops the caller from repeatedly hammering a downstream dependency that is already failing — trading a fast, predictable failure for a slow, resource-draining one.

EXPLANATION:
THE THREE STATES IN DETAIL: CLOSED (default — calls pass through normally, breaker keeps a rolling window of outcomes and computes a failure rate). OPEN (once the failure rate crosses the threshold within the window, calls fail IMMEDIATELY without attempting the network call — stops wasting caller threads AND stops adding load to the struggling service). HALF-OPEN (after a wait duration, a small number of trial calls decide whether to close again or reopen, often with a growing wait duration to avoid thrashing).

KEY CONFIGURATION PARAMETERS: failureRateThreshold (% that trips the breaker), slidingWindowSize (sample window), minimumNumberOfCalls (don't trip on 2 out of 3 — require a minimum sample), waitDurationInOpenState, permittedNumberOfCallsInHalfOpenState, and slowCallDurationThreshold/slowCallRateThreshold (resilience4j can also trip on calls that succeed but are TOO SLOW).

WHAT COUNTS AS A "FAILURE": Configurable — usually network errors, 5xx responses, and timeouts. Should generally EXCLUDE client errors (4xx) since those indicate a problem with the REQUEST, not the service's health.

EXAMPLE: See the code panel — a resilience4j config with slow-call detection, a fallback that returns an empty list when the breaker is open or the call itself fails, and the correct composition order (breaker wraps retry, not the reverse).

WHY: A fast failure protects both the caller (no wasted threads waiting on a doomed call) and the struggling dependency (no added load while it's already unhealthy).

WHAT (fallback strategies when OPEN — often probed beyond just "it fails fast"): Return cached/stale data, return a sensible default (empty list instead of an error), degrade gracefully (render the page without one widget), or queue the request for later processing instead of failing outright.

WHY NOT / CAVEATS — CIRCUIT BREAKER vs RETRY composition: order matters. Typically the circuit breaker wraps the retry policy (breaker decides IF we even attempt the call sequence; retry handles transient failures WITHIN a permitted attempt). Retrying against an already-OPEN circuit defeats the entire purpose of the breaker.`,
        code: `// ── resilience4j circuit breaker with slow-call detection ──
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)                       // trip if >=50% of calls fail
    .slowCallRateThreshold(80)                       // OR if >=80% of calls are "slow"
    .slowCallDurationThreshold(Duration.ofSeconds(2)) // a call counts as slow past 2s
    .slidingWindowType(SlidingWindowType.COUNT_BASED)
    .slidingWindowSize(20)                            // evaluate over the last 20 calls
    .minimumNumberOfCalls(10)                         // need at least 10 samples before tripping
    .waitDurationInOpenState(Duration.ofSeconds(15))  // stay OPEN for 15s before trial calls
    .permittedNumberOfCallsInHalfOpenState(3)         // let 3 calls through to test recovery
    .recordExceptions(IOException.class, TimeoutException.class) // count these as failures
    .ignoreExceptions(ValidationException.class)      // 4xx-style errors don't trip the breaker
    .build();

CircuitBreaker breaker = CircuitBreaker.of("recommendationService", config);

// ── Fallback strategy — degrade gracefully instead of erroring ─
Supplier<List<Product>> decorated = CircuitBreaker.decorateSupplier(breaker,
    () -> recommendationClient.getRecommendations(userId));

List<Product> recommendations = Try.ofSupplier(decorated)
    .recover(CallNotPermittedException.class, ex -> Collections.emptyList()) // breaker is OPEN
    .recover(Exception.class, ex -> Collections.emptyList())                  // call itself failed
    .get();
// Page still renders — just without the recommendations widget — instead of a hard error.

// ── Listening to state transitions (useful for alerting) ──
breaker.getEventPublisher()
    .onStateTransition(event ->
        log.warn("Circuit breaker {} transitioned: {} -> {}",
            event.getCircuitBreakerName(),
            event.getStateTransition().getFromState(),
            event.getStateTransition().getToState()));

// ── Ordering: circuit breaker wraps retry, not the reverse ─
Retry retry = Retry.ofDefaults("paymentRetry");
CircuitBreaker cb = CircuitBreaker.ofDefaults("paymentBreaker");

Supplier<PaymentResponse> supplier = () -> paymentClient.charge(request);
Supplier<PaymentResponse> withRetry = Retry.decorateSupplier(retry, supplier);
Supplier<PaymentResponse> withBreakerThenRetry =
    CircuitBreaker.decorateSupplier(cb, withRetry);
// breaker decides "should we even try" FIRST; retry only kicks in for attempts that ARE permitted.`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Event-Driven Architecture",
    icon: "⚡",
    color: "#EAB308",
    desc: "Pub/sub, event notification vs event-carried state transfer, brokers, delivery guarantees, and dead-letter queues.",
    topics: [
      {
        n: "Pub/Sub, Message Brokers, Delivery Guarantees & Dead-Letter Queues",
        star: true,
        tag: "EVENTDRIVEN",
        desc: "Event-driven architecture has services publish/consume events through a broker instead of calling each other's APIs directly — decoupling producers from consumers, at the cost of needing idempotent consumers, delivery-guarantee decisions, and dead-letter handling for poison messages.",
        theory: `DEFINITION: EVENT-DRIVEN ARCHITECTURE (EDA) — services communicate primarily by producing and consuming EVENTS via a message BROKER, rather than calling each other's APIs directly.

EXPLANATION:
PUBLISH/SUBSCRIBE (PUB/SUB): Producers publish events to a TOPIC/CHANNEL without knowing who's listening; any number of consumers can subscribe independently, decoupling producers from consumers completely.

TWO FLAVORS OF EVENTS: EVENT NOTIFICATION (a small event with just an ID — consumers call back to the source API for detail; keeps events small but re-introduces coupling at consumption time). EVENT-CARRIED STATE TRANSFER (the event carries the full relevant data — no callback needed, fully decoupled, but events get larger and schema changes need careful versioning).

MESSAGE BROKER CHOICES: RABBITMQ (traditional queue/broker, AMQP, good for point-to-point work-queue distribution, messages are consumed and removed) vs KAFKA (a distributed event streaming platform — durable, ordered, partitioned logs retained for a period, multiple consumer groups can independently re-read the stream, enabling replay and a natural fit for event sourcing).

DELIVERY GUARANTEES: AT-MOST-ONCE (may lose messages, never duplicates), AT-LEAST-ONCE (never loses, may duplicate — the common default), EXACTLY-ONCE (the ideal, genuinely hard end-to-end).

DEAD-LETTER QUEUE (DLQ): When a consumer repeatedly fails on a poison message, it's moved to a separate DLQ after N attempts, so the main queue keeps flowing while the bad message is inspected separately.

EXAMPLE: See the code panel — event notification vs event-carried state transfer side by side, a Kafka producer keyed by customerId for per-customer ordering, an idempotent consumer checking a dedupe store, and a consumer that parks a message in a DLQ after 3 failed attempts.

WHY: Decoupling producers from consumers means a producer never has to change when a new consumer is added, and consumers can process at their own pace without the producer needing to be blocked or aware of them.

WHAT (what makes it safe in production): IDEMPOTENT CONSUMERS — since at-least-once delivery means a consumer might see the same event twice, consumers must be written so processing it twice has no additional effect (track processed IDs in a dedupe store). ORDERING — Kafka guarantees order only WITHIN a partition, so events that must stay in order (e.g., all events for one order) should share a partition key.

WHY NOT / CAVEATS: EVENTUAL CONSISTENCY — consumers processing asynchronously means downstream state is only eventually consistent with the source of truth. Event-carried state transfer means every consumer receives the full payload even if it only needs a fraction, and Kafka's exactly-once guarantees don't automatically extend to arbitrary external side effects like calling a payment API.`,
        code: `// ── Event notification (thin event, callback for detail) ──
await eventBus.publish('order.created', { orderId: 'O123' }); // just an ID
// Consumer:
eventBus.subscribe('order.created', async ({ orderId }) => {
  const order = await fetch('http://order-service/orders/' + orderId).then(r => r.json());
  // needs a synchronous call back to get the actual data it needs
});

// ── Event-carried state transfer (fat event, self-contained) ─
await eventBus.publish('order.created', {
  orderId: 'O123', items: [{ sku: 'A1', qty: 2 }], total: 49.98, customerId: 'C456'
}); // consumer has everything it needs, no callback required
eventBus.subscribe('order.created', async (order) => {
  await updateAnalytics(order); // fully self-contained, works even if order-service is down
});

// ── Kafka — topics, partitions, and partition keys for ordering ─
await producer.send({
  topic: 'order-events',
  messages: [{
    key: order.customerId,          // same key → same partition → preserves order per customer
    value: JSON.stringify(order),
  }],
});
// consumer group "billing-service" and "analytics-service" can BOTH independently
// consume the entire "order-events" topic at their own pace, from any offset.

// ── Idempotent consumer — safe against at-least-once redelivery
async function handleOrderCreated(event) {
  const alreadyProcessed = await dedupeStore.has(event.id);
  if (alreadyProcessed) return; // silently skip — already applied this exact event once
  await applyOrderToAnalytics(event);
  await dedupeStore.markProcessed(event.id);
}

// ── Dead-letter queue — isolate poison messages ───────────
async function consumeWithDLQ(message, attempt = 0) {
  try {
    await processMessage(message);
  } catch (err) {
    if (attempt >= 3) {
      await deadLetterQueue.publish(message, { error: err.message, failedAttempts: attempt });
      return; // stop retrying — main queue keeps flowing, message parked for inspection
    }
    await retryQueue.publishWithDelay(message, { attempt: attempt + 1 }, backoffMs(attempt));
  }
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "CQRS — Deep Dive",
    icon: "⊘",
    color: "#3B82F6",
    desc: "Separating write and read models properly, when it's worth the complexity, and how it pairs with event sourcing.",
    topics: [
      {
        n: "Command Query Responsibility Segregation — When & How",
        star: true,
        tag: "CQRS",
        desc: "CQRS splits an app's data model into a write-optimized command model and a read-optimized query model, kept in sync asynchronously via events — worth it when read/write workloads diverge sharply, overkill for a simple CRUD service.",
        theory: `DEFINITION: CQRS (Command Query Responsibility Segregation) splits an application's data model into a COMMAND (write) model that enforces business rules on state changes, and a QUERY (read) model structured purely for efficient reading — these can be different shapes, different databases, even different services.

EXPLANATION:
THE MOTIVATING PROBLEM: In a single shared model (typical CRUD), the same schema serves both "validate and safely persist a change" and "answer flexible, fast, possibly complex queries." A write model wants normalization (avoid update anomalies); a read model often wants denormalization (avoid expensive joins). Satisfying both with one model is a constant tension as query patterns diversify.

WHAT CQRS IS NOT: NOT simply "use a DTO for reads and an entity for writes within one service" — that's smaller-scale and uncontroversial. Full CQRS usually means genuinely separate READ-SIDE STORES (sometimes a separate deployable "query service") kept in sync via events the write side publishes.

HOW THE SYNC WORKS: Command side processes a command → validates → persists to its own store → publishes a domain event → one or more READ-SIDE PROJECTIONS subscribe and update their own denormalized store(s) (Elasticsearch for search, Redis for fast lookups, a reporting-optimized SQL schema, etc.).

EXAMPLE: See the code panel — a command service that validates and publishes order.placed, two independent projections (Redis for fast lookup, Elasticsearch for search) that subscribe to it, and a read-your-own-writes mitigation that returns the just-written object directly instead of re-querying the read side.

WHY: Read and write workloads often have fundamentally different scaling and shape needs — separating them lets each side be optimized (and scaled) independently instead of compromising on one shared schema.

WHAT (when it's worth it — show judgment, not blanket enthusiasm): ✓ Read/write workloads scale very differently (e.g., 1000x more reads than writes). ✓ Query needs are complex/varied and don't map well to the write-side schema (search, multi-entity aggregation, reporting). ✓ You're already using event sourcing (CQRS is nearly a natural requirement there).

WHY NOT / CAVEATS: EVENTUAL CONSISTENCY ON READS — because the read model updates asynchronously after the write commits, a client that just wrote data might not see it yet on an immediate read (mitigated with read-your-own-writes patterns). ✗ A simple CRUD service with straightforward, uniform query needs — CQRS there is pure added complexity for no real benefit; not every service needs this.`,
        code: `// ── Command side — validates and owns the source of truth ──
class OrderCommandService {
  async placeOrder(cmd) {
    if (cmd.items.length === 0) throw new Error('Order must contain at least one item');
    const order = await this.writeDb.orders.insert({
      id: cmd.orderId, customerId: cmd.customerId, items: cmd.items, status: 'PLACED',
    });
    await this.eventBus.publish('order.placed', order); // read side will react to this
    return order;
  }
}

// ── Read side — separate, denormalized, optimized per query need ─
// Projection #1: fast lookup by customer (Redis)
eventBus.subscribe('order.placed', async (order) => {
  await redis.rpush('orders:by-customer:' + order.customerId, JSON.stringify(order));
});

// Projection #2: full-text/faceted search (Elasticsearch)
eventBus.subscribe('order.placed', async (order) => {
  const customer = await customerServiceClient.get(order.customerId); // enrich for denormalization
  await searchIndex.index('orders', {
    id: order.id, customerName: customer.name, items: order.items, total: order.total,
  });
});

// ── Query side API — reads ONLY from the projections, never the write DB ─
app.get('/customers/:id/orders', async (req, res) => {
  const cached = await redis.lrange('orders:by-customer:' + req.params.id, 0, -1);
  res.json(cached.map(JSON.parse)); // fast, no joins, no touching the write model at all
});
app.get('/orders/search', async (req, res) => {
  const results = await searchIndex.search('orders', req.query);
  res.json(results);
});

// ── Read-your-own-writes mitigation ────────────────────────
app.post('/orders', async (req, res) => {
  const order = await orderCommandService.placeOrder(req.body);
  res.json(order); // return the freshly written object DIRECTLY from the command result,
                    // instead of immediately re-querying the (possibly-not-yet-updated) read side
});`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Service Mesh — Deep Dive",
    icon: "⬡",
    color: "#14B8A6",
    desc: "Sidecar proxies, mTLS, traffic management, and what a mesh gives you that a load balancer alone doesn't.",
    topics: [
      {
        n: "Sidecar Proxies, mTLS & Traffic Management",
        star: true,
        tag: "SERVICEMESH",
        desc: "A service mesh deploys a sidecar proxy next to every service instance to handle mTLS, traffic routing, resilience, and observability uniformly across a whole system — without touching application code — at the cost of real operational complexity, so it's worth it only once you have many services/teams/languages.",
        theory: `DEFINITION: A SERVICE MESH is a dedicated infrastructure layer for handling service-to-service communication, implemented by deploying a lightweight proxy (a "sidecar" — commonly Envoy) alongside EVERY service instance, with a separate CONTROL PLANE (Istio's istiod, Linkerd's control plane) configuring and coordinating all sidecars centrally.

EXPLANATION: All network traffic in and out of a service is transparently intercepted by its sidecar, without any change to the service's application code. The sidecars collectively form the "DATA PLANE" (actually handling traffic); the CONTROL PLANE is the brain that distributes configuration (routing rules, security policy, certs) and aggregates telemetry — you configure the mesh declaratively at the control plane, never touching individual sidecars.

WHAT THE MESH GIVES YOU: mTLS (automatic, transparent encryption AND mutual authentication of every call, with automatic cert issuance/rotation), TRAFFIC MANAGEMENT (fine-grained routing rules — e.g., 5% canary traffic — without touching client code), RESILIENCE (retries, timeouts, circuit breaking, load balancing handled uniformly in the sidecar instead of per-service), and OBSERVABILITY (metrics, logs, tracing spans emitted automatically for every call, even uninstrumented services).

EXAMPLE: See the code panel — an Istio VirtualService splitting traffic 95/5 between stable and canary without any app code change, a PeerAuthentication policy enforcing mesh-wide mTLS, and a DestinationRule configuring circuit breaking/connection limits at the mesh level instead of in application code.

WHY: Without a mesh, every team has to re-implement resilience4j-style retries/circuit-breaking and TLS handling per service, per language — a mesh centralizes it once, uniformly, for the whole system.

WHAT (mesh vs API Gateway — a common point of confusion): The API Gateway sits at the EDGE, managing NORTH-SOUTH traffic (external clients → internal services). A service mesh manages EAST-WEST traffic (service-to-service, inside the cluster). They're commonly used together, not as alternatives.

WHY NOT / CAVEATS: Meshes add real operational complexity — another whole system to run and debug ("sidecar sprawl"), added latency per hop, a learning curve. Generally worth it once you have MANY services and multiple teams/languages, or strict security/compliance needs around encrypted internal traffic. For a handful of services, an API Gateway plus in-app resilience libraries is often simpler and sufficient — a mesh solving problems you don't have yet is pure overhead.`,
        code: `// ── Istio VirtualService — canary traffic split, zero app code change ─
// apiVersion: networking.istio.io/v1beta1
// kind: VirtualService
// metadata:
//   name: payment-service
// spec:
//   hosts:
//     - payment-service
//   http:
//     - route:
//         - destination:
//             host: payment-service
//             subset: v1
//           weight: 95        // 95% of traffic to the current stable version
//         - destination:
//             host: payment-service
//             subset: v2
//           weight: 5         // 5% canary traffic to the new version — no app code touched

// ── Istio DestinationRule — mTLS enforced mesh-wide ───────
// apiVersion: security.istio.io/v1beta1
// kind: PeerAuthentication
// metadata:
//   name: default
//   namespace: istio-system
// spec:
//   mtls:
//     mode: STRICT   // every service-to-service call in the mesh is mutually authenticated + encrypted,
//                     // automatically, with zero change to any service's code

// ── Application code stays completely unaware of the mesh ─
// The service just makes a plain HTTP call — the sidecar Envoy proxy
// intercepts it transparently for mTLS, retries, load balancing, tracing:
fetch('http://payment-service/charge', { method: 'POST', body });

// ── Circuit breaking configured at the mesh level (not in app code) ─
// apiVersion: networking.istio.io/v1beta1
// kind: DestinationRule
// metadata:
//   name: payment-service
// spec:
//   host: payment-service
//   trafficPolicy:
//     outlierDetection:
//       consecutive5xxErrors: 5      // trip after 5 consecutive 5xx responses
//       interval: 30s
//       baseEjectionTime: 60s        // eject the failing instance from the LB pool for 60s
//     connectionPool:
//       tcp: { maxConnections: 100 } // bulkhead-style connection limiting, mesh-managed`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Distributed Tracing — Deep Dive",
    icon: "⌁",
    color: "#0EA5E9",
    desc: "Trace context propagation, spans, sampling strategies, and OpenTelemetry as the vendor-neutral standard.",
    topics: [
      {
        n: "Trace Context, Spans, Sampling & OpenTelemetry",
        star: true,
        tag: "TRACING",
        desc: "Distributed tracing tags one request with a trace ID and lets every service it passes through record a timed span against that same ID, so a tracing UI can reconstruct exactly where time was spent or where a request failed across a dozen services — OpenTelemetry is the current vendor-neutral way to instrument this.",
        theory: `DEFINITION: A TRACE represents the entire end-to-end journey of ONE request across every service it touches, identified by a single TRACE ID. A SPAN represents a single unit of work within that trace (e.g., "order-service handling this request," or "the SQL query it ran").

EXPLANATION:
PARENT-CHILD RELATIONSHIP: Spans form a tree — the gateway's span is the root, a service's span is its child, a SQL query span is a child of that, etc. This tree is what lets a tracing UI (Jaeger, Zipkin) render a full waterfall/flame-graph view of the whole request.

CONTEXT PROPAGATION: The trace ID + current span ID (the "trace context") must be passed along on every outgoing call, usually via HTTP headers, so the next service creates its own child span linked to the same trace. The W3C TRACE CONTEXT standard defines the common header format (traceparent, tracestate) for interoperability.

OPENTELEMETRY (OTel): The current vendor-neutral, CNCF standard for instrumenting traces, metrics, and logs — auto-instrumentation agents create spans and propagate context for common calls (HTTP, DB, messaging) with little to no manual code. OTel decouples instrumentation from the backend — swap the exporter to send the same data to Jaeger, Zipkin, Datadog, etc.

SAMPLING: HEAD-BASED (decision made at trace start, e.g. "keep 1% of requests" — simple, cheap, might miss rare failing/slow requests) vs TAIL-BASED (decision made after the trace completes, so you can keep 100% of errored/slow traces while sampling down the boring majority — more useful for debugging, more resource-intensive).

EXAMPLE: See the code panel — manual OTel span creation around an order-handling route, the actual W3C traceparent header format that travels over the wire, zero-code auto-instrumentation, and head- vs tail-based sampling collector configs.

WHY: In a monolith, a stack trace tells the whole story of one request. In microservices, a request can fan out across a dozen services — logs scattered across a dozen log files with no shared correlation make it nearly impossible to answer "why was THIS request slow" without tracing.

WHAT (correlating traces with logs): Best practice is injecting the trace ID into every structured log line a service emits for that request, so you can pivot from a slow span in the trace UI straight to the exact log lines from that service during that span.

WHY NOT / CAVEATS: Tracing every single request in a high-traffic system generates enormous data volume/cost, which is exactly why sampling strategies exist — but tail-based sampling (the more useful kind for debugging) requires buffering full trace data before deciding, which is more resource-intensive for the tracing infrastructure itself.`,
        code: `// ── Manual span creation with OpenTelemetry (Node.js) ─────
const { trace, context } = require('@opentelemetry/api');
const tracer = trace.getTracer('order-service');

app.post('/orders', async (req, res) => {
  const span = tracer.startSpan('handle-place-order'); // child of the incoming trace context
  try {
    await context.with(trace.setSpan(context.active(), span), async () => {
      const inventoryOk = await callInventoryService(req.body.items); // propagates trace context automatically
      const order = await db.orders.insert(req.body);
      span.setAttribute('order.id', order.id); // custom metadata visible in the trace UI
      res.json(order);
    });
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: 2, message: err.message }); // marks this span as an error in the trace
    throw err;
  } finally {
    span.end(); // records duration
  }
});

// ── W3C Trace Context propagation header (what actually travels over the wire) ─
// traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
//               │  └───────── trace-id ─────────┘ └── parent span-id ─┘ │
//              version                                              trace-flags (sampled?)
//
// Every outgoing HTTP call from a traced service automatically carries this header,
// so the next service creates its span as a CHILD of the same trace.

// ── Auto-instrumentation — zero manual span code needed ───
// node --require @opentelemetry/auto-instrumentations-node/register app.js
// Automatically instruments Express routes, outgoing HTTP calls, and common DB
// clients — creating and propagating spans without touching business logic at all.

// ── Head-based sampling config (sample 10% of all traces) ─
// otel-collector-config.yaml:
// processors:
//   probabilistic_sampler:
//     sampling_percentage: 10

// ── Tail-based sampling — always keep errors/slow traces ──
// processors:
//   tail_sampling:
//     policies:
//       - name: keep-errors
//         type: status_code
//         status_code: { status_codes: [ERROR] }
//       - name: keep-slow
//         type: latency
//         latency: { threshold_ms: 1000 }
//       - name: sample-the-rest
//         type: probabilistic
//         probabilistic: { sampling_percentage: 5 }`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Containerization",
    icon: "▦",
    color: "#6366F1",
    desc: "Docker images and containers, Kubernetes pods and orchestration, and why microservices and containers pair naturally.",
    topics: [
      {
        n: "Docker, Kubernetes & Why Containers Fit Microservices",
        star: true,
        tag: "CONTAINERS",
        desc: "Containers package a service with its exact runtime dependencies into one portable artifact, solving \"works on my machine\" and making independent per-service deploy/scale practical; Kubernetes is the orchestrator that runs hundreds of those containers reliably across many hosts.",
        theory: `DEFINITION: An IMAGE is a read-only, layered template built from a Dockerfile (like a class). A CONTAINER is a running instance of an image (like an object instantiated from that class).

EXPLANATION:
DOCKERFILE & LAYERS: Each instruction (FROM, COPY, RUN) creates a cached LAYER; Docker reuses unchanged layers across builds — put rarely-changing steps (dependency installation) BEFORE frequently-changing steps (copying source) so code changes don't invalidate the expensive install layer's cache.

WHY YOU NEED AN ORCHESTRATOR (KUBERNETES): Running hundreds of containers across many hosts with health checks, auto-restarts, scaling, rolling updates, and service discovery isn't something you want to manage manually — Kubernetes automates all of it.

KEY KUBERNETES CONCEPTS: POD (the smallest deployable unit; wraps one or a few tightly-coupled containers sharing networking/storage — you deploy a Pod, not a raw container). DEPLOYMENT (manages a set of identical Pod replicas, handles rolling updates, self-heals). SERVICE (the stable networking abstraction that load-balances traffic across a Deployment's Pods). CONFIGMAP/SECRET (externalize config and sensitive values out of the image, injected at runtime). HORIZONTAL POD AUTOSCALER (automatically scales Pod replicas based on observed CPU/memory or custom metrics).

EXAMPLE: See the code panel — a Dockerfile ordered for cache efficiency, running two containers from the same image as manual horizontal scaling, a Kubernetes Deployment with 3 replicas plus resource requests/limits and readiness/liveness probes, and an HPA scaling between 3 and 20 replicas on CPU.

WHY: Each microservice needs to be built, deployed, and scaled INDEPENDENTLY — containers make that portable and repeatable, and an orchestrator makes it practical at the scale microservices demand (dozens/hundreds of independently versioned deployables).

WHAT (resource requests & limits): Each container specifies a REQUEST (guaranteed minimum, used for scheduling) and a LIMIT (hard ceiling — exceeding memory gets the container OOM-killed; exceeding CPU gets it throttled, not killed).

WHY NOT / CAVEATS: Getting requests/limits wrong is a common production-readiness pitfall — under-provisioning causes crashes/throttling under load, over-provisioning wastes cluster capacity across potentially hundreds of services. Manually running containers without an orchestrator doesn't scale past a handful of instances.`,
        code: `// ── Dockerfile — layer ordering for effective caching ─────
FROM node:20-alpine
WORKDIR /app

// Dependency files copied (and installed) BEFORE the rest of the source —
// this layer only invalidates when package.json actually changes:
COPY package*.json ./
RUN npm ci --production

// Source code copied last — changes here don't bust the expensive npm-install layer:
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]

// ── Building and running multiple instances from ONE image ─
// docker build -t order-service:1.4.0 .
// docker run -d --name order-1 -p 8081:8080 order-service:1.4.0
// docker run -d --name order-2 -p 8082:8080 order-service:1.4.0
// → two independent CONTAINERS, same IMAGE — this IS horizontal scaling at the container level

// ── Kubernetes Deployment — declarative, self-healing replicas ─
// apiVersion: apps/v1
// kind: Deployment
// metadata:
//   name: order-service
// spec:
//   replicas: 3                          // maintain 3 identical Pods at all times
//   selector:
//     matchLabels: { app: order-service }
//   template:
//     metadata:
//       labels: { app: order-service }
//     spec:
//       containers:
//         - name: order-service
//           image: order-service:1.4.0
//           resources:
//             requests: { cpu: "250m", memory: "256Mi" }  // guaranteed minimum
//             limits:   { cpu: "500m", memory: "512Mi" }  // hard ceiling
//           envFrom:
//             - configMapRef: { name: order-service-config }  // externalized config
//             - secretRef:    { name: order-service-secrets } // externalized secrets
//           readinessProbe:
//             httpGet: { path: /health/ready, port: 8080 }
//           livenessProbe:
//             httpGet: { path: /health/live, port: 8080 }

// ── Horizontal Pod Autoscaler — scale automatically with load ─
// apiVersion: autoscaling/v2
// kind: HorizontalPodAutoscaler
// metadata:
//   name: order-service-hpa
// spec:
//   scaleTargetRef: { kind: Deployment, name: order-service }
//   minReplicas: 3
//   maxReplicas: 20
//   metrics:
//     - type: Resource
//       resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
//       // adds Pods automatically once average CPU crosses 70%, within the 3-20 range`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Backend for Frontend — Deep Dive",
    icon: "▤",
    color: "#D946EF",
    desc: "Why one gateway per client type beats a single generic gateway, ownership model, and the trade-offs.",
    topics: [
      {
        n: "BFF Ownership Model, Benefits & Trade-offs",
        star: true,
        tag: "BFF",
        desc: "A BFF is a dedicated API layer per client type (mobile-BFF, web-BFF, partner-BFF), ideally owned by the team that owns that client, so each client gets exactly the payload shape it needs without one gateway accumulating \"if mobile... else...\" conditionals.",
        theory: `DEFINITION: A BACKEND FOR FRONTEND (BFF) is a dedicated API layer built specifically for ONE client experience (mobile app, web app, a partner's integration) rather than one generic API gateway trying to serve every client's differing needs.

EXPLANATION:
THE PROBLEM BFF SOLVES: A single shared gateway/API serving very different client types tends to accumulate conditional logic and grows a huge surface area of optional fields to satisfy everyone — every client team also becomes dependent on a shared team/roadmap for the one gateway, a coordination bottleneck exactly like a shared database would be.

OWNERSHIP MODEL: Ideally, each BFF is owned by (or built closely with) the team that owns that specific client experience — mirroring Conway's Law so a mobile team can shape their BFF's responses without waiting on a separate backend team's release cycle.

WHAT A BFF TYPICALLY DOES: Aggregates calls to multiple downstream microservices into the exact shape one client's screens need (reducing round trips for a bandwidth-constrained mobile client); applies client-specific transformations (image compression for mobile, richer nested objects for web); can own client-specific auth flows (API-key auth for a partner BFF vs session cookies for web).

EXAMPLE: See the code panel — a shared edge gateway handling auth/rate-limiting for all clients, a lean mobile-bff dashboard endpoint returning only 5 recent orders, a richer web-bff endpoint with full nested data, and a shared auth library used by both to avoid re-implementing JWT validation per BFF.

WHY: Different clients genuinely need different payload shapes and round-trip budgets — one generic API trying to serve all of them well ends up serving none of them well.

WHAT (the duplication trade-off): Multiple BFFs inevitably duplicate SOME cross-cutting logic (auth validation, rate limiting, logging) unless extracted into a shared library or handled by an edge gateway in front of all the BFFs (a "gateway of gateways") — more deployables to build and keep consistent, in exchange for each one being simple and clearly owned.

WHY NOT / CAVEATS: If you only have ONE client type, or your clients' needs are genuinely near-identical, a single gateway is simpler and BFF is unnecessary complexity — same judgment principle as Service Mesh/CQRS: don't add a pattern to solve a problem you don't actually have yet.`,
        code: `// ── Shared edge gateway handles cross-cutting concerns ────
// (auth, rate limiting, TLS termination) — same for every client:
app.use(validateAuthToken);
app.use(rateLimiter);
app.use('/mobile', proxyTo('http://mobile-bff:8081'));
app.use('/web', proxyTo('http://web-bff:8082'));
app.use('/partner', proxyTo('http://partner-bff:8083'));

// ── mobile-bff — owned by/aligned with the mobile team ────
// Shapes responses for a bandwidth/battery-constrained client:
app.get('/mobile/dashboard', async (req, res) => {
  const [orders, notifications] = await Promise.all([
    fetch('http://order-service/orders?limit=5').then(r => r.json()),  // only recent 5
    fetch('http://notification-service/unread').then(r => r.json()),
  ]);
  res.json({
    // lean, flat shape — exactly what the mobile home screen renders, nothing more
    recentOrderIds: orders.map(o => o.id),
    unreadCount: notifications.length,
  });
});

// ── web-bff — owned by/aligned with the web team ──────────
// Shapes a much richer response for a full dashboard UI:
app.get('/web/dashboard', async (req, res) => {
  const [orders, notifications, recommendations] = await Promise.all([
    fetch('http://order-service/orders?limit=20&expand=items').then(r => r.json()),
    fetch('http://notification-service/all').then(r => r.json()),
    fetch('http://recommendation-service/for-user/' + req.user.id).then(r => r.json()),
  ]);
  res.json({ orders, notifications, recommendations }); // full nested payload, web can afford it
});

// ── Duplication that BFFs accept as a trade-off ───────────
// Both mobile-bff and web-bff independently validate the SAME JWT format —
// mitigated by extracting shared logic into a common library:
const { validateJWT } = require('@company/auth-lib'); // used identically by both BFFs
// avoids re-implementing auth logic per BFF while still keeping each BFF's
// RESPONSE SHAPING logic fully independent and owned by its respective team.`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Blue-Green & Deployment Strategies",
    icon: "⬢",
    color: "#22C55E",
    desc: "Blue-green, canary, and rolling deployments — achieving zero-downtime releases with fast rollback.",
    topics: [
      {
        n: "Blue-Green, Canary & Rolling Deployments",
        star: true,
        tag: "DEPLOYMENT",
        desc: "Blue-green, canary, and rolling deployments all aim for zero-downtime releases with a fast rollback path — they differ in infrastructure cost, blast radius, and rollback speed, and all except blue-green require the database to stay compatible with both old and new code running concurrently.",
        theory: `DEFINITION: BLUE-GREEN keeps two identical full environments and switches all traffic at once. CANARY rolls out to a small traffic percentage first and gradually increases it. ROLLING replaces instances one (or a small batch) at a time with no second environment.

EXPLANATION:
BLUE-GREEN DEPLOYMENT: BLUE (currently live) and GREEN (new version, fully deployed but idle) run side by side. Once GREEN is verified, you switch the router to send 100% of traffic to GREEN at once. BLUE stays running as an instant rollback target (just flip the switch back, no redeploy).

CANARY DEPLOYMENT: Roll out to a small subset (e.g. 5%) first, monitor error rates/latency/business metrics, and gradually increase (5% → 25% → 50% → 100%) if healthy. A problem at any stage only affects that small subset, and rollback means routing back to 0%.

ROLLING DEPLOYMENT: Replace old-version instances with new-version instances gradually, one or a small batch at a time — no separate second environment. This is Kubernetes' DEFAULT Deployment update strategy.

THE SHARED HARD REQUIREMENT: Canary and rolling both mean OLD and NEW code run concurrently against the SAME database. Never remove/rename a column the old code still reads in the same deploy new code depends on — use EXPAND/CONTRACT: add the new column while still writing/reading the old one, later switch reads to the new column, finally drop the old column once nothing references it.

EXAMPLE: See the code panel — a blue-green cutover as a one-line router config change, an Istio weighted VirtualService plus an automated Flagger canary analysis that rolls back on error-rate thresholds, a Kubernetes RollingUpdate with maxSurge/maxUnavailable, and a 3-step expand/migrate/contract schema change.

WHY: Dozens of services deploying independently and constantly makes downtime and slow, risky rollbacks unacceptable — each strategy trades infrastructure cost for rollback speed and blast-radius control differently.

WHAT (choosing between them): Blue-green — instant, clean rollback, can afford double infrastructure temporarily (less frequent, higher-stakes releases). Canary — real production signal with limited blast radius, needs strong observability (high-traffic consumer services deploying frequently). Rolling — low-overhead default (what Kubernetes does out of the box) when neither instant rollback nor gradual traffic-based validation is a strict requirement.

WHY NOT / CAVEATS: Blue-green requires DOUBLE the infrastructure capacity during deployment, and an all-at-once switch means a bug that only manifests under real production load hits ALL users at once. Canary needs solid metrics/monitoring to actually catch problems at the canary stage. Rolling rollback isn't instantaneous — it's another rolling update in reverse.`,
        code: `// ── Blue-green — traffic switch is just a router config change ─
// Before switch: router sends 100% to BLUE
// upstream blue { server order-service-blue:8080; }
// upstream green { server order-service-green:8080; }
// server { location / { proxy_pass http://blue; } }

// After verifying green with smoke tests, flip ONE config line:
// server { location / { proxy_pass http://green; } }  // instant 100% cutover
// Rollback = flip it back to "blue" — no redeploy needed, blue is still running idle.

// ── Canary via Kubernetes + Istio weighted routing ────────
// apiVersion: networking.istio.io/v1beta1
// kind: VirtualService
// spec:
//   http:
//     - route:
//         - destination: { host: order-service, subset: stable }
//           weight: 95
//         - destination: { host: order-service, subset: canary }
//           weight: 5     // start small — increase over time: 5 -> 25 -> 50 -> 100

// Automated canary analysis (conceptual, e.g. using Flagger):
// canary.yaml:
// analysis:
//   interval: 1m
//   threshold: 5              // rollback if 5 consecutive failed checks
//   maxWeight: 50
//   stepWeight: 10            // increase canary traffic by 10% per successful interval
//   metrics:
//     - name: error-rate
//       thresholdRange: { max: 1 }   // rollback automatically if error rate exceeds 1%

// ── Rolling deployment — Kubernetes' default strategy ─────
// apiVersion: apps/v1
// kind: Deployment
// spec:
//   replicas: 6
//   strategy:
//     type: RollingUpdate
//     rollingUpdate:
//       maxSurge: 1          // at most 1 EXTRA pod above the desired count during rollout
//       maxUnavailable: 1    // at most 1 pod can be down at a time
//   // Kubernetes replaces pods one-by-one, keeping the service available throughout —
//   // both v(old) and v(new) pods briefly co-exist under the SAME Service/load balancer.

// ── Expand/contract — backward-compatible schema change ───
// Deploy 1 ("expand"): add new column, keep writing to BOTH old and new
// ALTER TABLE orders ADD COLUMN shipping_address_v2 JSONB;
async function saveOrder(order) {
  await db.orders.update(order.id, {
    shipping_address: order.address,            // old column — still read by not-yet-updated pods
    shipping_address_v2: normalizeAddress(order.address), // new column — canary/new pods use this
  });
}
// Deploy 2 ("migrate reads"): switch all code to read shipping_address_v2 only
// Deploy 3 ("contract"): once 100% rolled out and stable, drop the old column
// ALTER TABLE orders DROP COLUMN shipping_address;`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Microservices Interview Q&A",
    icon: "❖",
    color: "#EF4444",
    desc: "Rapid-fire conceptual questions across the whole architecture — the ones that come up regardless of which specific topic the interview leans into.",
    topics: [
      {
        n: "Frequently Asked Conceptual & Trade-off Questions",
        star: true,
        tag: "INTERVIEWQA",
        desc: "A rapid-fire set of trade-off questions interviewers use to check you understand WHY microservices patterns exist, not just their definitions — usually asked as a follow-up to probe depth on a topic-specific question.",
        theory: `DEFINITION: These are "connective-tissue" questions — they don't test a single pattern in isolation, they test whether you can reason across boundaries, consistency, resilience, testing, and operational cost at once.

EXPLANATION (the questions themselves):

Q: How do you decide service boundaries?
A: Around bounded contexts / business capabilities (DDD), not technical layers. A useful heuristic: if two "services" always need to change together, they're probably actually one service (poor boundary); if a capability can evolve, scale, and fail independently of the rest, it's a good candidate for its own service.

Q: How do you handle a distributed transaction across services?
A: You generally don't use a true distributed ACID transaction (2PC doesn't scale well) — use the Saga pattern (choreography for simple flows, orchestration for complex ones), each step a local transaction with a defined compensating action.

Q: How do you avoid cascading failures?
A: Timeouts on every remote call, Circuit Breakers to fail fast once a dependency is unhealthy, Bulkheads to isolate resource pools per dependency, and Retries with exponential backoff + jitter (never naive immediate retries).

Q: What happens if two services need the same data?
A: Each still owns its own copy/projection of the data it needs (via events, e.g., a "customer-name cache" projection inside order-service, kept in sync via a customer.updated event) rather than querying another service's database directly or calling its API synchronously on every request — trading a little staleness for independence and resilience.

Q: How do you handle versioning of a service's API so you don't break consumers?
A: Prefer backward-compatible/additive changes (new optional fields, new endpoints) over breaking ones. When a breaking change is unavoidable, version the API explicitly (URI versioning /v2/orders, or a header-based version) and support the old version in parallel until consumers have migrated, then deprecate.

Q: How do you test a system made of many independently deployable services?
A: A layered strategy — unit tests within a service, CONTRACT TESTS between services (e.g., Pact) so a service can verify it still satisfies what its consumers expect WITHOUT spinning up the actual consumer, and a smaller number of true end-to-end tests across the whole system (kept few because they're slow/flaky/expensive to maintain at scale).

Q: What's the "distributed monolith" anti-pattern, and how do you recognize it?
A: Multiple deployables that still can't actually be deployed independently — because of a shared database, synchronous call chains so tightly coupled that one deploy requires coordinating several teams, or overly-chatty inter-service calls. You get all the operational complexity of microservices (network calls, more moving parts) with none of the independence benefit.

Q: Monolith or microservices for a new project?
A: Depends on team size, domain understanding, and operational maturity, not a default answer — many well-known systems (including at companies that famously run microservices at scale) started as a monolith and split apart once genuine team/scaling pain points appeared (a "modular monolith," with clean internal boundaries, is often a good middle ground and a much easier later migration to microservices via Strangler Fig).

Q: How do you keep an audit trail / know why an entity is in its current state?
A: Either standard audit-log tables alongside normal CRUD, or adopt Event Sourcing so the append-only event log IS the audit trail by construction — pick based on whether you need this pervasively (event sourcing) or just for a few sensitive entities (audit table is simpler).

Q: What's the single biggest operational cost microservices introduce that people underestimate?
A: Observability and debugging effort — a bug that would be one stack trace in a monolith can require correlating logs/metrics/traces across many services; this is why distributed tracing, centralized logging, and strong health-check/monitoring discipline aren't optional extras, they're a prerequisite for running microservices responsibly at all.

WHY: Interviewers use these because knowing a pattern's definition (e.g., "what is a circuit breaker") is easy to memorize, but explaining WHEN and WHY you'd reach for it — and what it costs — is what actually shows engineering judgment.

WHAT (the throughline across all of them): Nearly every answer above comes back to the same handful of ideas — bounded contexts, eventual consistency, failure isolation, and backward compatibility — applied to a different scenario each time.

WHY NOT / CAVEATS: There's no single "correct" answer to most of these — a strong response names the trade-off explicitly (e.g., "orchestration is easier to debug but adds a critical component") rather than presenting one option as universally right.`,
        code: `// ── Contract testing (Pact-style) — verify compatibility without full E2E ─
// Consumer side (order-service) defines the expectation it depends on:
const interaction = {
  state: 'customer 123 exists',
  uponReceiving: 'a request for customer 123',
  withRequest: { method: 'GET', path: '/customers/123' },
  willRespondWith: {
    status: 200,
    body: { id: 123, name: like('Alice'), email: like('alice@example.com') },
  },
};
// This generates a "pact" contract file, shared with customer-service's CI pipeline.

// Provider side (customer-service) verifies IT still satisfies that contract,
// WITHOUT order-service needing to be running at all:
// pact-verifier --provider-base-url=http://localhost:8080 --pact-urls=./pacts/order-customer.json

// ── Recognizing a "distributed monolith" red flag ─────────
// ❌ Deploying order-service REQUIRES deploying payment-service in lockstep
//    because they share a database table and a tightly-coupled synchronous chain:
async function placeOrder(req) {
  const payment = await paymentService.chargeSync(req.card); // hard sync dependency, no fallback
  await db.query('UPDATE shared_ledger SET ...');             // SAME shared table as payment-service
  // any schema change to shared_ledger now requires coordinating BOTH teams' deploys —
  // this is a distributed monolith wearing microservices' clothing.
}

// ── API versioning — additive/backward-compatible by default ─
// v1 response — existing consumers keep working unchanged:
app.get('/v1/orders/:id', (req, res) => res.json({ id: 1, total: 49.99 }));
// v1, extended additively — old consumers ignore the new field, nothing breaks:
app.get('/v1/orders/:id', (req, res) => res.json({ id: 1, total: 49.99, currency: 'USD' }));
// v2 — only created for an actual BREAKING change, old consumers keep using v1 meanwhile:
app.get('/v2/orders/:id', (req, res) => res.json({ id: 1, totalAmount: { value: 49.99, currency: 'USD' } }));`
      },
    ]
  },
];

const TAG_META = {
  OVERVIEW:    { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  GATEWAY:     { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  DISCOVERY:   { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  LOADBALANCE: { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  RESILIENCE:  { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  DATA:        { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  SAGA:        { bg: "#2A1A4A", text: "#8B5CF6", border: "#3A206A" },
  ADVANCED:    { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  CIRCUITBREAKER: { bg: "#3A0E14", text: "#F43F5E", border: "#4A121A" },
  EVENTDRIVEN:    { bg: "#3A310A", text: "#EAB308", border: "#4A3E0E" },
  CQRS:           { bg: "#0E1F3A", text: "#3B82F6", border: "#12294A" },
  SERVICEMESH:    { bg: "#0A3A32", text: "#14B8A6", border: "#0E4A40" },
  TRACING:        { bg: "#0A2A3A", text: "#0EA5E9", border: "#0E364A" },
  CONTAINERS:     { bg: "#1A163A", text: "#6366F1", border: "#221D4A" },
  BFF:            { bg: "#360A3A", text: "#D946EF", border: "#460E4A" },
  DEPLOYMENT:     { bg: "#0E3A17", text: "#22C55E", border: "#124A1E" },
  INTERVIEWQA:    { bg: "#3A0E0E", text: "#EF4444", border: "#4A1212" },
};

export default function Microservices() {
  return (
    <RevisionNotesLayout
      pageKey="microservices"
      title="Microservices Architecture"
      subtitle="API gateway, service discovery, load balancing, saga, CQRS, event-driven architecture, service mesh, distributed tracing, containerization, and deployment strategies — beginner to advanced with code and interview Q&A."
      categoryIcon="🧩"
      categoryColor="#10B981"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}

export { SECTIONS };