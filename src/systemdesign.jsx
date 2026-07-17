import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "ACID — Database Transaction Properties",
    icon: "⚛",
    color: "#EF4444",
    desc: "The four guarantees a database transaction must provide to keep data correct and reliable, even under crashes and concurrent access.",
    topics: [
      {
        n: "ACID — Definition & Why We Need It",
        tag: "ACID",
        desc: `DEFINITION: ACID is an acronym for Atomicity, Consistency, Isolation, and Durability — four properties a database transaction must guarantee so that data stays correct even when things go wrong (crashes, power loss, concurrent access, network failures).

WHY WE NEED IT: without these guarantees, a multi-step operation (e.g. "transfer $100 from account A to account B") could partially complete — money debited from A but never credited to B — leaving the database in a corrupted, inconsistent state. Financial systems, inventory systems, booking systems, and anything involving money or scarce resources absolutely require ACID guarantees. A "transaction" is simply a group of one or more operations that must ALL succeed together or ALL fail together — there is no in-between.

WITHOUT ACID: race conditions cause lost updates, crashes leave half-finished writes, concurrent reads see inconsistent/partial data, and constraint violations (negative balances, duplicate primary keys) can silently corrupt the database.`,
        code: `-- A transaction is a boundary around multiple operations
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 'A'; -- debit
UPDATE accounts SET balance = balance + 100 WHERE id = 'B'; -- credit

COMMIT; -- both succeed together, or...
-- ROLLBACK;  -- ...both are undone together if anything fails

-- Without a transaction wrapper, a crash between the two UPDATEs
-- would debit A but never credit B — money simply vanishes.`
      },
      {
        n: "A — Atomicity: all-or-nothing",
        tag: "ATOMICITY",
        desc: `BREAKDOWN: a transaction is treated as a single indivisible unit of work. Either EVERY operation inside it succeeds and is committed, or if ANY operation fails, the ENTIRE transaction is rolled back as if nothing happened — there is no partial completion.

MECHANISM: databases implement this via a transaction log (write-ahead log / WAL). Before any change is applied to the actual data pages, it's first recorded in the log. If a crash happens mid-transaction, on restart the database replays the log to either finish (redo) or undo committed/uncommitted changes, guaranteeing atomicity is restored.

REAL-WORLD EXAMPLE: booking a flight seat + charging the credit card must be atomic — if the payment fails, the seat reservation must also be rolled back, otherwise you'd have a seat held with no payment, or a charge with no seat.`,
        code: `@Transactional  // Spring wraps this method in a single atomic transaction
public void transferMoney(String fromId, String toId, BigDecimal amount) {
    Account from = accountRepo.findById(fromId).orElseThrow();
    Account to = accountRepo.findById(toId).orElseThrow();

    if (from.getBalance().compareTo(amount) < 0) {
        throw new InsufficientFundsException(); // triggers automatic ROLLBACK
    }

    from.setBalance(from.getBalance().subtract(amount));
    to.setBalance(to.getBalance().add(amount));

    accountRepo.save(from);
    accountRepo.save(to);
    // If save(to) throws for ANY reason (constraint violation, connection drop),
    // Spring rolls back save(from) too — both changes vanish together.
}

// Raw JDBC equivalent — manual atomicity
Connection conn = dataSource.getConnection();
try {
    conn.setAutoCommit(false);
    debit(conn, fromId, amount);
    credit(conn, toId, amount);
    conn.commit();               // both succeed
} catch (SQLException e) {
    conn.rollback();             // both undone
    throw e;
}`
      },
      {
        n: "C — Consistency: valid state to valid state",
        tag: "CONSISTENCY",
        desc: `BREAKDOWN: a transaction can only move the database from one VALID state to another valid state — it must never violate defined rules: constraints (NOT NULL, UNIQUE, FOREIGN KEY, CHECK), triggers, and cascading rules. If committing a transaction would break any of these rules, the whole transaction is rejected.

IMPORTANT DISTINCTION: this is NOT the same "Consistency" as in the CAP theorem (see the CAP section) — ACID consistency is about respecting data integrity RULES defined by the schema; CAP consistency is about all nodes in a DISTRIBUTED system seeing the same data at the same time. They're unrelated concepts that unfortunately share a name.

EXAMPLE: a CHECK constraint (balance >= 0) guarantees no transaction can ever leave an account negative — the database itself refuses to commit a transaction that would violate it, regardless of application-level bugs.`,
        code: `CREATE TABLE accounts (
    id      VARCHAR(50) PRIMARY KEY,
    balance DECIMAL(12,2) NOT NULL CHECK (balance >= 0),  -- consistency rule
    owner_id BIGINT NOT NULL REFERENCES users(id)          -- referential integrity
);

-- This transaction VIOLATES the CHECK constraint and is REJECTED entirely,
-- even though the SQL syntax itself is valid:
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 'A'; -- would go negative
COMMIT;
-- ERROR: new row for relation "accounts" violates check constraint
-- The database enforces consistency — the app doesn't have to catch this itself.

// Java-side consistency enforcement (defense in depth, DB still enforces it too)
if (from.getBalance().subtract(amount).compareTo(BigDecimal.ZERO) < 0) {
    throw new IllegalStateException("Transaction would violate balance invariant");
}`
      },
      {
        n: "I — Isolation: concurrent transactions don't interfere",
        tag: "ISOLATION",
        desc: `BREAKDOWN: multiple transactions running at the same time must produce the same result as if they had run one after another (serially) — even though they're actually executing concurrently for performance. Isolation levels control HOW STRICTLY this is enforced, trading correctness for concurrency/performance.

ISOLATION LEVELS (weakest to strongest):
READ UNCOMMITTED — can see other transactions' uncommitted changes ("dirty reads"). Rarely used.
READ COMMITTED — only sees committed data, but a value can change between two reads in the same transaction ("non-repeatable read"). PostgreSQL/Oracle default.
REPEATABLE READ — same row read twice in a transaction always returns the same value, but new rows matching a query can appear ("phantom read"). MySQL InnoDB default.
SERIALIZABLE — strongest; transactions behave as if executed one at a time, one after another. Prevents dirty reads, non-repeatable reads, AND phantom reads, but has the most locking/lowest concurrency.

TRADE-OFF: higher isolation = more correctness guarantees but more locking, more blocking, lower throughput. Pick the lowest level that's still safe for your use case.`,
        code: `-- Non-repeatable read example under READ COMMITTED
-- Transaction 1:
BEGIN;
SELECT balance FROM accounts WHERE id = 'A';  -- reads 500
-- ... Transaction 2 commits a change to 'A' here, balance becomes 400 ...
SELECT balance FROM accounts WHERE id = 'A';  -- reads 400 -- DIFFERENT VALUE!
COMMIT;

-- Fix with a stricter isolation level
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT balance FROM accounts WHERE id = 'A';  -- reads 500
SELECT balance FROM accounts WHERE id = 'A';  -- still reads 500 — guaranteed
COMMIT;

// Java / JDBC — setting isolation level explicitly
conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);

// Spring
@Transactional(isolation = Isolation.SERIALIZABLE)
public void criticalTransfer(String fromId, String toId, BigDecimal amount) {
    // strict correctness at the cost of more locking/lower concurrency
}

@Transactional(isolation = Isolation.READ_COMMITTED) // default, higher throughput
public void regularRead(String id) { /* ... */ }`
      },
      {
        n: "D — Durability: committed means permanent",
        tag: "DURABILITY",
        desc: `BREAKDOWN: once a transaction is committed, its changes are PERMANENT — they survive any subsequent crash, power failure, or system restart. The database must physically persist the change (typically to disk via the write-ahead log) BEFORE acknowledging the commit back to the client.

MECHANISM: the write-ahead log (WAL) is flushed (fsync'd) to durable storage before the commit is confirmed. On restart after a crash, the database replays the log to redo any committed transactions that hadn't yet been written to the main data files — guaranteeing no committed data is ever lost, even though it might not have been in the "main" table storage yet at the moment of the crash.

TRADE-OFF: fsync-on-commit is slow (disk I/O). Some systems offer weaker durability (async replication, delayed fsync) for higher throughput at the risk of losing the last few milliseconds of committed transactions in a crash — a deliberate trade-off some high-throughput systems accept.`,
        code: `-- PostgreSQL: durability is controlled by synchronous_commit
SET synchronous_commit = on;   -- default — commit waits for WAL flush to disk (durable)
SET synchronous_commit = off;  -- faster, but a crash can lose the last few commits

-- The write-ahead log guarantees durability:
-- 1. Change is written to the WAL file first (sequential, fast)
-- 2. WAL is fsync'd to disk
-- 3. ONLY THEN is COMMIT acknowledged to the client
-- 4. The actual data pages are updated later (can be lazy, since WAL can replay it)

// JDBC — most drivers commit synchronously and durably by default
conn.commit();  // blocks until the DB confirms the write is durable

// Trade-off in distributed systems: durability often means replicating
// to multiple nodes before acknowledging, not just fsync to one disk
// e.g. quorum write: wait for W out of N replicas to persist before ack`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "SOLID — Object-Oriented Design Principles",
    icon: "◇",
    color: "#3B82F6",
    desc: "Five principles for writing maintainable, extensible object-oriented code — coined by Robert C. Martin (Uncle Bob).",
    topics: [
      {
        n: "SOLID — Definition & Why We Need It",
        tag: "SOLID",
        desc: `DEFINITION: SOLID is an acronym for five object-oriented design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. Together they guide how to structure classes and their relationships so code stays flexible as requirements change.

WHY WE NEED IT: without these principles, codebases decay into tightly-coupled, fragile structures where a small change in one place breaks unrelated code elsewhere ("shotgun surgery"), classes grow into unmaintainable God Classes, and adding new features requires modifying existing, already-tested code (risking regressions) instead of extending it safely.

WHAT IT BUYS YOU: lower coupling, higher cohesion, easier unit testing (dependencies can be mocked), and the ability to add new behavior without touching — and re-testing — old, working code.`,
        code: `// The 5 SOLID principles at a glance:
// S — Single Responsibility  — a class should have ONE reason to change
// O — Open/Closed            — open for extension, closed for modification
// L — Liskov Substitution    — subtypes must be substitutable for their base type
// I — Interface Segregation  — many small interfaces > one fat interface
// D — Dependency Inversion   — depend on abstractions, not concrete implementations`
      },
      {
        n: "S — Single Responsibility Principle (SRP)",
        tag: "SRP",
        desc: `BREAKDOWN: a class should have exactly ONE reason to change — i.e. it should be responsible for one, and only one, piece of functionality/actor concern. If a class handles both "calculate employee pay" AND "generate a payslip PDF" AND "save to the database," it has three separate reasons to change (a tax rule change, a PDF formatting change, a database schema change) — meaning any one of those unrelated changes risks breaking the others.

WHY IT MATTERS: classes that do one thing are easier to understand, test in isolation, and reuse. It's the direct antidote to the "God Class" anti-pattern.

HOW TO SPOT A VIOLATION: ask "who would ask me to change this class, and why?" — if you can list multiple unrelated stakeholders/reasons, split the class.`,
        code: `// ❌ VIOLATES SRP — 3 unrelated responsibilities in one class
class Employee {
    double calculatePay() { /* payroll logic */ return 0; }
    void generatePayslipPdf() { /* PDF formatting logic */ }
    void saveToDatabase() { /* persistence logic */ }
}
// A change to tax rules, PDF layout, OR the DB schema all touch this one class.

// ✅ FOLLOWS SRP — each class has one reason to change
class Employee {
    // just data: name, id, salary, etc.
}
class PayrollCalculator {
    double calculatePay(Employee e) { return 0; } // changes only for tax/pay-rule changes
}
class PayslipGenerator {
    void generatePdf(Employee e, double pay) { } // changes only for formatting changes
}
class EmployeeRepository {
    void save(Employee e) { } // changes only for persistence/schema changes
}`
      },
      {
        n: "O — Open/Closed Principle (OCP)",
        tag: "OCP",
        desc: `BREAKDOWN: software entities (classes, modules, functions) should be OPEN FOR EXTENSION but CLOSED FOR MODIFICATION. You should be able to add new behavior without changing existing, already-tested source code — typically achieved through abstraction (interfaces/abstract classes) and polymorphism instead of long if/else or switch chains checking a type.

WHY IT MATTERS: every time you modify working code to add a new case, you risk breaking existing functionality and have to re-test everything that depends on it. If instead you EXTEND via a new class implementing an existing interface, the old code paths are untouched and provably still work.

CLASSIC SIGNAL OF A VIOLATION: a switch/if-else chain on a "type" field that you have to keep adding new cases to every time a new type is introduced.`,
        code: `// ❌ VIOLATES OCP — adding a new discount type means MODIFYING this method
class DiscountCalculator {
    double calculate(String customerType, double amount) {
        if (customerType.equals("REGULAR")) return amount * 0.95;
        if (customerType.equals("PREMIUM")) return amount * 0.90;
        // adding "VIP" means editing this method and re-testing it all
        return amount;
    }
}

// ✅ FOLLOWS OCP — new discount types EXTEND, never modify existing code
interface DiscountStrategy {
    double apply(double amount);
}
class RegularDiscount implements DiscountStrategy {
    public double apply(double amount) { return amount * 0.95; }
}
class PremiumDiscount implements DiscountStrategy {
    public double apply(double amount) { return amount * 0.90; }
}
class VipDiscount implements DiscountStrategy {   // NEW — added, nothing else touched
    public double apply(double amount) { return amount * 0.80; }
}
class DiscountCalculator {
    double calculate(DiscountStrategy strategy, double amount) {
        return strategy.apply(amount);  // this method never changes again
    }
}`
      },
      {
        n: "L — Liskov Substitution Principle (LSP)",
        tag: "LSP",
        desc: `BREAKDOWN: objects of a superclass should be replaceable with objects of any subclass WITHOUT breaking the correctness of the program. If code works correctly with a base type Bird, it must continue to work correctly if you substitute in any subclass of Bird — the subclass must not weaken preconditions, strengthen postconditions, or throw unexpected exceptions the base type didn't.

CLASSIC EXAMPLE OF A VIOLATION: "Square extends Rectangle" seems logical geometrically, but if Rectangle has independent setWidth()/setHeight() methods, a Square (where width must always equal height) breaks that contract — setting width alone on a Square would unexpectedly also change its height, violating client code that assumed Rectangle's independent-dimension behavior.

WHY IT MATTERS: violating LSP means your inheritance hierarchy is a lie — "is-a" relationships that don't actually behave consistently, forcing callers to add type-checks (instanceof) to work around subclasses that don't honor the base contract, which itself then also breaks the Open/Closed Principle.`,
        code: `// ❌ VIOLATES LSP — Square breaks Rectangle's behavioral contract
class Rectangle {
    protected int width, height;
    void setWidth(int w)  { this.width = w; }
    void setHeight(int h) { this.height = h; }
    int area() { return width * height; }
}
class Square extends Rectangle {
    @Override void setWidth(int w)  { width = height = w; }  // side-effect!
    @Override void setHeight(int h) { width = height = h; }  // side-effect!
}
// Client code that assumes Rectangle behavior breaks silently:
void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(10);
    assert r.area() == 50;  // FAILS for a Square — area is 100, not 50!
}

// ✅ FOLLOWS LSP — don't force an "is-a" relationship that isn't behaviorally true
interface Shape {
    int area();
}
class Rectangle implements Shape {
    private final int width, height;
    Rectangle(int w, int h) { width = w; height = h; }
    public int area() { return width * height; }
}
class Square implements Shape {
    private final int side;
    Square(int side) { this.side = side; }
    public int area() { return side * side; }
}
// Both honestly implement Shape's contract — no hidden surprises for callers.`
      },
      {
        n: "I — Interface Segregation Principle (ISP)",
        tag: "ISP",
        desc: `BREAKDOWN: clients should not be forced to depend on methods they don't use. Prefer many small, focused (role-specific) interfaces over one large "fat" interface — implementing a giant interface forces every implementer to provide (or stub out with UnsupportedOperationException) methods that make no sense for it.

WHY IT MATTERS: a fat interface creates unnecessary coupling — a change to a method that ONE implementer needs forces ALL implementers to recompile/re-examine their (possibly irrelevant) implementation of it. It also produces awkward, broken implementations (a Robot implementing eat() by throwing an exception is a code smell signaling ISP violation).`,
        code: `// ❌ VIOLATES ISP — fat interface forces irrelevant implementations
interface Worker {
    void work();
    void eat();
    void sleep();
}
class HumanWorker implements Worker {
    public void work() { /* ... */ }
    public void eat() { /* ... */ }
    public void sleep() { /* ... */ }
}
class RobotWorker implements Worker {
    public void work() { /* ... */ }
    public void eat() { throw new UnsupportedOperationException(); }  // ❌ smell
    public void sleep() { throw new UnsupportedOperationException(); } // ❌ smell
}

// ✅ FOLLOWS ISP — small, role-specific interfaces
interface Workable { void work(); }
interface Eatable  { void eat(); }
interface Sleepable{ void sleep(); }

class HumanWorker implements Workable, Eatable, Sleepable {
    public void work()  { /* ... */ }
    public void eat()   { /* ... */ }
    public void sleep() { /* ... */ }
}
class RobotWorker implements Workable {   // only implements what actually applies
    public void work() { /* ... */ }
}`
      },
      {
        n: "D — Dependency Inversion Principle (DIP)",
        tag: "DIP",
        desc: `BREAKDOWN: high-level modules (business logic) should not depend on low-level modules (implementation details like a specific database or HTTP client) — BOTH should depend on abstractions (interfaces). Additionally, abstractions should not depend on details; details should depend on abstractions.

WHY IT MATTERS: if your business logic (e.g. OrderService) directly instantiates and calls a concrete MySqlOrderRepository, you can't swap in a different database, and you can't unit-test OrderService without a real MySQL connection. By depending on an OrderRepository INTERFACE instead — with the concrete implementation injected from outside (Dependency Injection) — the business logic is decoupled from the specific technology, and tests can inject a mock/fake implementation.

RELATIONSHIP TO DI (Dependency Injection): DIP is the PRINCIPLE (depend on abstractions); Dependency Injection is one common TECHNIQUE for achieving it (a framework or constructor supplies the concrete implementation from outside, rather than the class creating it itself). Spring's @Autowired is DI in service of the DIP principle.`,
        code: `// ❌ VIOLATES DIP — high-level OrderService directly depends on a low-level, concrete class
class MySqlOrderRepository {
    void save(Order o) { /* JDBC/MySQL-specific code */ }
}
class OrderService {
    private final MySqlOrderRepository repo = new MySqlOrderRepository(); // ❌ tight coupling
    void placeOrder(Order o) { repo.save(o); }
    // Can't swap databases. Can't unit test without a real MySQL instance.
}

// ✅ FOLLOWS DIP — both depend on an abstraction (interface)
interface OrderRepository {           // the abstraction
    void save(Order o);
}
class MySqlOrderRepository implements OrderRepository {
    public void save(Order o) { /* MySQL-specific code */ }
}
class MongoOrderRepository implements OrderRepository {   // easy to swap in
    public void save(Order o) { /* MongoDB-specific code */ }
}
class OrderService {
    private final OrderRepository repo;             // depends on the abstraction
    OrderService(OrderRepository repo) {              // injected from outside (DI)
        this.repo = repo;
    }
    void placeOrder(Order o) { repo.save(o); }
}

// Testing becomes trivial — inject a fake/mock implementation
OrderRepository fakeRepo = mock(OrderRepository.class);
OrderService service = new OrderService(fakeRepo);   // no real DB needed at all

// Spring — the framework performs the injection for you
@Service
class OrderService {
    private final OrderRepository repo;
    @Autowired
    OrderService(OrderRepository repo) { this.repo = repo; } // Spring supplies the bean
}`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "CAP Theorem — Distributed Systems Trade-off",
    icon: "△",
    color: "#F59E0B",
    desc: "The fundamental trade-off every distributed data system must make when a network partition occurs.",
    topics: [
      {
        n: "CAP Theorem — Definition & Why We Need It",
        tag: "CAP",
        desc: `DEFINITION: the CAP theorem (Eric Brewer, 2000) states that a distributed data store can provide AT MOST TWO of the following three guarantees SIMULTANEOUSLY, during a network partition: Consistency, Availability, and Partition Tolerance. It is a theorem about what happens SPECIFICALLY when nodes cannot communicate with each other (a "partition") — not a general "pick any 2 of 3 always" rule.

WHY WE NEED IT: in a single-machine database, there's no network between "nodes" to partition, so ACID guarantees (all four at once) are achievable. But once you distribute data across multiple machines (for scale or fault tolerance), the network between them WILL eventually fail or lag (this is not optional — it will happen), and CAP forces you to consciously decide: when that happens, do you refuse to answer requests until the partition heals (favor Consistency), or do you keep answering with possibly-stale data (favor Availability)?

CRITICAL CLARIFICATION: since network partitions are a fact of life in any real distributed system, Partition Tolerance is NOT really an optional choice you get to skip — in practice the real-world choice is between CP (Consistency + Partition tolerance, sacrifice Availability during a partition) and AP (Availability + Partition tolerance, sacrifice Consistency during a partition). "CA" without partition tolerance only really applies to a single-node system, which isn't a meaningfully "distributed" system at all.`,
        code: `// CAP is only about behavior DURING a network partition.
// When there's no partition, a well-designed system can be BOTH
// consistent and available — CAP doesn't restrict the happy path.

//                 |  During a partition, you must choose:
// -----------------------------------------------------------
// CP systems      |  Reject/block requests on the minority side
//                 |  until the partition heals — never returns stale data
//                 |  Examples: MongoDB (default), HBase, ZooKeeper, etcd
//
// AP systems      |  Keep answering reads/writes on both sides,
//                 |  possibly with stale or conflicting data — reconcile later
//                 |  Examples: Cassandra, DynamoDB, CouchDB, Riak`
      },
      {
        n: "C — Consistency: every read gets the latest write",
        tag: "CONSISTENCY",
        desc: `BREAKDOWN: every read receives the most recent write, or an error — all nodes see the same data at the same time. This is "linearizability" — if a write completes on node A, any subsequent read on node B must reflect that write, even though A and B are physically separate machines.

NOTE: this is a DIFFERENT "consistency" than ACID's C (which is about respecting schema constraints, not about multi-node agreement) — same word, different concept, a very common interview trip-up.

HOW IT'S ACHIEVED: typically via synchronous replication — a write isn't acknowledged as successful until it has been propagated to enough (or all) replicas, OR via routing all reads/writes for a given key through a single elected leader node so there's only one source of truth at any moment.

TRADE-OFF DURING A PARTITION: if node A and node B can't talk to each other, and a client writes to A, a strictly consistent system MUST either block the write on A (or reject reads on B) until A and B can sync again — otherwise B could serve stale data, breaking the guarantee.`,
        code: `// Consistent (CP) system behavior — MongoDB-style single-primary replication
// Write goes to the PRIMARY node
db.accounts.updateOne({_id: "A"}, {$set: {balance: 400}});
// Read with readConcern "majority" waits for the write to be durably
// replicated to a majority of nodes before it's even considered committed —
// guarantees any subsequent read sees this value, never a stale one.
db.accounts.find({_id: "A"}).readConcern("majority");

// If the primary can't reach a majority of replicas (partition),
// writes are REJECTED rather than risk inconsistency:
// "MongoNetworkError: not enough replica set members to satisfy write concern"

// Conceptual Java client behavior for a CP system
try {
    writeConcern = WriteConcern.MAJORITY; // require majority ack before success
    collection.updateOne(filter, update, new UpdateOptions().writeConcern(writeConcern));
} catch (MongoTimeoutException e) {
    // Partition detected — system refuses to proceed rather than risk inconsistency
    throw new ServiceUnavailableException("Cannot guarantee consistency right now");
}`
      },
      {
        n: "A — Availability: every request gets a (non-error) response",
        tag: "AVAILABILITY",
        desc: `BREAKDOWN: every request to a non-failing node must receive a response — not necessarily the most recent data, but SOME valid, non-error response, without indefinite blocking or timing out. The system keeps functioning and answering requests even if some nodes can't currently talk to others.

HOW IT'S ACHIEVED: each node can respond independently using its own local copy of the data, without waiting to confirm agreement with other nodes first — often paired with "eventual consistency," where replicas will converge to the same value over time once the partition heals, using techniques like last-write-wins, vector clocks, or CRDTs (Conflict-free Replicated Data Types) to reconcile conflicting writes made on different sides of a partition.

TRADE-OFF: an available system might serve two different clients two different (both "valid" at the time) answers for the same key during a partition, because each was served from a different, temporarily-isolated replica.`,
        code: `// Available (AP) system behavior — Cassandra-style, tunable consistency
// Write with LOCAL_ONE — acknowledge as soon as ONE local replica has it,
// don't wait for cross-datacenter or majority confirmation
session.execute(
    SimpleStatement.newInstance(
        "UPDATE accounts SET balance = 400 WHERE id = 'A'"
    ).setConsistencyLevel(ConsistencyLevel.LOCAL_ONE)
);
// This succeeds even if other replicas/datacenters are unreachable right now —
// the write will propagate to them later (eventual consistency).

// Reads similarly don't block waiting for all replicas to agree:
ResultSet rs = session.execute(
    SimpleStatement.newInstance("SELECT balance FROM accounts WHERE id = 'A'")
        .setConsistencyLevel(ConsistencyLevel.LOCAL_ONE)
);
// Might return slightly stale data if this replica hasn't received
// the latest write yet — but it ALWAYS returns something, never blocks/errors.

// Conflict resolution when the partition heals (last-write-wins, by timestamp)
// Cassandra automatically reconciles divergent replica values using timestamps
// when nodes reconnect — no manual merge needed for simple last-write-wins cases.`
      },
      {
        n: "P — Partition Tolerance: keeps working despite network splits",
        tag: "PARTITION",
        desc: `BREAKDOWN: the system continues to operate even when network communication between nodes is lost, delayed, or dropped (a "partition") — messages between nodes may be arbitrarily delayed or lost, and the system must not simply halt entirely.

WHY IT'S NOT REALLY OPTIONAL: network partitions are a fact of distributed computing — cables get cut, switches fail, packets get dropped, data centers lose connectivity. Any system spanning more than one machine over an unreliable network (which is effectively ALL networks, given enough time) WILL experience a partition eventually. A truly non-partition-tolerant distributed system would simply become completely unusable the moment any two nodes can't talk — which is not viable for a real production system spanning multiple machines/racks/datacenters.

PRACTICAL TAKEAWAY: since Partition tolerance is mandatory in practice for any real multi-node system, the CAP theorem's real-world guidance boils down to choosing between CP and AP — deciding what your system does WHEN (not if) a partition happens, per operation or per data type if needed (some systems, like DynamoDB, even let you tune this per-request).`,
        code: `// Detecting/handling a partition — conceptual node-level logic
class DistributedNode {
    boolean canReachQuorum() {
        int reachableNodes = pingOtherNodes();
        return reachableNodes >= (totalNodes / 2) + 1; // majority reachable?
    }

    Response handleWrite(WriteRequest req) {
        if (!canReachQuorum()) {
            // PARTITION DETECTED — this node is on the minority side
            if (consistencyMode == CP) {
                return Response.error("Unavailable — cannot guarantee consistency");
                // reject the write rather than risk two conflicting histories
            } else { // AP mode
                applyLocally(req);
                queueForReplicationWhenReconnected(req);
                return Response.success("Accepted locally, will sync later");
            }
        }
        // No partition — proceed normally, replicate to quorum
        return replicateAndCommit(req);
    }
}

// Real systems let you choose CP or AP behavior PER OPERATION:
// DynamoDB: ConsistentRead=true (CP-like, extra latency) vs
//           ConsistentRead=false (AP-like, eventually consistent, faster)
GetItemRequest request = new GetItemRequest()
    .withTableName("Accounts")
    .withKey(key)
    .withConsistentRead(true);  // opt into strong consistency for THIS read only`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Scalability & Reliability Patterns",
    icon: "⇄",
    color: "#14B8A6",
    desc: "Patterns for keeping services fast, available, and resilient as traffic grows and dependencies fail.",
    topics: [
      {
        n: "Load Balancing — Distributing Traffic",
        tag: "LOAD BALANCING",
        desc: `DEFINITION: a load balancer sits in front of a pool of servers and distributes incoming requests across them so no single server is overwhelmed, while also detecting and routing around unhealthy instances.

WHY WE NEED IT: a single server has a hard ceiling on CPU, memory, and connections. Once traffic exceeds that ceiling, requests queue up or fail. Load balancing lets you scale horizontally (add more machines) instead of vertically (buy a bigger machine), and gives you fault tolerance — if one server dies, traffic simply flows to the others.

BREAKDOWN OF STRATEGIES:
ROUND ROBIN — requests go to servers in rotating order. Simple, but ignores server load/capacity differences.
LEAST CONNECTIONS — routes to whichever server currently has the fewest active connections. Better for long-lived/uneven requests.
WEIGHTED — like round robin/least-connections but bigger machines get proportionally more traffic.
CONSISTENT HASHING — routes based on a hash of the request key (e.g. user ID) so the same client mostly lands on the same server — critical for caching and session affinity, and minimizes redistribution when servers are added/removed.

LAYER 4 vs LAYER 7: L4 balances at the TCP/UDP level (fast, doesn't inspect HTTP); L7 balances at the HTTP level (can route by path/header, do SSL termination, but costs more CPU).`,
        code: `# nginx L7 load balancer config — weighted least-connections
upstream backend {
    least_conn;
    server 10.0.0.1:8080 weight=3;   # bigger instance, gets more traffic
    server 10.0.0.2:8080 weight=1;
    server 10.0.0.3:8080 weight=1;
}
server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_next_upstream error timeout;  # retry on a different node if one fails
    }
}

// Consistent hashing — minimizes redistribution when nodes are added/removed
class ConsistentHashRing {
    TreeMap<Long, String> ring = new TreeMap<>();

    void addNode(String node) {
        for (int i = 0; i < 100; i++) {          // virtual nodes for even distribution
            ring.put(hash(node + "#" + i), node);
        }
    }

    String getNode(String key) {
        long h = hash(key);
        Map.Entry<Long, String> entry = ring.ceilingEntry(h);
        return entry != null ? entry.getValue() : ring.firstEntry().getValue();
    }
}`
      },
      {
        n: "Caching — Reducing Load & Latency",
        tag: "CACHING",
        desc: `DEFINITION: a cache stores a copy of frequently-accessed data in a faster-to-read location (in-memory, CDN edge, browser) so repeated requests don't have to hit the slow source of truth (a database, an origin server) every time.

WHY WE NEED IT: databases and downstream services are orders of magnitude slower than memory, and repeatedly recomputing/refetching the same data wastes capacity that could serve other requests. Caching cuts latency and protects the backend from load spikes.

BREAKDOWN OF STRATEGIES:
CACHE-ASIDE (lazy loading) — app checks cache first; on a miss, reads from DB and populates the cache. Simple, cache only holds what's actually requested, but first request after a miss is always slow ("cold cache").
WRITE-THROUGH — every write goes to the cache AND the DB synchronously. Cache is always fresh, but writes are slower.
WRITE-BACK (write-behind) — writes go to the cache immediately and are flushed to the DB asynchronously later. Fast writes, but risks data loss if the cache node crashes before flushing.
EVICTION POLICIES — since cache memory is finite, an eviction policy (commonly LRU — Least Recently Used) decides what to remove when it's full.
INVALIDATION — the hardest cache problem: when underlying data changes, stale cached copies must be expired or updated (via a TTL, explicit delete-on-write, or pub/sub invalidation messages) — otherwise clients read outdated data.`,
        code: `// Cache-aside pattern
public User getUser(String userId) {
    String cached = redis.get("user:" + userId);
    if (cached != null) {
        return deserialize(cached);          // cache HIT — fast path
    }
    User user = db.findUserById(userId);     // cache MISS — fall back to DB
    redis.setex("user:" + userId, 300, serialize(user)); // cache with 5-min TTL
    return user;
}

// Invalidate on write so stale reads don't linger
public void updateUser(User user) {
    db.save(user);
    redis.del("user:" + user.getId());       // next read repopulates the cache
}`
      },
      {
        n: "Rate Limiting — Protecting Services from Overload",
        tag: "RATE LIMITING",
        desc: `DEFINITION: rate limiting caps how many requests a client (or the system as a whole) can make in a given time window, rejecting or delaying requests beyond that cap.

WHY WE NEED IT: without limits, a buggy client, a traffic spike, or a malicious actor (DoS/brute-force) can consume all of a service's capacity, starving legitimate users. Rate limiting keeps usage fair and keeps the system inside its safe operating range.

BREAKDOWN OF ALGORITHMS:
TOKEN BUCKET — a bucket holding tokens refills at a fixed rate; each request consumes a token; if the bucket is empty, the request is rejected/queued. Allows short bursts up to the bucket size while enforcing a long-run average rate.
LEAKY BUCKET — requests queue up and are processed ("leak out") at a fixed rate, smoothing bursts into a steady output rate.
FIXED WINDOW — count requests in a fixed time window (e.g. per minute); simple, but allows a burst of 2x the limit right at a window boundary.
SLIDING WINDOW — counts requests over a rolling window rather than a fixed boundary, avoiding the boundary-burst problem at the cost of more bookkeeping.`,
        code: `// Token bucket rate limiter
class TokenBucket {
    final long capacity;
    final double refillRatePerMs;
    double tokens;
    long lastRefillTimestamp;

    boolean allowRequest() {
        refill();
        if (tokens >= 1) {
            tokens -= 1;
            return true;                     // request allowed
        }
        return false;                        // rate-limited — reject or 429
    }

    private void refill() {
        long now = System.currentTimeMillis();
        double tokensToAdd = (now - lastRefillTimestamp) * refillRatePerMs;
        tokens = Math.min(capacity, tokens + tokensToAdd);
        lastRefillTimestamp = now;
    }
}

// HTTP response when limited
// HTTP/1.1 429 Too Many Requests
// Retry-After: 30`
      },
      {
        n: "Circuit Breaker — Failing Fast & Recovering",
        tag: "CIRCUIT BREAKER",
        desc: `DEFINITION: a circuit breaker wraps calls to a dependency and "trips open" after repeated failures, immediately rejecting further calls (failing fast) instead of letting them pile up waiting on a timeout — then periodically tests the dependency to see if it has recovered.

WHY WE NEED IT: when a downstream service is slow or down, callers that keep retrying/waiting on it can exhaust their own threads/connections waiting for timeouts — turning one failing service into a CASCADING FAILURE across the whole system. Failing fast protects the caller and gives the failing dependency room to recover instead of being hammered with retries.

BREAKDOWN OF STATES:
CLOSED — normal operation; requests pass through; failures are counted.
OPEN — failure threshold exceeded; all requests are immediately rejected (fail fast) without calling the dependency, for a cooldown period.
HALF-OPEN — after the cooldown, a limited number of trial requests are let through; if they succeed, the breaker closes again; if they fail, it reopens.`,
        code: `enum State { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
    State state = State.CLOSED;
    int failureCount = 0;
    final int failureThreshold = 5;
    long openedAt;
    final long cooldownMs = 30_000;

    <T> T call(Supplier<T> dependencyCall, Supplier<T> fallback) {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - openedAt > cooldownMs) {
                state = State.HALF_OPEN;   // try one trial request
            } else {
                return fallback.get();     // fail fast — don't even try
            }
        }
        try {
            T result = dependencyCall.get();
            reset();                       // success — close the circuit
            return result;
        } catch (Exception e) {
            recordFailure();
            return fallback.get();
        }
    }

    private void recordFailure() {
        failureCount++;
        if (failureCount >= failureThreshold) {
            state = State.OPEN;
            openedAt = System.currentTimeMillis();
        }
    }

    private void reset() { failureCount = 0; state = State.CLOSED; }
}`
      },
      {
        n: "Idempotency — Making Retries Safe",
        tag: "IDEMPOTENCY",
        desc: `DEFINITION: an operation is idempotent if performing it multiple times has the exact same effect as performing it once. GET, PUT, and DELETE are idempotent by HTTP convention; POST is not.

WHY WE NEED IT: networks are unreliable — a client may time out waiting for a response and retry, even though the server actually processed the original request successfully. Without idempotency, a retried "charge $50" or "create order" request can be applied TWICE, double-charging a customer or creating duplicate orders.

BREAKDOWN OF THE MECHANISM: the client generates a unique idempotency key (typically a UUID) per logical operation and sends it with every attempt (including retries) of that same operation. The server stores which keys it has already processed along with their result; if a request arrives with a key it has seen before, the server returns the stored result WITHOUT re-executing the operation.`,
        code: `// Client — same key on every retry of the same logical request
String idempotencyKey = UUID.randomUUID().toString();
httpClient.post("/charge")
    .header("Idempotency-Key", idempotencyKey)
    .body(chargeRequest)
    .sendWithRetries(3);   // safe to retry — same key every attempt

// Server — dedupe on the key before doing real work
public Response handleCharge(String idempotencyKey, ChargeRequest req) {
    Optional<Response> existing = idempotencyStore.get(idempotencyKey);
    if (existing.isPresent()) {
        return existing.get();               // already processed — return cached result
    }
    Response result = paymentProcessor.charge(req);  // actually run it, only once
    idempotencyStore.save(idempotencyKey, result, Duration.ofHours(24));
    return result;
}`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Data & Consistency Patterns",
    icon: "☰",
    color: "#A855F7",
    desc: "Patterns for scaling data storage, keeping distributed data consistent, and agreeing on state across nodes.",
    topics: [
      {
        n: "Replication & Sharding — Scaling Data Storage",
        tag: "SHARDING",
        desc: `DEFINITION: REPLICATION copies the same data onto multiple nodes for redundancy and read scaling. SHARDING (partitioning) splits data across multiple nodes by key so each node holds only a SLICE of the total data, scaling writes and total storage capacity.

WHY WE NEED IT: a single database server has a ceiling on storage, write throughput, and connections. Replication lets you serve more reads (from replicas) and survive a node failure (via failover to a replica). Sharding lets you scale beyond what any single machine can store or write, at the cost of losing easy cross-shard transactions/joins.

BREAKDOWN:
REPLICATION — one PRIMARY accepts writes; one or more REPLICAS receive a copy of every write and can serve reads. Synchronous replication guarantees replicas are up to date before a write is acknowledged (safer, slower); asynchronous replication acknowledges immediately and replicates in the background (faster, replicas can lag — "replication lag").
SHARDING KEY — the field used to decide which shard owns a row (e.g. hash(user_id) % numShards). A well-chosen key spreads load evenly; a poorly chosen one creates a "hot shard" that gets disproportionate traffic.
CROSS-SHARD QUERIES — joins or transactions spanning multiple shards are expensive or impossible without extra coordination — a key trade-off of sharding that must be designed around up front.`,
        code: `// Simple hash-based sharding — pick which DB shard owns a user's row
int shardIndex = Math.abs(userId.hashCode()) % NUM_SHARDS;
DataSource shard = shardDataSources.get(shardIndex);
shard.getConnection().createStatement()
    .executeQuery("SELECT * FROM orders WHERE user_id = '" + userId + "'");

-- Primary/replica replication (PostgreSQL streaming replication, conceptual)
-- Primary: accepts all writes, streams WAL to replicas
-- Replica (read-only):
SELECT * FROM products WHERE category = 'electronics';  -- reads offloaded here

// Reading your own writes despite replication lag —
// route a user's own reads to the primary right after they write
if (justWrote(userId)) {
    readFrom(primary);
} else {
    readFrom(nearestReplica);
}`
      },
      {
        n: "CQRS — Command Query Responsibility Segregation",
        tag: "CQRS",
        desc: `DEFINITION: CQRS splits an application's model into two paths — COMMANDS (writes, which change state) and QUERIES (reads, which return state) — each with its own model, and often its own data store, instead of one shared model handling both.

WHY WE NEED IT: read and write workloads often have very different shapes — writes need strict validation and normalized data to stay consistent, while reads often need denormalized, pre-joined, heavily-cached views optimized for a specific screen or query pattern. Forcing both through one model means compromising one for the other. CQRS lets you scale, model, and optimize reads and writes independently.

BREAKDOWN: the WRITE MODEL handles commands ("PlaceOrder", "CancelOrder"), enforces business rules, and is the source of truth. The READ MODEL is a separate, denormalized projection (often in a different database, like a search index or cache) built specifically to answer queries fast. The write side publishes events/changes that asynchronously update the read model — meaning the read model is typically EVENTUALLY consistent with the write model, a trade-off CQRS explicitly accepts for performance.`,
        code: `// Command side — validates and mutates the source of truth
class PlaceOrderCommandHandler {
    void handle(PlaceOrderCommand cmd) {
        Order order = new Order(cmd.userId, cmd.items);
        order.validate();                 // business rules enforced here
        orderWriteRepository.save(order); // normalized write DB
        eventBus.publish(new OrderPlacedEvent(order));
    }
}

// Read side — denormalized, optimized purely for fast queries
class OrderPlacedEventHandler {
    void on(OrderPlacedEvent event) {
        // build/update a pre-joined, denormalized document for fast reads
        orderReadRepository.upsert(new OrderSummaryView(event));
    }
}

class OrderQueryService {
    OrderSummaryView getOrderSummary(String orderId) {
        return orderReadRepository.findById(orderId); // no joins, no validation, just fast reads
    }
}`
      },
      {
        n: "Event Sourcing — Storing State as a Sequence of Events",
        tag: "EVENT SOURCING",
        desc: `DEFINITION: instead of storing only the CURRENT state of an entity, event sourcing stores every state-changing EVENT that ever happened to it ("OrderCreated", "ItemAdded", "OrderShipped") as an append-only log. Current state is derived by replaying all events for that entity in order.

WHY WE NEED IT: storing only current state throws away history — you lose the ability to answer "how did we get here?", audit changes, debug production issues, or rebuild alternate views of the data. An append-only event log gives you a complete audit trail for free, the ability to rebuild any past state, and the ability to derive brand-new read models later just by replaying the same historical events.

BREAKDOWN: events are immutable and never updated or deleted, only appended. Current state is computed by folding/reducing all events for an entity (state = events.reduce(apply, initialState)). For performance, systems periodically save a SNAPSHOT of computed state so they don't have to replay from the very first event every time. Event sourcing pairs naturally with CQRS — the event log is the write model, and read models are projections built by consuming the event stream.`,
        code: `// Events are immutable facts, append-only
record OrderCreated(String orderId, String userId) {}
record ItemAdded(String orderId, String sku, int qty) {}
record OrderShipped(String orderId) {}

// Current state is derived by replaying events, not stored directly
class Order {
    static Order replay(List<Object> events) {
        Order order = new Order();
        for (Object event : events) {
            order.apply(event);              // fold each event into current state
        }
        return order;
    }

    void apply(Object event) {
        if (event instanceof OrderCreated e) this.userId = e.userId();
        else if (event instanceof ItemAdded e) this.items.add(e);
        else if (event instanceof OrderShipped e) this.status = "SHIPPED";
    }
}

// Appending a new event (a "command" results in a new event, not a direct mutation)
eventStore.append(orderId, new ItemAdded(orderId, "SKU-123", 2));

// Snapshotting — avoid replaying thousands of events every load
if (eventStore.countSince(lastSnapshot) > 100) {
    snapshotStore.save(orderId, Order.replay(allEvents));
}`
      },
      {
        n: "Consensus — Getting Distributed Nodes to Agree (Raft/Paxos)",
        tag: "CONSENSUS",
        desc: `DEFINITION: a consensus algorithm lets a cluster of nodes agree on a single value or a single ordered sequence of operations, even when some nodes crash or messages are delayed — so the cluster behaves as one consistent system instead of diverging into conflicting states.

WHY WE NEED IT: any system that replicates data across multiple nodes (a distributed database, a distributed lock, leader election) needs all nodes to agree on things like "who is the current leader" or "what is the agreed order of writes" — without agreement, different nodes could each believe conflicting things are true, corrupting the system. Consensus algorithms (Raft, Paxos) solve this with mathematically proven guarantees, which is why almost nobody implements one from scratch — you use a proven implementation (etcd, ZooKeeper, Consul) instead.

BREAKDOWN (RAFT, the more understandable of the two): nodes are LEADER, FOLLOWER, or CANDIDATE. A single elected LEADER handles all writes and replicates them to FOLLOWERS. A write is only considered committed once a MAJORITY (quorum) of nodes have durably stored it — so the system tolerates up to (N-1)/2 node failures while staying correct. If the leader dies, followers time out and a new leader election happens via a CANDIDATE requesting votes.`,
        code: `// Conceptual Raft-style leader election trigger
class RaftNode {
    Role role = Role.FOLLOWER;
    int currentTerm = 0;
    long lastHeartbeatReceived;
    final long electionTimeoutMs = 300;

    void onTick() {
        if (role != Role.LEADER &&
            System.currentTimeMillis() - lastHeartbeatReceived > electionTimeoutMs) {
            startElection();              // leader presumed dead — hold a vote
        }
    }

    void startElection() {
        role = Role.CANDIDATE;
        currentTerm++;
        int votes = 1;                    // vote for self
        for (Node peer : peers) {
            if (peer.requestVote(currentTerm, myId)) votes++;
        }
        if (votes > (peers.size() + 1) / 2) {   // majority quorum achieved
            role = Role.LEADER;
        }
    }
}

// A write is only "committed" once a quorum of followers have replicated it
boolean commit(LogEntry entry) {
    int acked = leader.replicateToFollowers(entry);
    return acked >= (totalNodes / 2) + 1;  // majority — safe even if minority fails
}`
      }
    ]
  }
];

export { SECTIONS };

const TAG_META = {
  ACID:        { bg: "#3A0E0E", text: "#EF4444", border: "#4A1414" },
  ATOMICITY:   { bg: "#3A0E0E", text: "#EF4444", border: "#4A1414" },
  CONSISTENCY: { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  ISOLATION:   { bg: "#2D1A4A", text: "#8B5CF6", border: "#3A2060" },
  DURABILITY:  { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  SOLID:       { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  SRP:         { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  OCP:         { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  LSP:         { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  ISP:         { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  DIP:         { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  CAP:         { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  AVAILABILITY:{ bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  PARTITION:   { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  "LOAD BALANCING": { bg: "#0A2E2A", text: "#14B8A6", border: "#0C3D38" },
  CACHING:          { bg: "#0A2E2A", text: "#14B8A6", border: "#0C3D38" },
  "RATE LIMITING":  { bg: "#0A2E2A", text: "#14B8A6", border: "#0C3D38" },
  "CIRCUIT BREAKER":{ bg: "#0A2E2A", text: "#14B8A6", border: "#0C3D38" },
  IDEMPOTENCY:      { bg: "#0A2E2A", text: "#14B8A6", border: "#0C3D38" },
  SHARDING:         { bg: "#301A3A", text: "#A855F7", border: "#3E2050" },
  CQRS:             { bg: "#301A3A", text: "#A855F7", border: "#3E2050" },
  "EVENT SOURCING": { bg: "#301A3A", text: "#A855F7", border: "#3E2050" },
  CONSENSUS:        { bg: "#301A3A", text: "#A855F7", border: "#3E2050" },
};

export default function SystemDesignConcepts() {
  return (
    <RevisionNotesLayout
      pageKey="system-design"
      title="System Design Concepts"
      subtitle="Comprehensive guide to ACID, SOLID, CAP theorem, scalability, caching, sharding, and consensus algorithms."
      categoryIcon="🏗️"
      categoryColor="#6366F1"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}