import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Spring Boot — Bug Hunts",
    icon: "☕",
    color: "#22C55E",
    desc: "Spot-the-bug style questions from CitiusTech L1 round — Spring Boot controller code review.",
    topics: [
      {
        n: "Spring Boot Controller — 6 bugs in one snippet",
        tag: "SPRING",
        desc: `A classic "find the bugs" interview snippet used by CitiusTech in L1 rounds. Tests basic Java syntax awareness, Spring Boot knowledge, and understanding of return types / HTTP status codes.

BUG 1 — "Class" should be "class" (lowercase). Java is case-sensitive; Class is a completely different (reflection) keyword.
BUG 2 — HttpStatus.SUCCESS does not exist. Valid values are HttpStatus.OK (200), HttpStatus.CREATED (201), HttpStatus.ACCEPTED (202).
BUG 3 — @RequestBody has no parameter — it must annotate a method parameter, e.g. @RequestBody String body.
BUG 4 — Return type is void but the method tries to return a value — compile error.
BUG 5 — Duplicate method name getData — legal only because @PostMapping/@GetMapping differ, but it's bad practice and confusing.
BUG 6 — @RestController class has no @RequestMapping base path — not a bug, but missing best practice.`,
        code: `// ❌ BROKEN
@RestController
Class DemoController {                                    // Bug 1: Class -> class

    @PostMapping(path="/api/createdata/")
    public ResponseEntity<String> getData(@RequestBody ) { // Bug 3: no param type
        return new ResponseEntity<String>("Message", HttpStatus.SUCCESS); // Bug 2
    }

    @GetMapping(path="/api/getData/")
    public void getData() {                                // Bug 4: void but returns
        return new ResponseEntity<String>("Message", HttpStatus.SUCCESS);
    }
}

// ✅ CORRECTED
@RestController
@RequestMapping("/api")                                    // Bug 6 fixed
public class DemoController {

    @PostMapping("/createdata")
    public ResponseEntity<String> createData(@RequestBody String requestBody) { // Bug 5 fixed
        return new ResponseEntity<>("Message", HttpStatus.CREATED); // 201
    }

    @GetMapping("/getData")
    public ResponseEntity<String> getData() {
        return new ResponseEntity<>("Message", HttpStatus.OK); // 200
    }
}`
      },
      {
        n: "HashMap put() bugs — bad equals()/hashCode() + map.Size()",
        tag: "SPRING",
        desc: `Classic HashMap interview trap. An Employee class overrides equals() to always return true and hashCode() to always return 1.

WHAT HAPPENS: all 3 employees hash to the SAME bucket. Since equals() always returns true, every new put() looks like a duplicate key, so the value is overwritten instead of a new entry being added. Result: map has only 1 entry (first key, last value) and size = 1, not 3.

Also map.Size() is a compile error — Java is case-sensitive, the real method is size() with a lowercase s.

CONTRACT RULE: if equals() returns true, hashCode() MUST be equal too. The reverse is not required (two unequal objects can share a hash — that's a collision, not a bug).`,
        code: `@Override
public boolean equals(Object o) { return true; }   // ALL employees "equal"
@Override
public int hashCode() { return 1; }                // ALL employees same bucket

// map.put(new Employee(1,"abc"), 1);
// map.put(new Employee(2,"xyz"), 2);  -> overwrites abc's value (equals()==true)
// map.put(new Employee(3,"pqr"), 3);  -> overwrites again
// Result: {Employee(1,"abc")=3}, size=1

map.Size();  // ❌ compile error — capital S doesn't exist
map.size();  // ✅ correct

// CORRECT equals/hashCode
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Employee)) return false;
    Employee e = (Employee) o;
    return this.id == e.id && Objects.equals(this.name, e.name);
}
@Override
public int hashCode() { return Objects.hash(id, name); }
// Now: 3 distinct entries, size = 3`
      },
      {
        n: "Third-highest salary per department — 7 bugs",
        tag: "STREAMS",
        desc: `A larger scenario bug-hunt: iterative code trying to find the 3rd highest salary per department.

BUG 1 — List.of(obj) is immutable; a later .add() throws UnsupportedOperationException. Use new ArrayList<>().
BUG 2 — missing semicolon after .add(obj).
BUG 3 — raw type Map.Entry (unchecked warning) — should be Map.Entry<String, List<Employee>>.
BUG 4 — obj.getValue().get(2) with no size check throws IndexOutOfBoundsException if a department has < 3 employees.
BUG 5 — Collections.comparing() doesn't exist — comparing() lives on Comparator, not Collections.
BUG 6 — raw type LinkedHashMap — should use the diamond operator <>.
BUG 7 — sorting ascending gets the 3rd LOWEST salary, not 3rd highest — must sort descending (.reversed()) before indexing.`,
        code: `// Clean Java 8 stream version (how the interviewer expects it)
Map<String, Optional<Integer>> thirdHighest = employeeObj.stream()
    .collect(
        Collectors.groupingBy(
            Employee::getDepartment,
            Collectors.collectingAndThen(
                Collectors.toList(),
                list -> list.stream()
                    .map(Employee::getSalary)
                    .distinct()
                    .sorted(Comparator.reverseOrder())
                    .skip(2)
                    .findFirst()
            )
        )
    );

thirdHighest.forEach((dept, salary) ->
    salary.ifPresent(s -> System.out.println(dept + " -> Third Highest: " + s))
);
// IT has 4 employees -> {IT=70000}
// HR has only 2 -> safely skipped (Optional.empty)`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Functional Interfaces & Java Abstractions",
    icon: "λ",
    color: "#F59E0B",
    desc: "Functional interface vs regular interface vs abstract class, plus all 43 built-in functional interfaces in java.util.function.",
    topics: [
      {
        n: "FunctionalInterface vs Regular Interface vs Abstract Class",
        tag: "OOP",
        desc: `There are 4 ways to define a contract/abstraction in Java — they look similar but serve different purposes.

FUNCTIONAL INTERFACE: exactly ONE abstract method (default/static allowed). Usable with lambdas.
REGULAR INTERFACE: any number of abstract methods, plus default/static. Cannot use lambda — must implement all methods.
ABSTRACT CLASS: can have state (fields), constructors, and a mix of abstract + fully-implemented (concrete) methods. Only single inheritance (one extends).

A functional interface CAN extend another interface, as long as the TOTAL abstract method count across both stays at exactly one. An abstract class CAN implement a functional interface and leave the abstract method unimplemented for its subclasses.`,
        code: `@FunctionalInterface
interface FuncInterface {
    int call();                       // exactly one abstract method
    default void log() { System.out.println("called"); }
}
FuncInterface f = () -> 42;           // lambda works

interface Vehicle {                   // regular interface
    void start();
    void stop();
    default void honk() { System.out.println("Beep"); }
    static Vehicle create() { return new Car(); }
}

abstract class Animal {               // abstract class — has state + constructor
    String name;
    Animal(String name) { this.name = name; }
    abstract void speak();            // must override
    void breathe() { System.out.println(name + " breathing"); } // concrete
}
class Dog extends Animal {
    Dog(String name) { super(name); }
    void speak() { System.out.println("Woof"); }
}

// Feature          | Functional | Regular  | Abstract Class
// Abstract methods | Exactly 1  | Any      | Any
// State (fields)   | No         | No       | Yes
// Constructor      | No         | No       | Yes
// Lambda support   | Yes        | No       | No
// Multiple impl    | Yes        | Yes      | No (only 1 extends)`
      },
      {
        n: "All 43 built-in functional interfaces (java.util.function)",
        tag: "FP",
        desc: `Group 1 — the core 4:
Predicate<T>: T -> boolean, used for filtering. Combine with .and()/.or()/.negate().
Function<T,R>: T -> R, used for transforming. Chain with .andThen().
Consumer<T>: T -> void, used for side effects (println, save to DB).
Supplier<T>: () -> T, used for lazy creation (e.g. Optional.orElseGet).

Group 2 — variations: BiFunction<T,U,R>, BiPredicate<T,U>, BiConsumer<T,U> — same idea but 2 inputs.

Group 3 — primitive specializations (avoid autoboxing overhead): IntPredicate, IntFunction, IntSupplier, IntConsumer, IntUnaryOperator, IntBinaryOperator, ToIntFunction — same exists for Long/Double.

Group 4 — operators (special case of Function where types match): UnaryOperator<T> (T->T, used by list.replaceAll), BinaryOperator<T> (T,T->T, used by stream.reduce).

INTERVIEW GOTCHA: Predicate<T> returns primitive boolean; Function<T,Boolean> returns boxed Boolean (autoboxing overhead) — always prefer Predicate for boolean logic.`,
        code: `Predicate<Integer> isEven = n -> n % 2 == 0;
Predicate<Integer> isPositive = n -> n > 0;
Predicate<Integer> both = isEven.and(isPositive);

Function<String, Integer> length = String::length;
Function<String, String> upper = String::toUpperCase;
Function<String, Integer> upperLength = upper.andThen(length);

Consumer<String> print = System.out::println;
Supplier<Ticket> defaultTicket = () -> new Ticket("DEFAULT", "LOW");

BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);
UnaryOperator<Integer> square = n -> n * n;
BinaryOperator<Integer> add = (a, b) -> a + b;

list.stream()
    .filter(n -> n > 0)                 // Predicate<T>
    .map(n -> n * 2)                    // Function<T,R>
    .peek(System.out::println)          // Consumer<T>
    .reduce(0, (a, b) -> a + b);        // BinaryOperator<T>

list.removeIf(n -> n < 0);              // Predicate<T>
list.replaceAll(n -> n * 2);            // UnaryOperator<T>
list.sort((a, b) -> a - b);             // Comparator<T> — also a functional interface`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Collections & HashMap Internals",
    icon: "▦",
    color: "#EF4444",
    desc: "The single most repeated gap across your interviews (CitiusTech + EPAM both flagged it). Collision vs duplicate key, rehashing, TreeMap red-black tree, LinkedHashMap ordering.",
    topics: [
      {
        n: "Collision vs Duplicate Key — the exact confusion EPAM flagged",
        tag: "HASHMAP",
        desc: `This is the #1 recurring gap. Say it out loud until it's automatic:

DUPLICATE KEY: same key inserted twice -> value is OVERWRITTEN, size stays the same.
COLLISION: DIFFERENT keys that land in the SAME bucket (same hash % capacity) -> BOTH entries are KEPT, stored as a linked list (or tree) in that bucket, size increases by 1.

The confusion happens because both scenarios look similar externally ("two things landed on the same bucket") but the internal handling (walk the bucket's list, check hash AND (reference OR equals()) for each node) is what decides overwrite vs append.`,
        code: `// Duplicate Key
map.put("a", 1);
map.put("a", 2);        // -> {"a": 2}, size = 1  (overwritten)

// Collision
map.put("Aa", 1);
map.put("BB", 2);       // "Aa".hashCode() == "BB".hashCode() -> same bucket!
                         // both entries KEPT (linked list in bucket), size = 2

// put("key", value) full internal flow:
// 1. hash = key.hashCode() ^ (hashCode >>> 16)      // spread bits
// 2. index = hash & (capacity - 1)                  // faster than hash % capacity
// 3. Bucket empty?              -> insert directly
// 4. Bucket has entries?        -> walk the list, check each node:
//       same hash AND (same reference OR equals()) ? -> DUPLICATE -> overwrite value
//       no match at end of list?                     -> COLLISION -> append new node
// 5. Bucket nodes >= 8 AND total capacity >= 64?      -> treeify (linked list -> red-black tree)
// 6. size > threshold (capacity * loadFactor)?        -> REHASH -> double capacity, re-index all`
      },
      {
        n: "Rehashing & the numbers you must know",
        tag: "HASHMAP",
        desc: `HashMap starts with capacity 16 and loadFactor 0.75 -> threshold = 12. When the 12th entry is added, rehashing triggers:
1. A new array is created with double the capacity (16 -> 32).
2. EVERY existing entry is re-hashed using the new capacity: newIndex = hash % 32.
3. The old array is discarded.

This is an O(n) operation — expensive, and on a non-thread-safe HashMap it can even cause other threads to see inconsistent state (a classic reason to use ConcurrentHashMap in multi-threaded code, or in rare cases even an infinite loop pre-Java 8).`,
        code: `DEFAULT_INITIAL_CAPACITY = 16
DEFAULT_LOAD_FACTOR      = 0.75f
TREEIFY_THRESHOLD        = 8    // linked list -> red-black tree (per bucket)
UNTREEIFY_THRESHOLD      = 6    // tree -> linked list (on removal)
MIN_TREEIFY_CAPACITY     = 64   // only treeify if TOTAL table capacity >= 64

// Why rehashing is expensive:
// - allocates a brand-new backing array
// - recomputes bucket index for every single entry
// - O(n) time complexity
// - not atomic -> unsafe to do concurrently without external sync / ConcurrentHashMap`
      },
      {
        n: "TreeMap -> Red-Black Tree — the 3-layer WHY answer",
        tag: "TREEMAP",
        desc: `The pattern that broke down in interviews: interviewer keeps drilling "why" after your first answer. Fix: always go 3 layers deep yourself, before they ask.

LAYER 1 (what): TreeMap stores keys internally in a red-black tree.
LAYER 2 (why a balanced tree at all): TreeMap must keep keys SORTED at all times and do get/put/remove in O(log n). A plain sorted array gives O(1) read but O(n) insert. A plain BST gives O(log n) average but degenerates to O(n) worst case (e.g. inserting 1,2,3,4,5 in order creates a straight line — a de facto linked list).
LAYER 3 (why red-black specifically, not AVL): AVL trees are strictly balanced (height diff <= 1) giving faster reads, but need MORE rotations on insert/delete to maintain that strict balance. Red-black trees are loosely balanced (height <= 2*log(n)) — slightly slower reads, but only up to 2 rotations per insert/delete, making them better for write-heavy maps.

LinkedHashMap handles insertion order by maintaining an additional doubly-linked list threading through all entries (each Entry has "before"/"after" pointers on top of the normal HashMap bucket structure) — iteration follows that linked list instead of bucket order. Passing accessOrder=true to the constructor switches it to LRU (access) order instead of insertion order.`,
        code: `// AVL Tree
// - Strictly balanced (|heightL - heightR| <= 1) -> faster reads
// - MORE rotations on insert/delete (aggressive rebalancing)

// Red-Black Tree
// - Loosely balanced (height <= 2*log(n)) -> slightly slower reads
// - FEWER rotations on insert/delete (max 2 per op) -> better for write-heavy maps

// LinkedHashMap internals
// - extends HashMap, adds "before"/"after" pointers to each Entry
// - maintains a separate doubly linked list across all entries
// - default: iteration order = insertion order
// - new LinkedHashMap<>(16, 0.75f, true) -> accessOrder=true -> LRU order
//   (used to build LRU caches by overriding removeEldestEntry())`
      },
      {
        n: "shallow copy vs deep copy, and String.clone()",
        tag: "MEMORY",
        desc: `SHALLOW COPY: copies the object's field values as-is. For reference-type fields, the new object still points to the SAME underlying objects as the original — mutating a nested object through the copy affects the original too.
DEEP COPY: recursively copies every referenced object as well, so the copy is fully independent.

Object.clone() by default does a SHALLOW copy (field-by-field bitwise copy). To get a deep copy you must override clone() and explicitly clone mutable fields, or use copy constructors / serialization / a library.

STRING.CLONE() TRAP: String does NOT override clone() and does NOT implement Cloneable — calling reflectively would throw CloneNotSupportedException. In practice this question is really testing that you know Strings are immutable, so "cloning" one is meaningless — you just reuse the same reference (or new String(s) makes a new object, which is rarely needed).`,
        code: `class Address { String city; }
class Employee implements Cloneable {
    String name;
    Address address;              // reference type

    @Override
    protected Object clone() throws CloneNotSupportedException {
        Employee shallow = (Employee) super.clone(); // default: shallow
        return shallow;   // shallow.address === this.address (SAME object!)
    }

    protected Employee deepClone() {
        Employee copy = new Employee();
        copy.name = this.name;
        copy.address = new Address();
        copy.address.city = this.address.city;   // independent copy
        return copy;
    }
}

// String has no meaningful clone() — Strings are immutable
String s = "abc";
String s2 = s;         // same reference, totally fine — immutability makes this safe
String s3 = new String(s); // new object, rarely needed`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Streams & Collectors",
    icon: "≈",
    color: "#3B82F6",
    desc: "Intermediate vs terminal stream operations, the full Collectors toolkit, and the Collector vs Collectors class-vs-interface distinction.",
    topics: [
      {
        n: "Intermediate vs Terminal stream operations",
        tag: "STREAMS",
        desc: `INTERMEDIATE operations are lazy and return a new Stream — nothing executes until a terminal op is called: filter, map, flatMap, distinct, sorted, peek, limit, skip.
TERMINAL operations trigger execution and produce a result or side effect, and close the stream: forEach, collect, reduce, count, anyMatch/allMatch/noneMatch, findFirst/findAny, toArray, min/max.

Streams can only be consumed ONCE — calling a terminal op twice on the same stream throws IllegalStateException.`,
        code: `list.stream()
    .filter(n -> n > 0)          // intermediate
    .map(n -> n * 2)             // intermediate
    .distinct()                  // intermediate
    .sorted()                    // intermediate
    .limit(5)                    // intermediate
    .collect(Collectors.toList()); // terminal — triggers execution

// Terminal ops
list.stream().count();
list.stream().anyMatch(n -> n > 10);
list.stream().reduce(0, Integer::sum);
list.stream().findFirst();
list.stream().forEach(System.out::println);

Stream<Integer> s = list.stream();
s.count();
s.count();  // ❌ IllegalStateException: stream has already been operated upon or closed`
      },
      {
        n: "Every Collectors sub-method you need",
        tag: "COLLECTORS",
        desc: `Collectors is a final CLASS (not an interface) full of static factory methods that each return a Collector. Collector (no 's') IS an interface with 5 methods: supplier(), accumulator(), combiner(), finisher(), characteristics().

Collectors.toList() / toSet() / toMap(keyFn, valFn) — basic collection.
Collectors.joining(", ", "[", "]") — string concatenation with delimiter/prefix/suffix.
Collectors.groupingBy(classifier) / groupingBy(classifier, downstream) — group into a Map<K, List<T>> or apply a downstream collector per group.
Collectors.partitioningBy(predicate) — splits into Map<Boolean, List<T>>.
Collectors.counting() / summingInt() / averagingDouble() / summarizingInt() — aggregation, usually used as a downstream collector inside groupingBy.
Collectors.mapping(mapper, downstream) — transform each element before applying a downstream collector.
Collectors.collectingAndThen(collector, finisher) — apply a final transform after collecting (e.g. wrap in Optional, make immutable).
Collectors.reducing(...) — generalized reduce as a Collector.`,
        code: `// groupingBy + downstream combos
Map<String, List<Employee>> byDept =
    employees.stream().collect(Collectors.groupingBy(Employee::getDepartment));

Map<String, Long> countByDept =
    employees.stream().collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));

Map<String, Double> avgSalaryByDept =
    employees.stream().collect(Collectors.groupingBy(Employee::getDepartment, Collectors.averagingDouble(Employee::getSalary)));

Map<Boolean, List<Employee>> highLowPaid =
    employees.stream().collect(Collectors.partitioningBy(e -> e.getSalary() > 50000));

String names = employees.stream().map(Employee::getName)
    .collect(Collectors.joining(", ", "[", "]"));

// mapping — group by age, collect employee IDs per age group
Map<Integer, List<Integer>> idsByAge = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getAge,
        Collectors.mapping(Employee::getId, Collectors.toList())
    ));

// BUG interviewers plant: ArrayList<Integer>::new is a Supplier, NOT a Collector
// Collectors.mapping(Employee::getId, ArrayList<Integer>::new) // ❌ wrong
Collectors.mapping(Employee::getId, Collectors.toCollection(ArrayList::new)); // ✅

// collectingAndThen — immutable result
List<String> immutable = employees.stream().map(Employee::getName)
    .collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));

// Custom Collector from scratch
Collector<String, StringBuilder, String> customJoiner = Collector.of(
    StringBuilder::new,                       // supplier
    (sb, s) -> sb.append(s).append(", "),     // accumulator
    StringBuilder::append,                     // combiner (parallel streams)
    sb -> "[" + sb + "]"                       // finisher
);`
      },
      {
        n: "Is Collectors a class or interface? (and Collector?)",
        tag: "COLLECTORS",
        desc: `Collectors (with the 's') is a public final CLASS containing ~43 static factory methods — you never instantiate it, you just call Collectors.toList(), Collectors.groupingBy(...), etc.

Collector<T, A, R> (no 's') is a public INTERFACE that defines the actual contract: supplier() creates a mutable result container, accumulator() folds one element into it, combiner() merges two containers (used for parallel streams), finisher() does the final transformation, and characteristics() hints (CONCURRENT, UNORDERED, IDENTITY_FINISH).

Relationship: Collectors.toList() is a factory method that RETURNS a Collector<T, ?, List<T>> instance.`,
        code: `public final class Collectors {                 // final CLASS
    public static <T> Collector<T,?,List<T>> toList() { ... }
    public static <T,K> Collector<T,?,Map<K,List<T>>> groupingBy(...) { ... }
    // ~43 total factory methods
}

public interface Collector<T, A, R> {            // INTERFACE — the actual contract
    Supplier<A> supplier();
    BiConsumer<A, T> accumulator();
    BinaryOperator<A> combiner();
    Function<A, R> finisher();
    Set<Characteristics> characteristics();
}`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "JVM, GC & Memory",
    icon: "⚙",
    color: "#8B5CF6",
    desc: "Garbage collection algorithms, JVM memory model, tuning flags used in a real production OOM fix.",
    topics: [
      {
        n: "All Java GC algorithms — Serial to ZGC",
        tag: "GC",
        desc: `Object lifecycle: New object -> Eden -> (Minor GC) -> Survivor S0/S1 -> (after N cycles survived) -> Old Gen -> (Major/Full GC).

Serial GC — single thread, full stop-the-world. For tiny/single-core apps.
Parallel GC (Throughput GC) — multiple threads, still stop-the-world, but faster. Default before Java 9. Best for batch/throughput workloads.
CMS (Concurrent Mark Sweep) — deprecated Java 9, removed Java 14. Goal was low pause times via concurrent marking/sweeping, but suffered heap fragmentation (no compaction) leading to eventual Full GC.
G1GC (Garbage First) — default since Java 9. Divides heap into ~2048 equal-sized regions, collects the regions with the most garbage first. Supports a predictable pause-time target via -XX:MaxGCPauseMillis.
ZGC — production ready Java 15+, generational in Java 21. Sub-millisecond pauses REGARDLESS of heap size (even 16TB heaps), using colored pointers and load barriers. Best for latency-critical, large-heap apps.
Shenandoah GC — OpenJDK only, similar sub-ms pauses to ZGC using a Brooks forwarding pointer.`,
        code: `-XX:+UseSerialGC      // tiny/single-core apps, long pause, low throughput
-XX:+UseParallelGC    // batch jobs, highest throughput, medium pause
-XX:+UseConcMarkSweepGC  // deprecated — short pause but fragmentation issues
-XX:+UseG1GC          // DEFAULT (Java 9+) — predictable pause, good for most server apps
-XX:+UseZGC           // Java 15+ — sub-ms pause, large heap, low latency
-XX:+UseShenandoahGC  // OpenJDK only — sub-ms pause, low latency

// Real production tuning flags (GPGR OOM fix)
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m
-Xms4g -Xmx8g
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/logs/heap.hprof
-Xlog:gc*:file=/logs/gc.log`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Concurrency & Multithreading",
    icon: "⇄",
    color: "#06B6D4",
    desc: "Atomic vs volatile, ThreadLocal, ExecutorService, and Python's GIL for comparison.",
    topics: [
      {
        n: "Atomic vs Volatile",
        tag: "CONCURRENCY",
        desc: `volatile guarantees VISIBILITY ONLY — every read sees the most recently written value across threads (no CPU-cache staleness), and it prevents instruction reordering around it. It does NOT guarantee atomicity: "count++" on a volatile int is still a read-modify-write with a race condition.

Atomic classes (AtomicInteger, AtomicLong, AtomicReference, etc.) guarantee BOTH visibility AND atomicity, implemented using CAS (Compare-And-Swap) hardware instructions rather than locks — making them lock-free and generally faster than synchronized for simple counters.

One-line interview answer: "volatile guarantees visibility, atomic guarantees visibility AND atomicity using CAS."`,
        code: `volatile boolean running = true;   // visible across threads instantly
// but:
volatile int count = 0;
count++;  // ❌ NOT atomic — read, increment, write are 3 separate steps

AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();     // ✅ atomic — CAS loop under the hood

// ThreadLocal — per-thread isolated storage
ThreadLocal<SimpleDateFormat> formatter =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
// each thread gets its OWN instance — no sharing, no synchronization needed
formatter.get().format(new Date());
formatter.remove();  // IMPORTANT in thread-pools to avoid memory leaks

// ExecutorService — is a framework of interfaces, not a single class
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> 42);
pool.shutdown();`
      },
      {
        n: "Python GIL (for comparison in polyglot interviews)",
        tag: "PYTHON",
        desc: `The GIL (Global Interpreter Lock) is a mutex that allows only ONE thread to execute Python bytecode at a time — even on multi-core machines. It exists because CPython uses reference counting for memory management; without the GIL, two threads incrementing/decrementing the same object's ref count could corrupt it.

IMPACT: CPU-bound tasks get NO real speedup from threading (GIL prevents true parallelism) — use multiprocessing instead (separate processes, each with its own GIL). IO-bound tasks DO benefit from threading because the GIL is released during IO waits — or use asyncio for the most efficient single-threaded concurrency.

Python 3.13+ ships an experimental --disable-gil build (PEP 703) enabling true multi-threaded Python via per-object locking.`,
        code: `# CPU-bound -> use multiprocessing (separate GIL per process)
from multiprocessing import Pool
def compute(n): return sum(i*i for i in range(n))
with Pool(4) as pool:
    results = pool.map(compute, [1_000_000]*4)   # true parallelism, 4 cores

# IO-bound -> threading works fine (GIL released during IO wait)
import threading, requests
def fetch(url): return requests.get(url).text
threads = [threading.Thread(target=fetch, args=(u,)) for u in urls]

# IO-bound -> asyncio is most efficient (single thread, event loop)
import asyncio, aiohttp
async def fetch(session, url):
    async with session.get(url) as resp: return await resp.text()`
      },
      {
        n: "Python Iterator, __iter__ / __next__, generators",
        tag: "PYTHON",
        desc: `An ITERABLE has __iter__() which returns an ITERATOR. An ITERATOR has __next__() which returns the next value and raises StopIteration when exhausted. A list is iterable but is NOT itself an iterator — iter(list) creates one.

A generator (using yield) is the easy way to build an iterator without manually writing a class — the function pauses at yield, returns a value, and resumes from that point on the next next() call.`,
        code: `nums = [1, 2, 3]
it = iter(nums)          # calls nums.__iter__()
next(it)                 # calls it.__next__() -> 1
next(it)                 # -> 2
next(it)                 # -> 3
next(it)                 # -> StopIteration!

class CountDown:
    def __init__(self, start): self.current = start
    def __iter__(self): return self
    def __next__(self):
        if self.current <= 0: raise StopIteration
        value = self.current; self.current -= 1
        return value

def count_down(start):          # generator — lazy iterator
    while start > 0:
        yield start
        start -= 1

# what "for" does internally:
it = iter(iterable)
while True:
    try: item = next(it)
    except StopIteration: break`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Clean Code & Design Patterns",
    icon: "◈",
    color: "#EC4899",
    desc: "God class, singleton controversy, generics vs Object, DTOs, and the N+1 problem.",
    topics: [
      {
        n: "God Class / God Object anti-pattern",
        tag: "DESIGN",
        desc: `A God Class is a class that knows/does too much — violates Single Responsibility Principle by mixing business logic, data access, validation, and orchestration all in one place. Symptoms: huge line count, many unrelated fields, methods that don't use most of the class's fields, and a class that every other class seems to depend on.

FIX: extract responsibilities into focused collaborator classes (Service, Repository, Validator, Mapper) and have the God Class delegate. When refactoring a LEGACY god class, do it incrementally: write characterization tests first (lock in current behavior), then extract one responsibility at a time behind an interface, verifying tests pass after each extraction — never a big-bang rewrite.`,
        code: `// ❌ God class — does everything
class OrderManager {
    void validateOrder() {}
    void calculateTax() {}
    void saveToDatabase() {}
    void sendEmail() {}
    void generateInvoicePdf() {}
    void applyDiscountRules() {}
    // 2000+ lines, 40 fields...
}

// ✅ Refactored — single responsibility each
class OrderValidator { void validate(Order o) {} }
class TaxCalculator { BigDecimal calculate(Order o) { return null; } }
class OrderRepository { void save(Order o) {} }
class InvoiceGenerator { byte[] generatePdf(Order o) { return null; } }
class NotificationService { void sendConfirmation(Order o) {} }

class OrderService {   // orchestrates, doesn't implement details
    OrderValidator validator; TaxCalculator tax; OrderRepository repo;
    void placeOrder(Order o) {
        validator.validate(o);
        o.setTax(tax.calculate(o));
        repo.save(o);
    }
}`
      },
      {
        n: "Why Singleton is a controversial pattern; avoid Object + typecasting",
        tag: "DESIGN",
        desc: `Some argue Singleton isn't a "proper" design pattern but a workaround for global state — it introduces hidden dependencies (any class can silently call getInstance() instead of declaring the dependency explicitly), makes unit testing hard (can't easily swap in a mock, especially with a private constructor + static instance), and can misbehave with classloaders/reflection/serialization unless carefully guarded.

Avoid typecasting to Object and using raw types — before generics (Java 5), collections stored Object, forcing an explicit, unsafe cast at every read (ClassCastException risk at runtime, invisible to the compiler). Generics push that type check to compile time instead — always prefer List<Employee> over a raw List with casts.`,
        code: `// ❌ Classic Singleton — hard to test, hidden dependency
class ConfigManager {
    private static ConfigManager instance;
    private ConfigManager() {}
    public static ConfigManager getInstance() {
        if (instance == null) instance = new ConfigManager();
        return instance;
    }
}
// Any class can call ConfigManager.getInstance() with no visible dependency

// ✅ Prefer dependency injection — explicit, testable
class OrderService {
    private final ConfigManager config; // injected, mockable in tests
    OrderService(ConfigManager config) { this.config = config; }
}

// ❌ Raw type + cast — unsafe, runtime ClassCastException risk
List list = new ArrayList();
list.add("hello");
Integer x = (Integer) list.get(0); // compiles fine, blows up at runtime

// ✅ Generics — compiler catches the mismatch
List<String> list2 = new ArrayList<>();
list2.add("hello");
// Integer x2 = list2.get(0); // won't even compile`
      },
      {
        n: "DTOs vs Domain models, and the N+1 problem",
        tag: "ARCH",
        desc: `DTOs (Data Transfer Objects) are plain, flat objects used purely to move data across a boundary (API request/response, service layer) — no business logic, no lazy-loaded associations, decoupled from the persistence schema so internal DB changes don't break API contracts, and they let you shape exactly the fields a client needs (avoiding over/under-fetching).

Domain model classes carry business logic and JPA/Hibernate relationships (lazy associations, cascades) — exposing them directly over an API risks leaking internal structure, triggering unwanted lazy loads (which cause N+1 queries), and tightly coupling your API to your database schema.

N+1 PROBLEM: fetching a list of N parent entities, then lazily loading a related collection for each one triggers 1 query for the parents + N additional queries (one per parent) instead of a single JOIN — a classic ORM performance bug. Fix with JOIN FETCH, @EntityGraph, or batch fetching.`,
        code: `// ❌ N+1 problem
List<Department> depts = departmentRepo.findAll();   // 1 query
for (Department d : depts) {
    d.getEmployees().size();                          // N additional lazy queries!
}

// ✅ Fix with JOIN FETCH
@Query("SELECT d FROM Department d JOIN FETCH d.employees")
List<Department> findAllWithEmployees();               // 1 query total

// DTO — flat, no lazy associations, shaped for the client
public record EmployeeDto(Long id, String name, String department) {}

// Domain entity — has JPA relationships, business logic
@Entity
class Employee {
    @Id Long id;
    String name;
    @ManyToOne(fetch = FetchType.LAZY) Department department;
    void promote() { /* business logic lives here, not on the DTO */ }
}`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "DSA — Palindromes & Core Patterns",
    icon: "◐",
    color: "#F97316",
    desc: "Longest palindromic substring (3 versions), plus why iterators exist instead of recursive get().",
    topics: [
      {
        n: "\"Is there another way?\" — Manacher's Algorithm O(n)",
        tag: "DSA",
        desc: `When asked for a faster alternative to Expand-Around-Center (O(n²)), the answer is Manacher's Algorithm — O(n) time. It avoids re-checking characters by reusing information from previously computed palindromes via symmetry around a "center."

Core trick: transform the string by inserting a separator (e.g. '#') between every character (and at both ends) so odd/even-length palindromes are handled uniformly as odd-length ones. Then maintain an array P where P[i] = radius of the palindrome centered at i, plus the current rightmost palindrome boundary (center C, right edge R). For each new position, if it's inside the current right boundary, initialize its radius using its mirror position instead of starting from 0 — this is what makes it O(n) instead of O(n²).

Interview-practical note: Expand-Around-Center is usually sufficient and much easier to write correctly under pressure; Manacher's is the answer to "can you do better than O(n²)?" but is rarely required to be coded from scratch live.`,
        code: `public String longestPalindromeManacher(String s) {
    // Transform: "abc" -> "^#a#b#c#$" (sentinels avoid bounds checks)
    StringBuilder sb = new StringBuilder("^");
    for (char c : s.toCharArray()) sb.append('#').append(c);
    sb.append("#$");
    String t = sb.toString();

    int n = t.length();
    int[] p = new int[n];
    int center = 0, right = 0;

    for (int i = 1; i < n - 1; i++) {
        if (i < right) {
            p[i] = Math.min(right - i, p[2 * center - i]); // reuse mirror info
        }
        while (t.charAt(i + p[i] + 1) == t.charAt(i - p[i] - 1)) {
            p[i]++;                                          // expand
        }
        if (i + p[i] > right) {                              // update boundary
            center = i;
            right = i + p[i];
        }
    }

    int maxLen = 0, centerIndex = 0;
    for (int i = 1; i < n - 1; i++) {
        if (p[i] > maxLen) { maxLen = p[i]; centerIndex = i; }
    }
    int start = (centerIndex - maxLen) / 2; // map back to original string index
    return s.substring(start, start + maxLen);
}
// Time: O(n) — each character visited a constant number of times overall
// Space: O(n) for the transformed string and P array`
      },
      {
        n: "Longest Palindromic Substring — Expand Around Center O(n²)",
        tag: "DSA",
        desc: `"babad" -> "bab" or "aba". "cbbd" -> "bb". Approach: for every index, expand outward in both directions checking for an odd-length palindrome (center = i) and an even-length one (center = i, i+1); track the longest found. O(n²) time, O(1) space — no extra data structures needed, simpler to code live than Manacher's O(n) algorithm.`,
        code: `public String longestPalindrome(String s) {
    if (s == null || s.length() < 2) return s;
    int start = 0, maxLen = 1;
    for (int i = 0; i < s.length(); i++) {
        int len1 = expand(s, i, i);       // odd length, center at i
        int len2 = expand(s, i, i + 1);   // even length, center between i, i+1
        int len = Math.max(len1, len2);
        if (len > maxLen) {
            maxLen = len;
            start = i - (len - 1) / 2;
        }
    }
    return s.substring(start, start + maxLen);
}
private int expand(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--; right++;
    }
    return right - left - 1;
}
// Trace "babad": i=1 expand('a','a')->1 then expand('b','b')->3 => "bab"`
      },
      {
        n: "Check if a string IS a palindrome — two-pointer",
        tag: "DSA",
        desc: `Simpler variant: just verify the whole string reads the same forwards and backwards. Two-pointer approach is O(n) time O(1) space and is the expected answer; a StringBuilder.reverse() one-liner works too but allocates extra memory.`,
        code: `public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++; right--;
    }
    return true;
}

// One-liner alternative (allocates a new String)
public boolean isPalindromeStream(String s) {
    return s.equals(new StringBuilder(s).reverse().toString());
}`
      },
      {
        n: "Longest palindrome BUILDABLE from characters (LeetCode 409)",
        tag: "DSA",
        desc: `Different question: given "abccccdd", what's the longest palindrome you could BUILD (any arrangement) using those characters? Answer = 7 (e.g. "dccaccd"). Approach: count character frequencies; use every complete PAIR (count/2 * 2 contributes to length); if any character has an odd leftover count, add 1 for a single center character.`,
        code: `public int longestPalindrome(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

    int length = 0;
    boolean hasOdd = false;
    for (int count : freq.values()) {
        length += (count / 2) * 2;      // use even pairs
        if (count % 2 == 1) hasOdd = true;
    }
    return hasOdd ? length + 1 : length; // +1 for a single center char
}
// "abccccdd" -> c:4, d:2, a:1, b:1 -> pairs give 6, hasOdd=true -> 7`
      },
      {
        n: "Definition of atomicity in Java",
        tag: "CONCURRENCY",
        desc: `ATOMICITY means an operation executes as a single, indivisible unit — from the perspective of any other thread, it either appears to have completed entirely or not have started at all. There is no possible intermediate state a concurrent thread could observe.

A single "count++" is actually 3 separate steps (read count, add 1, write count back) — NOT atomic, so two threads interleaving those steps can lose an update (a race condition). By contrast, a single plain assignment like "x = 5" IS atomic for most primitive types (except long/double on some older 32-bit JVMs, which can tear into two 32-bit writes unless declared volatile).

In Java, true atomicity for compound operations (increment, compare-then-set, etc.) is achieved either with synchronized/locks (mutual exclusion — only one thread in the critical section at a time) or with the java.util.concurrent.atomic classes, which use lock-free CAS (Compare-And-Swap) hardware instructions instead.`,
        code: `// NOT atomic — 3 separate steps, race condition possible
int count = 0;
count++;   // 1. read count  2. add 1  3. write count back

// Atomic via synchronized — mutual exclusion (only 1 thread at a time)
synchronized (lock) {
    count++;
}

// Atomic via java.util.concurrent.atomic — lock-free CAS
AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();  // atomic: compare-and-swap loop internally

// CAS pseudocode (what incrementAndGet does under the hood):
// do {
//     int oldValue = currentValue;
//     int newValue = oldValue + 1;
// } while (!compareAndSwap(currentValue, oldValue, newValue)); // hardware instruction`
      },
      {
        n: "How Iterator actually works — fail-fast internals (modCount)",
        tag: "DSA",
        desc: `Going one level deeper than "iterator has hasNext()/next()": fail-fast collections (ArrayList, HashMap, etc.) maintain an internal counter called modCount, incremented every time the collection is structurally modified (add/remove — NOT a simple set(index, value) which doesn't change size).

When you call collection.iterator(), the returned Iterator snapshots the current modCount into its own expectedModCount field. On every call to next() (and remove()), the iterator checks if modCount != expectedModCount — if they differ, it throws ConcurrentModificationException immediately, because the collection changed underneath it in a way the iterator didn't cause itself.

Calling iterator.remove() is safe because it updates BOTH modCount and expectedModCount together, keeping them in sync — this is why "removing while iterating" must go through the iterator's own remove(), never the collection's.`,
        code: `List<String> list = new ArrayList<>(List.of("a", "b", "c"));
Iterator<String> it = list.iterator();   // snapshots expectedModCount = modCount

list.add("d");                            // modCount incremented, expectedModCount stale

it.next();  // ❌ throws ConcurrentModificationException
            // because modCount (now 1) != expectedModCount (still 0)

// Safe removal — goes through the iterator itself
Iterator<String> it2 = list.iterator();
while (it2.hasNext()) {
    String val = it2.next();
    if (val.equals("b")) {
        it2.remove();  // ✅ updates modCount AND expectedModCount together
    }
}

// Simplified internal check inside ArrayList.Itr.next():
// final void checkForComodification() {
//     if (modCount != expectedModCount) throw new ConcurrentModificationException();
// }`
      },
      {
        n: "Why iterators instead of a recursive get(i) method?",
        tag: "DSA",
        desc: `A recursive/indexed get(i) approach requires random access — fine for an ArrayList (O(1) index access) but O(n) PER CALL on a LinkedList, making a full traversal O(n²) overall. It also only works for structures that support indexing at all (a plain Set or a HashMap has no meaningful index).

An Iterator provides a UNIFORM way to traverse ANY collection (List, Set, Map.entrySet(), a custom data structure) in O(1) per step regardless of the underlying structure, without exposing its internal representation (encapsulation) — and it enables the fail-fast/fail-safe mechanisms that detect concurrent modification during iteration.`,
        code: `// ❌ Recursive get(i) — O(n) PER call on LinkedList -> O(n²) total traversal
for (int i = 0; i < linkedList.size(); i++) {
    linkedList.get(i);   // walks from head every time!
}

// ✅ Iterator — O(1) per step regardless of structure, works uniformly
Iterator<String> it = linkedList.iterator();
while (it.hasNext()) {
    String val = it.next();          // O(1) — just follows the "next" pointer
}

// Fail-fast (ArrayList, HashMap) — throws ConcurrentModificationException
// if the collection is structurally modified during iteration (except via
// the iterator's own remove()).
// Fail-safe (CopyOnWriteArrayList, ConcurrentHashMap) — iterates over a
// snapshot/clone, never throws CME, but may not reflect the latest writes.`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Testing — JUnit 5 & Mockito",
    icon: "✓",
    color: "#10B981",
    desc: "Full annotation list, test lifecycle order, assertions, and @Mock vs @Spy vs @InjectMocks.",
    topics: [
      {
        n: "JUnit 5 annotations & test lifecycle order",
        tag: "JUNIT",
        desc: `Lifecycle order per test class: @BeforeAll (once, static) -> for each test: @BeforeEach -> @Test -> @AfterEach -> then @AfterAll (once, static) after all tests finish.

Use @TestInstance(Lifecycle.PER_CLASS) to allow @BeforeAll/@AfterAll to be non-static and to share state across tests in the same class (default is PER_METHOD — a fresh instance per test).`,
        code: `@Test                 // marks a test method
@BeforeEach           // before EACH test (was @Before in JUnit 4)
@AfterEach            // after EACH test (was @After)
@BeforeAll            // ONCE before all tests — must be static by default
@AfterAll             // ONCE after all tests — must be static by default
@Disabled("reason")   // skip this test
@DisplayName("...")   // human-readable test name
@Nested                // nested test class for grouping
@Tag("integration")   // tag for filtering test runs
@ParameterizedTest
@ValueSource(ints = {1, 2, 3})
@CsvSource({"1,one", "2,two"})
@MethodSource("provideArgs")
@RepeatedTest(5)      // run same test 5 times

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TicketServiceTest {
    @BeforeAll static void setupAll() { /* start DB, once */ }
    @BeforeEach void setup() { /* reset mocks, before each */ }
    @Test @DisplayName("Should close ticket when KPIs are low")
    void shouldCloseTicket() { /* ... */ }
    @AfterEach void teardown() { /* cleanup, after each */ }
    @AfterAll static void teardownAll() { /* close DB, once */ }
}`
      },
      {
        n: "Assertions, Mockito @Mock vs @Spy vs @InjectMocks",
        tag: "MOCKITO",
        desc: `@Mock creates a full fake object — every method returns a default (null/0/false) unless explicitly stubbed with when(...).thenReturn(...).
@Spy wraps a REAL object — real methods run unless you explicitly override one with doReturn(...).when(spy).method().
@InjectMocks creates a REAL instance of the class under test and injects the @Mock/@Spy fields into it (via constructor or field injection).
@Captor captures the actual argument passed into a mocked method call, so you can assert on it after the fact.`,
        code: `assertEquals(expected, actual);
assertThrows(TicketNotFoundException.class, () -> ticketService.getTicket("BAD_ID"));
assertAll("ticket properties",
    () -> assertEquals("OPEN", ticket.getStatus()),
    () -> assertNotNull(ticket.getId())
);
assertTimeout(Duration.ofSeconds(2), () -> heavyOperation());

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {
    @Mock TicketRepository ticketRepo;
    @Mock NotificationService notificationService;
    @InjectMocks TicketService ticketService;
    @Captor ArgumentCaptor<Ticket> ticketCaptor;

    @Test
    void shouldAutoCloseTicket() {
        Ticket ticket = new Ticket("T001", "OPEN", "LOW");
        when(ticketRepo.findById("T001")).thenReturn(Optional.of(ticket));

        ticketService.autoClose("T001");

        verify(ticketRepo).save(ticketCaptor.capture());
        assertEquals("CLOSED", ticketCaptor.getValue().getStatus());
        verify(notificationService, never()).escalate(any());
        verify(ticketRepo, times(1)).findById("T001");
    }
}

// Mock vs Spy
@Mock TicketRepo repo;                          // all methods fake by default
when(repo.findAll()).thenReturn(list);           // must stub everything used

@Spy TicketRepo repo = new TicketRepoImpl();     // real object underneath
doReturn(list).when(repo).findAll();             // override only this method`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Senior Java — L2 Scenario & Coding Questions",
    icon: "◆",
    color: "#DC2626",
    desc: "The 'goes beyond definitions' questions from a Senior SWE L2 round — Spring internals traps and from-scratch coding asks.",
    topics: [
      {
        n: "@Transactional self-invocation trap — why it silently fails",
        tag: "SPRING",
        desc: `Classic L2 trap: a class has two @Transactional methods, and one calls the other directly (this.otherMethod()) from within the same class. The inner call's @Transactional annotation is SILENTLY IGNORED — no exception, no error, it just doesn't get transactional behavior.

WHY: Spring's declarative transactions work via AOP PROXIES. When the bean is created, Spring wraps it in a proxy object. External callers go through the proxy, which intercepts the call and starts/commits the transaction. But a call like this.otherMethod() from INSIDE the same object bypasses the proxy entirely — it's a plain Java method call on "this", not on the proxy — so the transactional interceptor never runs.

FIX OPTIONS: (1) move the inner method to a separate @Service bean and inject/call it through that bean (goes through its own proxy). (2) Self-inject the proxy: autowire the class's own interface/self reference and call through that. (3) Use AopContext.currentProxy() (requires exposeProxy=true) to grab the proxy explicitly. Option 1 (extract to a separate bean) is generally the cleanest.`,
        code: `@Service
class OrderService {
    @Transactional
    public void placeOrder(Order o) {
        // ...
        updateInventory(o);   // ❌ calls "this" directly — proxy bypassed!
    }

    @Transactional              // this annotation is SILENTLY IGNORED here
    public void updateInventory(Order o) { /* ... */ }
}

// ✅ FIX 1 — extract to a separate bean, call through its proxy
@Service
class OrderService {
    @Autowired InventoryService inventoryService;

    @Transactional
    public void placeOrder(Order o) {
        inventoryService.updateInventory(o); // goes through InventoryService's own proxy
    }
}
@Service
class InventoryService {
    @Transactional
    public void updateInventory(Order o) { /* ... */ }
}

// ✅ FIX 2 — self-injection through Spring's proxy
@Service
class OrderService {
    @Autowired @Lazy OrderService self;  // injected proxy of itself

    @Transactional
    public void placeOrder(Order o) {
        self.updateInventory(o);          // goes through the proxy correctly
    }
    @Transactional
    public void updateInventory(Order o) { /* ... */ }
}`
      },
      {
        n: "Circuit breaker — implement, set thresholds, and test it",
        tag: "ARCH",
        desc: `L2-style scenario: "your service calls a downstream at 1000 req/sec, it starts failing at 200ms — implement a circuit breaker." Three states: CLOSED (normal, requests pass through, failures counted), OPEN (after failure threshold exceeded, requests fail immediately without calling downstream — protects the failing service from being hammered further and fails fast for the caller), HALF_OPEN (after a wait duration, allow a few trial requests through; if they succeed, go back to CLOSED, if they fail, go back to OPEN).

THRESHOLDS to discuss: failure rate threshold (e.g. 50% of last 20 calls failed), slow-call threshold (e.g. calls over 200ms count as failures too, not just exceptions), wait duration in OPEN state before trying HALF_OPEN (e.g. 30s), and how many trial calls to allow in HALF_OPEN.

TESTING: unit test each state transition directly (force failures, assert OPEN; wait/advance a clock, assert HALF_OPEN; force a success, assert back to CLOSED). In practice you'd use Resilience4j's CircuitBreaker rather than hand-rolling this in production, but interviewers want to see you understand the state machine.`,
        code: `class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private State state = State.CLOSED;
    private int failureCount = 0;
    private final int failureThreshold = 5;
    private long lastFailureTime;
    private final long waitDurationMs = 30_000;

    synchronized boolean allowRequest() {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - lastFailureTime > waitDurationMs) {
                state = State.HALF_OPEN;   // trial period begins
                return true;
            }
            return false;                   // fail fast — don't call downstream
        }
        return true;                        // CLOSED or HALF_OPEN trial call
    }

    synchronized void recordSuccess() {
        failureCount = 0;
        state = State.CLOSED;
    }

    synchronized void recordFailure() {
        failureCount++;
        lastFailureTime = System.currentTimeMillis();
        if (failureCount >= failureThreshold || state == State.HALF_OPEN) {
            state = State.OPEN;
        }
    }
}

// Usage
if (breaker.allowRequest()) {
    try {
        callDownstream();
        breaker.recordSuccess();
    } catch (Exception e) {
        breaker.recordFailure();
        throw e;
    }
} else {
    throw new CircuitOpenException("Downstream unavailable, failing fast");
}

// Production: use Resilience4j instead of hand-rolling this
// CircuitBreakerConfig config = CircuitBreakerConfig.custom()
//     .failureRateThreshold(50)
//     .slowCallDurationThreshold(Duration.ofMillis(200))
//     .waitDurationInOpenState(Duration.ofSeconds(30))
//     .build();`
      },
      {
        n: "LRU Cache — implement from scratch",
        tag: "DSA",
        desc: `A very common senior-level coding question: implement a Least-Recently-Used cache with O(1) get and put. The standard solution combines a HashMap (for O(1) key lookup) with a doubly-linked list (to track recency order in O(1) — move-to-front on access, evict-from-tail on overflow).

Java shortcut: LinkedHashMap already does this internally if constructed with accessOrder=true — override removeEldestEntry() to auto-evict. Interviewers usually want the from-scratch doubly-linked-list version to prove you understand WHY it's O(1) (no shifting, no O(n) list traversal), not just that you know the LinkedHashMap shortcut exists.`,
        code: `// From-scratch version — HashMap + doubly linked list, true O(1)
class LRUCache {
    class Node { int key, value; Node prev, next; Node(int k, int v){key=k;value=v;} }

    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0); // sentinels

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    private void remove(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void insertAtFront(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node n = map.get(key);
        remove(n);
        insertAtFront(n);           // mark as most recently used
        return n.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) remove(map.get(key));
        else if (map.size() == capacity) {
            Node lru = tail.prev;    // evict least recently used (tail)
            remove(lru);
            map.remove(lru.key);
        }
        Node n = new Node(key, value);
        insertAtFront(n);
        map.put(key, n);
    }
}

// Java shortcut — LinkedHashMap with accessOrder=true
class LRUCacheSimple<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LRUCacheSimple(int capacity) {
        super(capacity, 0.75f, true);  // true = access-order, not insertion-order
        this.capacity = capacity;
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;       // auto-evict oldest when over capacity
    }
}`
      },
      {
        n: "Retry with exponential backoff — implement from scratch",
        tag: "ARCH",
        desc: `Another common coding ask: retry a failing operation, but don't hammer the downstream immediately — wait progressively longer between attempts (exponential backoff), typically with jitter (randomness) added to avoid multiple clients retrying in lockstep ("thundering herd").

Formula: delay = min(baseDelay * 2^attempt, maxDelay), then add random jitter (e.g. +/- up to 50% of the delay, or "full jitter" = random(0, delay)). Always cap the number of retries and the max delay — unbounded exponential growth is a bug waiting to happen.`,
        code: `int maxRetries = 5;
long baseDelayMs = 100;
long maxDelayMs = 10_000;

for (int attempt = 0; attempt <= maxRetries; attempt++) {
    try {
        return callDownstream();          // success — return immediately
    } catch (RetryableException e) {
        if (attempt == maxRetries) throw e;  // out of retries — propagate

        long exponentialDelay = Math.min(baseDelayMs * (1L << attempt), maxDelayMs);
        long jitter = ThreadLocalRandom.current().nextLong(exponentialDelay + 1); // full jitter
        Thread.sleep(jitter);
        // attempt 0: base ~100ms, attempt 1: ~200ms, attempt 2: ~400ms...
        // jitter prevents many clients retrying at the exact same moment
    }
}

// Spring alternative — @Retryable (spring-retry)
@Retryable(
    retryFor = RetryableException.class,
    maxAttempts = 5,
    backoff = @Backoff(delay = 100, multiplier = 2, maxDelay = 10_000)
)
public String callDownstream() { /* ... */ }`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Core Java Quick-Fire (from chat log)",
    icon: "⚡",
    color: "#A855F7",
    desc: "Rapid-fire questions asked across multiple interview-prep sessions — condensed answers for quick recall.",
    topics: [
      {
        n: "Singleton — implementation, object creation, breaking it",
        tag: "QUICKFIRE",
        desc: `Classic lazy singleton uses a private static instance, a private constructor, and a public static getInstance() that creates the instance on first call. Thread-safety needs either synchronized getInstance(), double-checked locking with a volatile field, or the eager/enum approach.

"What if we bypass 'new'?" — reflection can still call a private constructor via setAccessible(true), breaking the singleton unless the constructor guards against a second call. Deserialization can also create a second instance unless you implement readResolve(). The safest singleton against both is a single-element enum.`,
        code: `class Singleton {
    private static volatile Singleton instance;
    private Singleton() {
        if (instance != null) throw new IllegalStateException("Already instantiated");
    }
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();  // double-checked locking
            }
        }
        return instance;
    }
}

// Safest form — immune to reflection AND serialization
enum SingletonEnum {
    INSTANCE;
    void doWork() {}
}`
      },
      {
        n: "HashMap vs TreeMap",
        tag: "QUICKFIRE",
        desc: `HashMap: backed by a hash table (array of buckets), O(1) average get/put, NO ordering guarantee, allows one null key.
TreeMap: backed by a red-black tree, O(log n) get/put, keeps keys SORTED (natural order or a supplied Comparator), no null keys allowed (NPE on comparison). Use TreeMap when you need range queries (firstKey, headMap, tailMap) or sorted iteration; use HashMap otherwise for raw speed.`,
        code: `Map<String,Integer> hm = new HashMap<>();     // O(1) avg, unordered
Map<String,Integer> tm = new TreeMap<>();     // O(log n), sorted by key
tm.put("b", 2); tm.put("a", 1); tm.put("c", 3);
tm.keySet();  // [a, b, c] — always sorted
((TreeMap<String,Integer>) tm).firstKey();    // "a"`
      },
      {
        n: "MVC, Spring, Spring MVC in one paragraph each",
        tag: "QUICKFIRE",
        desc: `MVC (Model-View-Controller): a design pattern separating data (Model), presentation (View), and request-handling logic (Controller) to decouple business logic from UI.

Spring Framework: a large IoC (Inversion of Control) container / dependency-injection framework for Java that also provides modules for AOP, transactions, data access, and more — the foundation everything else builds on.

Spring MVC: Spring's own MVC implementation for building web applications/REST APIs — a DispatcherServlet routes incoming requests to @Controller/@RestController methods based on @RequestMapping, which return a View name (traditional MVC) or a response body directly (REST, via @ResponseBody / @RestController).`,
        code: `@RestController
@RequestMapping("/api/employees")
class EmployeeController {
    @Autowired EmployeeService service;   // Spring DI

    @GetMapping("/{id}")
    public ResponseEntity<Employee> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}
// Request -> DispatcherServlet -> HandlerMapping -> Controller -> Service -> Repository`
      },
      {
        n: "JWT — what it is, how tokens are generated",
        tag: "QUICKFIRE",
        desc: `JWT (JSON Web Token) is a compact, self-contained token format for securely transmitting claims (user info, permissions, expiry) between parties. Structure: header.payload.signature, each Base64Url-encoded and dot-separated.

GENERATION: the header (algorithm, e.g. HS256) and payload (claims like sub, exp, roles) are Base64Url-encoded, concatenated, then signed with a secret key (HMAC) or a private key (RSA/ECDSA) to produce the signature. The server verifies incoming tokens by recomputing the signature with the same key and comparing.`,
        code: `// Structure: header.payload.signature
// header:  {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"user123","role":"ADMIN","exp":1735689600}
// signature = HMACSHA256(base64(header) + "." + base64(payload), secretKey)

String token = Jwts.builder()
    .setSubject("user123")
    .claim("role", "ADMIN")
    .setExpiration(new Date(System.currentTimeMillis() + 3600_000))
    .signWith(SignatureAlgorithm.HS256, secretKey)
    .compact();`
      },
      {
        n: "sealed classes & records, double to int conversion",
        tag: "QUICKFIRE",
        desc: `sealed (Java 17+): restricts which classes/interfaces may extend/implement a type — declared with "permits", enabling exhaustive pattern matching (compiler knows all subtypes).
record (Java 16+): a concise immutable data carrier — auto-generates constructor, getters, equals(), hashCode(), and toString() from the declared components.

Converting double -> int in Java TRUNCATES (does not round) — (int) 9.99 = 9. Use Math.round() first if you need rounding (note: Math.round(double) returns a long).`,
        code: `sealed interface Shape permits Circle, Square {}
record Circle(double radius) implements Shape {}
record Square(double side) implements Shape {}

double d = 9.99;
int truncated = (int) d;              // 9 — truncates, doesn't round
int rounded = (int) Math.round(d);    // 10 — rounds first, then narrows`
      },
      {
        n: "char[] to Stream, and why there's no 'CharStream'",
        tag: "QUICKFIRE",
        desc: `Java has primitive stream specializations for int, long, and double (IntStream, LongStream, DoubleStream) — but NOT for char. That's because char is only a 16-bit unsigned value with no arithmetic operators of its own; the JVM promotes char to int for almost every operation, so a dedicated CharStream would just duplicate IntStream with extra casting.

To turn a char[] into a stream, go through IntStream (each char becomes its int code point) and map back to Character/String as needed, or convert the array to a String first and use String.chars().`,
        code: `char[] arr = {'a', 'b', 'c'};

// Option 1 — via a String
String s = new String(arr);
s.chars()                                   // IntStream of char codes
 .mapToObj(c -> (char) c)                  // back to Character
 .forEach(System.out::println);

// Option 2 — directly from the array using IntStream.range
IntStream.range(0, arr.length)
    .mapToObj(i -> arr[i])
    .forEach(System.out::println);

// Why no CharStream: char has no dedicated arithmetic ops in the JVM —
// it's widened to int for +, -, comparisons, etc. IntStream already
// covers every use case a CharStream would, so the JDK designers skipped it.`
      },
      {
        n: "ThreadLocal, ExecutorService, Stream — class or interface?",
        tag: "QUICKFIRE",
        desc: `A recurring interview pattern: "is X a class or an interface?" Quick reference for three commonly confused ones:

ThreadLocal — a CONCRETE CLASS (not an interface). You instantiate it directly or via the static factory ThreadLocal.withInitial(supplier). There's no ThreadLocal interface to implement.

ExecutorService — an INTERFACE (extends the simpler Executor interface, which just has execute(Runnable)). You never call "new ExecutorService()" — you get an implementation via the Executors factory class (e.g. Executors.newFixedThreadPool(n) returns a ThreadPoolExecutor, which implements ExecutorService).

Stream<T> — also an INTERFACE. You never instantiate it directly either — you get an implementation from a source like collection.stream(), Stream.of(...), or IntStream.range(...).builder(). The actual implementing classes are internal to the JDK (e.g. ReferencePipeline) and are not meant to be used directly.`,
        code: `// ThreadLocal — CLASS, instantiate directly
ThreadLocal<SimpleDateFormat> tl = new ThreadLocal<>();
ThreadLocal<Integer> tl2 = ThreadLocal.withInitial(() -> 0);

// ExecutorService — INTERFACE, obtained via factory
public interface ExecutorService extends Executor { ... }
ExecutorService pool = Executors.newFixedThreadPool(4); // factory returns an impl

// Stream<T> — INTERFACE, obtained via a source, never "new Stream()"
public interface Stream<T> extends BaseStream<T, Stream<T>> { ... }
Stream<String> s1 = list.stream();          // from a Collection
Stream<Integer> s2 = Stream.of(1, 2, 3);    // from static factory
IntStream s3 = IntStream.range(0, 10);      // primitive specialization`
      },
      {
        n: "MCP, LangChain, Agno — quick agent-framework comparison",
        tag: "QUICKFIRE",
        desc: `MCP (Model Context Protocol): an open protocol (by Anthropic) standardizing HOW an LLM/agent connects to external tools, data sources, and services — like a "USB-C for AI apps," decoupling tool implementations from any specific LLM client.

LangChain: a Python/JS framework for building LLM applications — chains, agents, memory, retrieval (RAG), with a huge ecosystem of integrations; historically criticized for heavy abstraction layers.

Agno (formerly Phidata): a lighter-weight Python framework focused specifically on building autonomous agents with memory, tools, and multi-agent orchestration, generally considered faster and less abstraction-heavy than LangChain for pure agent use cases. Key difference: MCP is a protocol/connectivity standard; LangChain and Agno are application frameworks that can both act as MCP clients.`,
        code: `// MCP — protocol level (pseudo-config)
{
  "mcpServers": {
    "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem"] }
  }
}

# LangChain — heavier abstraction, huge integration ecosystem
from langchain.agents import initialize_agent
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")

# Agno — lighter, agent-first framework
from agno.agent import Agent
agent = Agent(model=OpenAIChat(id="gpt-4o"), tools=[...], instructions="...")`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Copilot, Agentic Workflow & AI Architecture",
    icon: "◉",
    color: "#14B8A6",
    desc: "Working effectively with AI coding assistants — guardrails, skill files, context windows.",
    topics: [
      {
        n: "Restricting Copilot from certain actions (delete/update commands)",
        tag: "AI",
        desc: `You can constrain an AI coding assistant's behavior at a few layers:

1. WORKSPACE/REPO INSTRUCTIONS — a file like .github/copilot-instructions.md (GitHub Copilot) or CLAUDE.md (Claude Code) that states rules in plain language, e.g. "Never run destructive SQL (DELETE/UPDATE/DROP) without explicit confirmation" or "Never modify files outside /src".
2. TOOL/PERMISSION CONFIG — many agentic coding tools let you allow-list or deny-list specific commands/tools (e.g. deny 'rm', 'DROP', 'git push --force') at the client/settings level, enforced outside the model's control — the safest layer since it doesn't rely on the model "remembering" the instruction.
3. PROMPT-LEVEL GUARDRAILS — explicitly stating in your request: "Do not run any DELETE or UPDATE statements, only SELECT" — works but is the weakest layer since it depends on the model following it every time.

Best practice: combine layer 1 (documented policy) with layer 2 (hard technical restriction) rather than relying on prompt wording alone.`,
        code: `# .github/copilot-instructions.md (or CLAUDE.md)
## Database Safety Rules
- NEVER execute DELETE, UPDATE, DROP, or TRUNCATE statements automatically.
- Any destructive SQL must be presented to the user for explicit approval first.
- Only SELECT queries may be run without confirmation.
- Never modify files outside of /src and /tests without asking.

# Client-level permission config (conceptual example)
{
  "allowedTools": ["read_file", "search", "run_tests"],
  "deniedTools": ["execute_sql_write", "delete_file", "force_push"]
}`
      },
      {
        n: "What is a SKILL.md file?",
        tag: "AI",
        desc: `A SKILL.md is a structured markdown file that packages domain-specific "how-to" knowledge for an AI agent — best practices, constraints, and examples for a particular task type (e.g. "how to create a polished Word document in this environment," "how to build an Excel financial model"). Instead of the model guessing conventions from general training data, it reads the skill file FIRST and follows environment-specific rules (available libraries, output paths, formatting quirks) that aren't reliably known otherwise.

Skills are typically organized as a directory with a SKILL.md plus supporting scripts/templates, and an agent scans a list of available skills, opens any that plausibly apply to the current task, and applies that guidance before writing code or files.`,
        code: `my-skill/
├── SKILL.md          # description + trigger conditions + instructions
├── reference.md       # optional deep-dive reference
└── scripts/
    └── helper.py       # optional supporting script

# SKILL.md example structure
---
name: docx
description: Use whenever creating or editing Word documents...
---
## Instructions
1. Always use python-docx, never write raw XML directly.
2. Save output to /mnt/user-data/outputs.
3. Use heading styles, not manually bolded text, for section titles.
`
      },
      {
        n: "Agentic workflow — what it means",
        tag: "AI",
        desc: `An "agentic workflow" is when an AI system doesn't just answer in one shot, but operates in a loop: it can PLAN a multi-step approach, USE TOOLS (search, run code, read/write files, call APIs) to gather information or take actions, OBSERVE the results of those actions, and iterate/self-correct until the task is complete — as opposed to a single prompt-in/text-out exchange.

Typical loop: receive goal -> decide next action (which tool, what input) -> execute tool -> observe result -> decide if goal is met or another step is needed -> repeat -> produce final result. This is what powers things like Claude Code / Copilot Agent mode being able to write code, run tests, see failures, and fix them autonomously across many turns.`,
        code: `// Conceptual agent loop
while (!taskComplete) {
    action = model.decideNextAction(goal, history);
    result = executeTool(action);       // e.g. run_tests, edit_file, web_search
    history.add(action, result);
    taskComplete = model.evaluateIfDone(goal, history);
}
return model.summarizeResult(history);`
      },
      {
        n: "Does SKILL.md reduce token consumption? What is a context window?",
        tag: "AI",
        desc: `CONTEXT WINDOW: the maximum amount of text (measured in tokens) a model can "see" at once across the system prompt, conversation history, and any retrieved content — everything beyond that limit gets truncated or must be summarized/dropped.

DOES SKILL.md REDUCE TOKENS? Indirectly, yes, in the way it's typically used: rather than stuffing ALL possible domain knowledge into every prompt regardless of relevance, skills are loaded ON DEMAND — the agent sees only short skill DESCRIPTIONS by default (cheap), and only reads the FULL SKILL.md content into context when a task actually matches that skill. This is more token-efficient than a giant always-on system prompt containing every possible instruction, because irrelevant skill content never enters the context window for tasks that don't need it.`,
        code: `// Inefficient — everything always in context, regardless of relevance
SYSTEM_PROMPT = ALL_DOCX_RULES + ALL_PPTX_RULES + ALL_XLSX_RULES + ALL_PDF_RULES;
// -> thousands of wasted tokens on every single request

// Efficient — skills loaded lazily, only when relevant
availableSkills = [
  { name: "docx", description: "...", path: "/skills/docx/SKILL.md" },
  { name: "pptx", description: "...", path: "/skills/pptx/SKILL.md" }
];
// Agent only reads docx/SKILL.md into context if the task is "write a Word doc"
// -> pptx/xlsx/pdf skill content never touches the context window that turn
`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  // 08 AUG 2026 — New questions from today's session
  // ─────────────────────────────────────────────────────────────
  {
    cat: "HashSet Mutation & ConcurrentModificationException [08 Aug 2026]",
    icon: "⚠",
    color: "#EF4444",
    desc: "Two classic Java trap questions: mutating a HashSet key after insertion, and the right ways to remove elements during iteration.",
    topics: [
      {
        n: "HashSet with mutable key — what happens after st1.id = 2?",
        tag: "AUG26",
        desc: `RULE: NEVER mutate a field used in hashCode() while the object lives inside a HashSet or HashMap key. HashSet computes hashCode() ONCE at add() to choose the bucket. Mutating the field changes the logical hash but the object stays physically in the OLD bucket — it becomes a "ghost": present in size(), but impossible to find, remove, or contains() because any lookup recomputes the hash and looks in the WRONG bucket.

WHAT HAPPENS STEP BY STEP:
- st1 (id=1) → hashCode()=1 → Bucket 1
- st2 (id=3) → hashCode()=3 → Bucket 3
- st3 (id=2) → hashCode()=2 → Bucket 2   (different bucket, different id → added)
- size() = 3 ✅

After st1.id = 2:
- st1 is physically still in Bucket 1, but hashCode() now returns 2
- studentList.contains(st1) → looks in Bucket 2 → finds st3, not st1 → returns FALSE
- studentList.remove(st1)  → looks in Bucket 2 → can't find st1 → FAILS (still in Bucket 1 as zombie)
- studentList.add(st1)     → hashes to Bucket 2, equals() sees id=2 matches st3 → overwrites? No — adds again! → size becomes 4!
- size() still = 3 because no add was called — the object is just unreachable

FIX: make id final, or use immutable keys (String, Integer, UUID).`,
        code: `Student st1 = new Student("Nimit", 1);   // hashCode = 1 → Bucket 1
Student st2 = new Student("Rahul", 3);   // hashCode = 3 → Bucket 3
Student st3 = new Student("Nimit", 2);   // hashCode = 2 → Bucket 2
studentList.add(st1); studentList.add(st2); studentList.add(st3);
System.out.println(studentList.size()); // 3 ✅

st1.id = 2;   // ← mutation: hashCode() now returns 2 but st1 is STILL in Bucket 1

System.out.println(studentList.size());         // 3 — ghost entry counts
System.out.println(studentList.contains(st1)); // FALSE — looks in Bucket 2, misses
studentList.remove(st1);                        // FAILS — can't find in Bucket 2
// st1 is now an unreachable zombie — memory leak, wrong behaviour

// ✅ Fix — make the key field final / immutable
class Student {
    public final int id;       // final → cannot be mutated after construction
    public final String name;
    public Student(String name, int id) { this.name = name; this.id = id; }
    public int hashCode() { return this.id; }
    public boolean equals(Object o) {
        if (!(o instanceof Student)) return false;
        return ((Student) o).id == this.id;
    }
}`
      },
      {
        n: "ConcurrentModificationException — 5 safe removal approaches + ListIterator",
        tag: "AUG26",
        desc: `for-each loop uses an Iterator internally. Calling list.remove() directly during iteration increments the list's modCount but the iterator's expectedModCount stays at the snapshot value — the next call to iterator.next() detects the mismatch and throws ConcurrentModificationException (fail-fast).

FIVE SAFE ALTERNATIVES:
1. ListIterator.remove() — updates modCount internally, no mismatch.
2. Iterator.remove() — same, simpler API than ListIterator.
3. list.removeIf(predicate) — Java 8, cleanest one-liner, uses iterator internally.
4. Stream filter into new list — functional, creates new list.
5. Index loop backwards — avoid index-shift bug that forward loop suffers from.

WHY BACKWARDS LOOP WORKS: after removing index i, the elements after i shift left by 1. Going backwards, every element you haven't visited yet has a lower index — unaffected by the removal.`,
        code: `List<Integer> list = new ArrayList<>(List.of(10, 20, 30, 40));

// ❌ WRONG — ConcurrentModificationException
for (Integer num : list) {
    if (num == 20) list.remove(num);  // modCount != expectedModCount -> boom
}

// ✅ Fix 1 — ListIterator (what the question asked)
ListIterator<Integer> itr = list.listIterator();
while (itr.hasNext()) {
    Integer num = itr.next();
    if (num == 20) itr.remove();  // updates modCount safely
}
System.out.println(list); // [10, 30, 40]

// ✅ Fix 2 — Iterator
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() == 20) it.remove();
}

// ✅ Fix 3 — removeIf (Java 8, cleanest)
list.removeIf(num -> num == 20);
System.out.println(list); // [10, 30, 40]

// ✅ Fix 4 — Stream filter into new list
list = list.stream().filter(n -> n != 20).collect(Collectors.toList());

// ✅ Fix 5 — backwards index loop (no index-shift bug)
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i) == 20) list.remove(i);
}
// Forward loop bug: remove index 1 -> elements shift -> index 2 is now old index 3 -> skips 30
// Backwards: removal at i=1 doesn't affect any i < 1 we haven't visited yet`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Multithreading — Instance vs Static Synchronized [08 Aug 2026]",
    icon: "⇄",
    color: "#06B6D4",
    desc: "Instance lock vs class lock — the most misunderstood synchronized scenario. Both threads print their message when one holds an instance lock and the other needs a class lock.",
    topics: [
      {
        n: "synchronized instance method vs static synchronized method — output?",
        tag: "AUG26",
        desc: `synchronized on an INSTANCE method locks the object instance (the 'this' reference).
synchronized on a STATIC method locks the Class object (MultiThreadHandle.class).

These are TWO COMPLETELY SEPARATE MONITORS. They do NOT block each other.

WHAT HAPPENS:
- Thread 1 calls obj.test1() → acquires lock on OBJ INSTANCE → prints "Inside Test1 Method" → enters infinite sleep (never releases obj lock).
- Thread 2 calls obj.test2() → tries to acquire lock on CLASS OBJECT (MultiThreadHandle.class) → obj lock is completely unrelated → Thread 2 does NOT wait → acquires class lock immediately → prints "Inside Test2 Method" → enters infinite sleep.

OUTPUT: both lines print, then the program hangs forever (both threads sleeping Long.MAX_VALUE).

WHEN WOULD THREAD 2 BLOCK?
- Both methods are instance synchronized → both try to lock 'obj' → Thread 2 blocks.
- Both methods are static synchronized → both try to lock the class → Thread 2 blocks.
- One instance, one static (your code) → different monitors → BOTH RUN.`,
        code: `class MultiThreadHandle {
    public synchronized void test1() {        // locks: this (obj instance)
        System.out.println("Inside Test1 Method");
        while (true) { Thread.sleep(Long.MAX_VALUE); }
    }
    public static synchronized void test2() { // locks: MultiThreadHandle.class
        System.out.println("Inside Test2 Method");
        while (true) { Thread.sleep(Long.MAX_VALUE); }
    }
}

MultiThreadHandle obj = new MultiThreadHandle();
executor.execute(() -> obj.test1()); // Thread 1 → acquires INSTANCE lock on obj
executor.execute(() -> obj.test2()); // Thread 2 → acquires CLASS lock → DIFFERENT MONITOR

// OUTPUT (both print — they never contend):
// Inside Test1 Method
// Inside Test2 Method
// (program hangs forever — both sleep Long.MAX_VALUE)

// Monitor matrix — what blocks what:
// Thread 1 holds INSTANCE lock | Thread 2 needs INSTANCE lock → BLOCKS
// Thread 1 holds CLASS lock    | Thread 2 needs CLASS lock    → BLOCKS
// Thread 1 holds INSTANCE lock | Thread 2 needs CLASS lock    → BOTH RUN ← your case
// Thread 1 holds CLASS lock    | Thread 2 needs INSTANCE lock → BOTH RUN`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "SQL — Student Marks Noticeboard [08 Aug 2026]",
    icon: "🗄",
    color: "#F59E0B",
    desc: "GROUP BY + SUM + ORDER BY — print total marks per student in descending order. Includes window function extensions and Java Stream equivalent.",
    topics: [
      {
        n: "Total marks per student, descending — GROUP BY + SUM + ORDER BY",
        tag: "AUG26",
        desc: `The core query groups rows by student name, sums their marks, and orders by the aggregate descending.

KEY CONCEPTS:
- GROUP BY collapses all rows sharing the same name into one output row.
- SUM(marks) aggregates the marks column for each group.
- ORDER BY totalmarks DESC sorts the result — you can reference the alias in ORDER BY (standard SQL, supported by MySQL/PostgreSQL).
- HAVING (not needed here) filters AFTER grouping — WHERE filters BEFORE grouping.

WHERE vs HAVING: "WHERE marks > 50" eliminates individual subject rows before grouping. "HAVING SUM(marks) > 200" eliminates groups after aggregation.

EXTENSIONS:
- Add RANK() OVER (...) to include position numbers without a separate query.
- Use CASE WHEN for a pivot (each subject as its own column).
- Wrap in a subquery with HAVING to filter only students above average total.`,
        code: `-- Table: Student(Name, Subject, Marks)
-- Rama Math 50 | Rama Physics 60 | Rama English 45
-- Hari Math 70  | Hari Physics 65 | Hari English 85
-- Gita Math 90  | Gita Physics 55 | Gita English 80

-- ✅ Core query
SELECT name, SUM(marks) AS totalmarks
FROM student
GROUP BY name
ORDER BY totalmarks DESC;
-- OUTPUT:
-- Gita  225   (90+55+80)
-- Hari  220   (70+65+85)
-- Rama  155   (50+60+45)

-- With rank position
SELECT
    RANK() OVER (ORDER BY SUM(marks) DESC) AS rank,
    name,
    SUM(marks) AS totalmarks
FROM student
GROUP BY name
ORDER BY totalmarks DESC;
-- 1  Gita  225
-- 2  Hari  220
-- 3  Rama  155

-- Pivot — each subject as its own column
SELECT name,
    SUM(CASE WHEN subject='Math'    THEN marks END) AS math,
    SUM(CASE WHEN subject='Physics' THEN marks END) AS physics,
    SUM(CASE WHEN subject='English' THEN marks END) AS english,
    SUM(marks) AS total
FROM student GROUP BY name ORDER BY total DESC;

-- Only students above average total (avg = 200)
SELECT name, SUM(marks) AS totalmarks FROM student
GROUP BY name
HAVING SUM(marks) > (SELECT AVG(t) FROM (SELECT SUM(marks) AS t FROM student GROUP BY name) sub)
ORDER BY totalmarks DESC;

// Java Stream equivalent
Map<String, Integer> result = students.stream()
    .collect(Collectors.groupingBy(Student::getName, Collectors.summingInt(Student::getMarks)))
    .entrySet().stream()
    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
    .collect(Collectors.toMap(
        Map.Entry::getKey, Map.Entry::getValue,
        (e1, e2) -> e1, LinkedHashMap::new  // preserve sorted order
    ));
result.forEach((name, total) -> System.out.println(name + "\t" + total));
// Gita    225
// Hari    220
// Rama    155`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Hashtable, Spring Boot Startup & FutureTask [08 Aug 2026]",
    icon: "☕",
    color: "#22C55E",
    desc: "Hashtable internals vs HashMap/ConcurrentHashMap, the complete Spring Boot main() startup sequence, and the FutureTask/CompletableFuture/ScheduledFuture concurrency class family.",
    topics: [
      {
        n: "Hashtable — internals, null handling, and why it's obsolete",
        tag: "AUG26",
        desc: `Hashtable is a legacy thread-safe Map from Java 1.0. Every public method — get(), put(), remove(), containsKey(), even read operations — acquires a lock on the ENTIRE table object. This means Thread 1 doing get("key1") blocks Thread 2 trying to get("key2"), even though they touch completely different buckets. That's why Hashtable is obsolete for concurrent use.

INTERNAL DIFFERENCES FROM HASHMAP:
- Hash function: uses (hash & 0x7FFFFFFF) % capacity — modulo, not bitwise AND. Capacity need not be a power of 2.
- Default capacity: 11 (not 16).
- No null keys or null values — throws NullPointerException explicitly in put().
- Extends Dictionary (legacy abstract class from Java 1.0), not AbstractMap.
- Iterator is fail-fast; also exposes legacy Enumeration via keys() / elements().

VS CONCURRENTHASHMAP (Java 5+):
ConcurrentHashMap allows lock-free reads (volatile) and locks only the FIRST NODE of the affected bucket for writes (CAS for empty bucket, synchronized on head node for non-empty). Different buckets write in full parallel — far superior concurrency vs Hashtable's all-or-nothing approach.

USE TODAY: never use Hashtable. Use HashMap (single-threaded), ConcurrentHashMap (multi-threaded).`,
        code: `// Hashtable — every method synchronized on 'this' (the whole table)
Hashtable<String, Integer> table = new Hashtable<>();
table.put(null, 1);      // ❌ NullPointerException — explicitly checked in put()
table.put("key", null);  // ❌ NullPointerException

// Thread 1: table.get("k1") → locks ENTIRE table
// Thread 2: table.get("k2") → BLOCKS even though touching a different bucket!

// ConcurrentHashMap — much better
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.put(null, 1);   // ❌ still no nulls
// Thread 1: map.get("k1") → lock-free volatile read
// Thread 2: map.get("k2") → lock-free volatile read — SIMULTANEOUS ✅
// Thread 1: map.put("k1", v) → CAS / locks only bucket for k1
// Thread 2: map.put("k2", v) → CAS / locks only bucket for k2 — PARALLEL ✅

// Feature comparison
// Feature              | HashMap   | Hashtable        | ConcurrentHashMap
// Thread-safe          | No        | Yes (full lock)  | Yes (bucket lock)
// Null key/value       | 1 null ok | None allowed     | None allowed
// Performance          | Fastest   | Slowest          | Best concurrent
// Lock level           | None      | Entire table     | Bucket / node
// Iterator             | Fail-fast | Fail-fast        | Fail-safe
// Legacy?              | No        | Yes (Java 1.0)   | No (Java 5+)
// Default capacity     | 16        | 11               | 16
// Hash formula         | h^(h>>>16)| (h&0x7FFF)%cap  | h^(h>>>16)`
      },
      {
        n: "Spring Boot main() — complete startup sequence, all 8 phases",
        tag: "AUG26",
        desc: `When you call SpringApplication.run(MyApplication.class, args), Spring Boot goes through 8 distinct phases before your app serves its first request. Understanding these phases explains why startup is slow, what @PostConstruct fires after, and why lazy-initialization helps.

PHASE 1 — Create SpringApplication: detect app type (SERVLET / REACTIVE / NONE) by checking if DispatcherServlet / DispatcherHandler is on classpath. Load ApplicationContextInitializers and ApplicationListeners from spring.factories.

PHASE 2 — Run + Banner: start StopWatch, notify run listeners, print the ASCII Spring banner.

PHASE 3 — Prepare Environment: build ConfigurableEnvironment, load property sources in PRIORITY ORDER: (1) CLI args --server.port=8081, (2) System properties -Dserver.port=8081, (3) OS env vars SERVER_PORT=8081, (4) application.yml / .properties, (5) defaults. Activate @Profile.

PHASE 4 — Create ApplicationContext: instantiate AnnotationConfigServletWebServerApplicationContext (web) or AnnotationConfigApplicationContext (non-web).

PHASE 5 — Prepare ApplicationContext: @ComponentScan finds all @Component/@Service/@Repository/@Controller. @EnableAutoConfiguration reads ~150 auto-config classes from spring/autoconfigure.imports, each checked with @ConditionalOnClass / @ConditionalOnMissingBean. All bean DEFINITIONS registered (not yet instantiated).

PHASE 6 — Refresh (most expensive): BeanFactoryPostProcessors run (@PropertySource, @Value resolved), BeanPostProcessors registered (AOP proxy creators), then ALL singleton beans instantiated EAGERLY (constructor, @Autowired injection, @PostConstruct, AOP proxy wrapping). ContextRefreshedEvent published. CommandLineRunner / ApplicationRunner beans called.

PHASE 7 — Start Web Server: embedded Tomcat/Jetty/Undertow starts, DispatcherServlet registered, all @RequestMapping routes mapped.

PHASE 8 — Ready: ApplicationStartedEvent and ApplicationReadyEvent published. StopWatch logs "Started in X seconds."`,
        code: `@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
        // Phase 1: detect SERVLET app (DispatcherServlet on classpath)
        // Phase 2: print banner, start timer
        // Phase 3: load application.yml, activate profiles
        // Phase 4: create AnnotationConfigServletWebServerApplicationContext
        // Phase 5: scan @Component/@Service + run ~150 AutoConfiguration classes
        // Phase 6: instantiate all singletons, run @PostConstruct, create AOP proxies
        // Phase 7: start embedded Tomcat, map @RequestMapping routes
        // Phase 8: log "Started MyApplication in 3.2 seconds"
    }
}

// @PostConstruct — fires in Phase 6, AFTER injection, BEFORE Tomcat starts
@Service
public class RuleService {
    @Autowired RuleRepository repo;
    @PostConstruct
    public void init() { loadRulesFromDatabase(); } // pre-warm cache before traffic
}

// ApplicationRunner — fires in Phase 6 (end), AFTER Tomcat is up
@Component
public class DataLoader implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) { verifyConnections(); }
}

// Speed up startup — lazy initialization (beans created on first use)
// application.yml
// spring.main.lazy-initialization: true
// Effect: startup 3.2s -> 0.8s | trade-off: first request is slower

// Property source priority (highest to lowest):
// 1. --server.port=8081        (CLI arg)
// 2. -Dserver.port=8081        (JVM system property)
// 3. SERVER_PORT=8081           (OS environment variable)
// 4. application.yml           (config file)
// 5. @PropertySource defaults`
      },
      {
        n: "FutureTask, Future, CompletableFuture, ScheduledFuture — the full family",
        tag: "AUG26",
        desc: `The Java concurrency class hierarchy for async results:

Runnable → run(), no return, no checked exception.
Callable<V> → call(), returns V, can throw Exception.
Future<V> → a handle to an async result. Methods: get() (blocking), get(timeout), isDone(), isCancelled(), cancel().
FutureTask<V> → implements BOTH Runnable AND Future. Can be submitted to an Executor OR run directly on a Thread. Uses volatile state field (NEW/COMPLETING/NORMAL/EXCEPTIONAL/CANCELLED) and LockSupport.park() for blocking — no spinning.
CompletableFuture<V> → Future + non-blocking callbacks + pipeline composition. supplyAsync runs in ForkJoinPool; thenApply/thenCompose chain transforms; exceptionally handles errors; allOf/anyOf combine multiple futures. The modern standard.
ScheduledFuture<V> → Future for delayed or periodic tasks via ScheduledExecutorService.

scheduleAtFixedRate: runs every N seconds regardless of task duration (may overlap if task takes longer than period).
scheduleWithFixedDelay: waits N seconds AFTER the task finishes before starting the next one — no overlap.`,
        code: `// Future — basic async result
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> { Thread.sleep(2000); return 42; });
System.out.println("Doing other work...");
Integer result = future.get();               // blocks until done
Integer result2 = future.get(3, TimeUnit.SECONDS); // with timeout
future.cancel(true);  // true = interrupt if running

// FutureTask — Runnable + Future in one
FutureTask<String> task = new FutureTask<>(() -> "Result from FutureTask");
new Thread(task).start();          // run on plain Thread (FutureTask IS Runnable)
String r = task.get();             // FutureTask IS a Future too
// OR: pool.submit(task);

// CompletableFuture — modern non-blocking pipeline
CompletableFuture.supplyAsync(() -> fetchNetworkData())   // runs in ForkJoinPool
    .thenApply(data -> parseKPIs(data))                   // transform
    .thenCompose(kpis -> callTicketApi(kpis))             // flatMap another CF
    .exceptionally(ex -> { log.error(ex); return "DEFAULT"; })
    .thenAccept(System.out::println);

// Combine two parallel futures
CompletableFuture<String> sites = CompletableFuture.supplyAsync(() -> getSites());
CompletableFuture<String> kpis  = CompletableFuture.supplyAsync(() -> getKPIs());
sites.thenCombine(kpis, (s, k) -> s + " | " + k).thenAccept(System.out::println);

CompletableFuture.allOf(sites, kpis).join(); // wait for ALL
CompletableFuture.anyOf(sites, kpis).get();  // wait for FIRST

// ScheduledFuture — delayed / periodic tasks
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
scheduler.schedule(() -> System.out.println("once after 5s"), 5, TimeUnit.SECONDS);
// Fixed RATE — every 30s from start (may overlap)
scheduler.scheduleAtFixedRate(() -> pollSites(), 0, 30, TimeUnit.SECONDS);
// Fixed DELAY — 30s after each run finishes (no overlap)
scheduler.scheduleWithFixedDelay(() -> processRules(), 0, 30, TimeUnit.SECONDS);

// Class/Interface | Return | Exception | Key feature
// Runnable        | void   | No        | Basic fire-and-forget
// Callable<V>     | V      | Yes       | Returns a value
// Future<V>       | V      | Yes       | Handle to async result (blocking get)
// FutureTask<V>   | V      | Yes       | Runnable + Future combined
// CompletableFuture<V>| V  | Yes       | Non-blocking callbacks + pipeline
// ScheduledFuture<V>  | V  | Yes       | Delayed or periodic execution`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Batch Optimization, REST API Design & DB Indexing [08 Aug 2026]",
    icon: "⚡",
    color: "#8B5CF6",
    desc: "Slow batch job fix (computeIfAbsent + parallel streams), API versioning strategies, REST principles, query optimization, JOIN optimization, and index types.",
    topics: [
      {
        n: "Slow route map builder — computeIfAbsent, groupingByConcurrent, pre-sizing",
        tag: "AUG26",
        desc: `The original code had THREE performance problems:
1. containsKey() + get() = 2 HashMap lookups per route (100K configs × 10 routes = 2M extra lookups).
2. No pre-sizing — HashMap rehashes multiple times as it fills.
3. Single-threaded — wastes multiple cores available at nightly batch time.

FIX 1 — computeIfAbsent: performs ONE lookup (get-or-create-then-put in a single hash computation). Only creates the ArrayList if the key is absent.
FIX 2 — Pre-size the HashMap: new HashMap<>(configs.size() * 2) avoids all rehashing if the number of switches ≈ configs.size().
FIX 3 — parallelStream + groupingByConcurrent: splits the flatMap work across ForkJoinPool threads. groupingByConcurrent uses ConcurrentHashMap internally — thread-safe without external locking.`,
        code: `// ❌ SLOW — 2 lookups per route, no pre-sizing, single-threaded
public Map<String, List<Route>> buildRouteMap(List<SwitchConfig> configs) {
    Map<String, List<Route>> map = new HashMap<>();
    for (SwitchConfig sc : configs) {
        for (Route r : sc.getRoutes()) {
            if (!map.containsKey(sc.getSwitchId())) {      // lookup 1
                map.put(sc.getSwitchId(), new ArrayList<>()); // lookup 2 + alloc
            }
            map.get(sc.getSwitchId()).add(r);              // lookup 3!
        }
    }
    return map;
}

// ✅ Fix 1 — computeIfAbsent (single lookup, creates list only if absent)
public Map<String, List<Route>> buildRouteMap(List<SwitchConfig> configs) {
    Map<String, List<Route>> map = new HashMap<>(configs.size() * 2); // pre-sized
    for (SwitchConfig sc : configs) {
        for (Route r : sc.getRoutes()) {
            map.computeIfAbsent(sc.getSwitchId(), k -> new ArrayList<>()).add(r);
        }
    }
    return map;
}

// ✅ Fix 2 — Stream + groupingBy (clean, functional)
public Map<String, List<Route>> buildRouteMap(List<SwitchConfig> configs) {
    return configs.stream()
        .flatMap(sc -> sc.getRoutes().stream().map(r -> Map.entry(sc.getSwitchId(), r)))
        .collect(Collectors.groupingBy(
            Map.Entry::getKey,
            Collectors.mapping(Map.Entry::getValue, Collectors.toList())
        ));
}

// ✅ Fix 3 — parallelStream + groupingByConcurrent (best for nightly batch)
public Map<String, List<Route>> buildRouteMap(List<SwitchConfig> configs) {
    return configs.parallelStream()          // ForkJoinPool splits the work
        .flatMap(sc -> sc.getRoutes().stream().map(r -> Map.entry(sc.getSwitchId(), r)))
        .collect(Collectors.groupingByConcurrent(  // ConcurrentHashMap — thread-safe
            Map.Entry::getKey,
            Collectors.mapping(Map.Entry::getValue, Collectors.toList())
        ));
}
// Performance on 100K configs × 10 routes = 1M routes:
// Original:  2M HashMap lookups, single thread, ~3 rehashes
// Fix 1:     1M lookups, single thread, 0 rehashes
// Fix 3:     1M lookups across N CPU cores, 0 rehashes — fastest`
      },
      {
        n: "API Versioning — 4 strategies with trade-offs",
        tag: "AUG26",
        desc: `WHY VERSION: without versioning, any breaking change (renaming a field, changing a type, restructuring a response) instantly breaks all existing clients. Versioning lets old and new clients coexist.

STRATEGY 1 — URI Versioning (/api/v1/users): most common, cacheable, easy to route, easy to test in browser. Downside: URL should identify a resource, not a version — REST purists disagree. Used by Stripe, Twitter, GitHub REST.

STRATEGY 2 — Request Header (API-Version: 2): clean URLs, REST-compliant. Downside: can't test in browser, often stripped by proxies, needs Vary header for caching. Used by Microsoft Azure.

STRATEGY 3 — Accept Header (application/vnd.myapp.v2+json): truly REST-compliant content negotiation. Very verbose, hard to test, complex on clients. Used by GitHub (their preferred approach).

STRATEGY 4 — Query Parameter (?version=2): easy to test but semantically wrong (query params are for filtering resources, not selecting a version). Avoid.

DEPRECATION PATTERN: keep v1 alive, add response headers Deprecation: true and Sunset: 2026-12-31 + Link: /api/v2/... so clients know when to migrate.`,
        code: `// Strategy 1 — URI versioning (most common)
@GetMapping("/api/v1/users/{id}") public UserV1Response getUserV1(...) {}
@GetMapping("/api/v2/users/{id}") public UserV2Response getUserV2(...) {}

// Strategy 2 — Header versioning
@GetMapping(value="/api/users/{id}", headers="API-Version=2")
public UserV2Response getUser(...) {}

// Strategy 3 — Accept header (content negotiation)
@GetMapping(value="/api/users/{id}", produces="application/vnd.myapp.v2+json")
public UserV2Response getUser(...) {}

// Strategy 4 — Query param (avoid)
@GetMapping("/api/users/{id}") // GET /api/users/1?version=2
public Object getUser(@PathVariable Long id, @RequestParam(defaultValue="1") int version) {}

// Deprecation headers — signal v1 end-of-life to clients
@GetMapping("/api/v1/users/{id}")
public ResponseEntity<UserV1Response> getUserV1(@PathVariable Long id) {
    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "2026-12-31")           // when v1 dies
        .header("Link", "/api/v2/users/" + id)   // where to migrate
        .body(userService.getUserV1(id));
}`
      },
      {
        n: "REST API design principles — 6 constraints + status codes + pagination",
        tag: "AUG26",
        desc: `REST has 6 architectural constraints. The ones most tested in interviews:

1. RESOURCE-BASED URLS (nouns not verbs): /tickets not /getTickets, /tickets/1 not /deleteTicket?id=1.
2. CORRECT HTTP VERBS: GET (safe + idempotent, read), POST (create, NOT idempotent), PUT (full replace, idempotent), PATCH (partial update), DELETE (idempotent).
3. STATELESS: no server-side session — each request must be self-contained (auth via JWT in header, not session cookie).
4. CORRECT STATUS CODES: 200 OK, 201 Created (include Location header), 204 No Content (DELETE), 400 Bad Request (validation), 401 Unauthorized (no token), 403 Forbidden (has token, no permission), 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Internal Server Error.
5. CONSISTENT ERROR RESPONSE: never return a plain string on error — always structured JSON with timestamp, status, message, path, traceId.
6. PAGINATION: never return unbounded lists — always page=0&size=20&sort=createdAt,desc, response includes totalElements/totalPages.

IDEMPOTENT means: calling the same operation N times produces the same result as calling it once. GET/PUT/DELETE are idempotent. POST is NOT (two POSTs create two resources). Important for retry logic.`,
        code: `// Resource-based URLs — nouns, not verbs
// ❌ /getTicket/1   /createTicket   /deleteTicket/1
// ✅ GET /tickets/1  POST /tickets   DELETE /tickets/1

// Global error response format
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(400, msg, "/api/tickets", UUID.randomUUID().toString()));
    }
}
// Error JSON: { "status":400, "message":"priority: must not be null",
//               "path":"/api/tickets", "traceId":"abc-123", "timestamp":"..." }

// Pagination — Spring Data
@GetMapping("/tickets")
public Page<TicketDTO> getTickets(
    @RequestParam(defaultValue="0")  int page,
    @RequestParam(defaultValue="20") int size,
    @RequestParam(defaultValue="createdAt") String sort) {
    return ticketService.getTickets(PageRequest.of(page, size, Sort.by(sort).descending()));
}
// Response: { "content":[...], "page":0, "size":20,
//             "totalElements":1547, "totalPages":78, "last":false }

// Status codes cheat sheet
// 200 OK          — GET/PUT/PATCH success
// 201 Created     — POST success + Location: /tickets/123 header
// 204 No Content  — DELETE success (no body)
// 400 Bad Request — validation failure
// 401 Unauthorized— no/bad token
// 403 Forbidden   — authenticated but no permission
// 404 Not Found   — resource doesn't exist
// 409 Conflict    — duplicate resource / optimistic lock conflict
// 429 Too Many    — rate limit hit
// 500 Server Error— unexpected crash`
      },
      {
        n: "DB query optimization, JOIN optimization, and index types",
        tag: "AUG26",
        desc: `QUERY OPTIMIZATION — the 5-step process:
1. EXPLAIN ANALYZE: read Seq Scan as "missing index", check estimated vs actual rows (big mismatch = stale stats, run ANALYZE).
2. SELECT only needed columns — avoid SELECT * especially on tables with TEXT/BLOB columns.
3. Avoid functions on indexed columns — WHERE YEAR(created_at)=2025 prevents index use; WHERE created_at >= '2025-01-01' AND < '2026-01-01' uses the index.
4. Paginate large result sets — never return 1M rows.
5. Fix N+1 with JOIN FETCH / @EntityGraph.

JOIN OPTIMIZATION:
- Always index foreign key columns — without an index on tickets.dept_id, JOIN departments requires a full scan of departments for every ticket row.
- Filter before joining: use a subquery or CTE to narrow the left table BEFORE the JOIN — fewer rows = cheaper join.
- Avoid OR in JOIN conditions — use UNION instead (each branch can use its index separately).

INDEX TYPES:
- B-Tree (default): equality and range queries (=, <, >, BETWEEN, LIKE 'prefix%').
- Composite index: multi-column — LEADING COLUMN RULE: index(A,B) works for WHERE A=? and WHERE A=? AND B=?, but NOT WHERE B=? alone.
- Partial index: index only a subset — CREATE INDEX ... WHERE status='OPEN' — much smaller, faster, less write overhead.
- Covering index: INCLUDE all columns the query selects — query satisfied entirely from index, never touches main table.
- CREATE INDEX CONCURRENTLY: adds index with no write lock — essential for production tables.`,
        code: `-- Step 1: always start here
EXPLAIN ANALYZE
SELECT t.id, t.title, d.name FROM tickets t
JOIN departments d ON t.dept_id = d.id
WHERE t.status = 'OPEN' AND t.created_at > NOW() - INTERVAL '7 days';
-- Seq Scan on large table? → missing index
-- Nested Loop with many rows? → missing join index
-- Rows=100 estimated, actual=50000? → stale stats, run ANALYZE tickets

-- Step 2: avoid functions on indexed columns
-- ❌ WHERE YEAR(created_at) = 2025       → can't use index
-- ✅ WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'

-- Index types
CREATE INDEX idx_tickets_status ON tickets(status);          -- B-Tree, equality/range

CREATE INDEX idx_tickets_status_created ON tickets(status, created_at); -- composite
-- Works for: WHERE status = ?
-- Works for: WHERE status = ? AND created_at > ?
-- FAILS for: WHERE created_at > ?     (no leading column match)

CREATE INDEX idx_tickets_open ON tickets(created_at)
WHERE status = 'OPEN';            -- partial index — tiny, fast, low write cost

CREATE INDEX idx_tickets_cover ON tickets(status, created_at)
INCLUDE (id, title, priority);    -- covering index — query never touches main table

CREATE INDEX CONCURRENTLY idx_safe ON tickets(dept_id); -- no write lock, prod-safe

-- JOIN optimization: filter BEFORE joining
-- ❌ join everything then filter
SELECT * FROM tickets t JOIN departments d ON t.dept_id = d.id
WHERE t.status = 'OPEN' AND t.created_at > '2025-01-01';

-- ✅ narrow left table first, then join smaller result
SELECT * FROM (
    SELECT * FROM tickets WHERE status = 'OPEN' AND created_at > '2025-01-01'
) t JOIN departments d ON t.dept_id = d.id;

-- OR in JOIN → UNION (each branch uses its own index)
-- ❌ JOIN ON t.assignee_id = u.id OR t.reporter_id = u.id   (no index usage)
-- ✅
SELECT * FROM tickets t JOIN users u ON t.assignee_id = u.id
UNION
SELECT * FROM tickets t JOIN users u ON t.reporter_id = u.id;

-- Check unused indexes (PostgreSQL) — drop them (they cost write overhead for nothing)
SELECT indexname, idx_scan FROM pg_stat_user_indexes
WHERE tablename = 'tickets' ORDER BY idx_scan ASC;`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Equilibrium Index & Wiggle Sort — Stream Solutions [08 Aug 2026]",
    icon: "◐",
    color: "#F97316",
    desc: "Two live coding problems from an InterviewNinja assessment — iterative fix + Java 8 stream versions for both.",
    topics: [
      {
        n: "Equilibrium Index (1-based) — iterative fix and stream version",
        tag: "AUG26",
        desc: `PROBLEM: find the first 1-based index where sum of elements BEFORE it equals sum of elements AFTER it.
Array [2, 2, 5, 6, -2]: at index 3 (1-based) → left sum = 2+2 = 4, right sum = 6+(-2) = 4 ✅

ORIGINAL CODE BUGS:
1. Used a HashMap for prefix sums — unnecessary complexity, wrong key mapping.
2. Missing the 1-based return (i + 1).
3. containsKey(i-1) logic breaks when index 0 is the answer.

CLEAN FIX: total sum computed once; iterate left to right keeping a running leftSum; rightSum = totalSum - leftSum - arr[i]; if equal return i+1.

STREAM VERSION: IntStream.range cannot use a plain int leftSum in the lambda (must be effectively final). The standard workaround is a single-element int[] array which IS effectively final (the reference never changes, only the element inside it).`,
        code: `// ✅ Iterative fix — O(n) time, O(1) space
static int solve(int[] arr) {
    int totalSum = Arrays.stream(arr).sum();
    int leftSum = 0;
    for (int i = 0; i < arr.length; i++) {
        int rightSum = totalSum - leftSum - arr[i];
        if (leftSum == rightSum) return i + 1;  // 1-based index
        leftSum += arr[i];
    }
    return -1;
}
// Trace [2, 2, 5, 6, -2], total=13:
// i=0: right=13-0-2=11,  left(0)==right(11)? NO   leftSum→2
// i=1: right=13-2-2=9,   left(2)==right(9)?  NO   leftSum→4
// i=2: right=13-4-5=4,   left(4)==right(4)?  YES  return 3 ✅

// ✅ Stream version — stateful leftSum via int[] wrapper
static int solveStream(int[] arr) {
    int totalSum = Arrays.stream(arr).sum();
    int[] leftSum = {0};  // effectively final reference, mutable content
    return IntStream.range(0, arr.length)
        .filter(i -> {
            int rightSum = totalSum - leftSum[0] - arr[i];
            boolean eq = leftSum[0] == rightSum;
            leftSum[0] += arr[i];   // accumulate INSIDE filter — side effect
            return eq;
        })
        .map(i -> i + 1)            // convert to 1-based
        .findFirst()                // first equilibrium index
        .orElse(-1);
}
// WHY int[] not plain int:
// int leftSum = 0;
// filter(i -> { leftSum += arr[i]; }) // ❌ "Variable used in lambda must be final"`
      },
      {
        n: "Wiggle Sort (alternating high/low) — O(n) fix and stream version",
        tag: "AUG26",
        desc: `PROBLEM: given a sorted ascending array, rearrange so it alternates high-low-high-low. Input [1,2,3,4,5,6,7] → output [2,1,4,3,6,5,7].

ORIGINAL ERROR: Time Limit Exceeded — solution was O(n²) or worse (likely nested loops or sorting inside the loop).

THE O(n) INSIGHT: the array is ALREADY sorted, so arr[i+1] >= arr[i] always holds. Swapping adjacent pairs (positions 0↔1, 2↔3, 4↔5...) guarantees the higher of each pair lands at the even index. Each even-indexed element is always ≥ both its odd-indexed neighbours → wiggle property satisfied.

STREAM VERSION: build a new array via IntStream.range — at even index i take arr[i+1] (the larger), at odd index i take arr[i-1] (the smaller). Last element stays if array length is odd. No mutation needed — purely functional index mapping.`,
        code: `// ✅ Iterative fix — O(n) time, O(1) space (in-place swap)
static int[] solve(int[] arr) {
    for (int i = 0; i < arr.length - 1; i += 2) {
        int temp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = temp;
    }
    return arr;
}
// Trace [1,2,3,4,5,6,7]:
// Swap (0,1): [2,1,3,4,5,6,7]
// Swap (2,3): [2,1,4,3,5,6,7]
// Swap (4,5): [2,1,4,3,6,5,7]
// i=6: 6 >= length-1=6 → stop (7 stays in place)
// Result: [2,1,4,3,6,5,7]  each even index > both neighbours ✅

// ✅ Stream version — purely functional, no mutation
static int[] solveStream(int[] arr) {
    return IntStream.range(0, arr.length)
        .map(i -> {
            if (i % 2 == 0 && i + 1 < arr.length) return arr[i + 1]; // even → take next (larger)
            if (i % 2 == 1)                         return arr[i - 1]; // odd  → take prev (smaller)
            return arr[i]; // last element when array has odd length
        })
        .toArray();
}
// Trace [1,2,3,4,5,6,7]:
// i=0 even → arr[1]=2  | i=1 odd → arr[0]=1
// i=2 even → arr[3]=4  | i=3 odd → arr[2]=3
// i=4 even → arr[5]=6  | i=5 odd → arr[4]=5
// i=6 even, no i+1     → arr[6]=7
// Result: [2,1,4,3,6,5,7] ✅

// Key interview point — why stream needs a NEW array:
// Stream.map() must be stateless and non-interfering.
// Reading arr[i+1] while also writing arr[i] (in-place) would cause race conditions
// in parallel streams. Functional approach reads original, writes new array — safe.`
      }
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Staging to Production Checklist [08 Aug 2026]",
    icon: "🚀",
    color: "#14B8A6",
    desc: "Every layer you must verify before promoting a Spring Boot service from staging to production — code, config, DB, infrastructure, security, observability, performance, and release process.",
    topics: [
      {
        n: "Complete staging → production go-live checklist",
        tag: "AUG26",
        desc: `This is a senior engineer question — they expect you to think across ALL layers, not just "tests pass."

CODE & BUILD: all unit and integration tests green, JaCoCo coverage ≥ 80%, no compiler warnings, code review approved, no hardcoded values, no secrets in logs, artifact version is a release tag (not SNAPSHOT).

CONFIGURATION: application-prod.yml points to production DB/cache/queues, connection pool sized for production load (not dev defaults), log level WARN/ERROR (not DEBUG), secrets in vault/secrets manager, rate limits and timeouts configured for production traffic, CORS restricted to production domains.

DATABASE: migration scripts tested on staging with a copy of production-size data, migration is BACKWARD COMPATIBLE (old code still runs with new schema — add nullable columns first, never rename/drop in the same release as the code change), rollback script exists and tested, DB backup taken before migration, CONCURRENTLY keyword used for new indexes.

INFRASTRUCTURE: deployment strategy chosen (rolling / blue-green / canary), /actuator/health returns UP before traffic is routed, graceful shutdown configured (server.shutdown=graceful + 30s timeout), Kubernetes resource requests and limits set, HPA configured.

SECURITY: HTTPS enforced, security response headers set (CSP, X-Frame-Options, HSTS), Actuator endpoints secured (only /health public), OWASP dependency scan clean, no secrets in Git history.

OBSERVABILITY: structured JSON logging, traceId in every log line, Prometheus metrics endpoint live, Grafana dashboards and ALERTS configured BEFORE go-live (error rate, p99 latency, heap, pod crash loops).

PERFORMANCE: load tested at 2× peak traffic, no memory leaks under sustained load, GC behaviour acceptable.

RELEASE PROCESS: no Friday deployments, rollback criteria defined upfront ("if error rate > 2% in first 10 min → auto rollback"), smoke tests automated, on-call engineer available, 30-min active watch post-deploy.`,
        code: `// Backward-compatible DB migration — the most important rule
// SAFE: add nullable column (old code ignores it, new code writes to it)
ALTER TABLE tickets ADD COLUMN auto_closed BOOLEAN;                    -- deploy DB change
// → deploy new code that reads/writes auto_closed
// → later (next release): add NOT NULL constraint once all rows populated

// UNSAFE: rename column and change code in same release
// ALTER TABLE tickets RENAME COLUMN status TO ticket_status;          -- ❌
// Old pods still running → query "WHERE status=?" → column gone → crash

// Create index without locking production table
CREATE INDEX CONCURRENTLY idx_tickets_status ON tickets(status);       -- no write lock ✅

// Graceful shutdown — finish in-flight requests before pod dies
// application.yml
// server.shutdown: graceful
// spring.lifecycle.timeout-per-shutdown-phase: 30s

// Health check — Kubernetes only routes traffic AFTER this returns UP
// GET /actuator/health
// {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}

// Rollback — Kubernetes rolling deployment
// kubectl rollout undo deployment/ticket-service
// kubectl rollout status deployment/ticket-service

// Smoke test immediately after deploy (automated)
// curl -f https://api.prod.example.com/actuator/health
// curl -f https://api.prod.example.com/api/v1/tickets?page=0&size=1
// curl -f https://api.prod.example.com/api/v1/users/me  -H "Authorization: Bearer $TOKEN"

// Alert thresholds to set BEFORE go-live
// Error rate (5xx) > 1% for 5 minutes → page on-call
// Response time p99 > 2 seconds        → alert
// JVM heap > 85%                        → alert
// Pod crash loop (restartCount > 3)     → immediate page
// DB connection pool > 90% utilised     → warning`
      }
    ]
  }
];

export { SECTIONS };

const TAG_META = {
  SPRING:     { bg: "#0A2E1E", text: "#22C55E", border: "#0C3D28" },
  STREAMS:    { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  OOP:        { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  FP:         { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  HASHMAP:    { bg: "#3A0E0E", text: "#EF4444", border: "#4A1414" },
  TREEMAP:    { bg: "#3A0E0E", text: "#EF4444", border: "#4A1414" },
  MEMORY:     { bg: "#2D1A4A", text: "#8B5CF6", border: "#3A2060" },
  COLLECTORS: { bg: "#0E1E3A", text: "#3B82F6", border: "#0C2A4E" },
  GC:         { bg: "#2D1A4A", text: "#8B5CF6", border: "#3A2060" },
  CONCURRENCY:{ bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  PYTHON:     { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  DESIGN:     { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  ARCH:       { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  DSA:        { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  JUNIT:      { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  MOCKITO:    { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  QUICKFIRE:  { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  AI:         { bg: "#0A3A36", text: "#14B8A6", border: "#0C4A44" },
  AUG26:      { bg: "#1A0E3A", text: "#A78BFA", border: "#2A1A4A" },
};

export default function JavaInterviewPrep() {
  return (
    <RevisionNotesLayout
      pageKey="previous-interview"
      title="Java Interview Q&A Reference"
      subtitle="Spring Boot to Agentic AI — compiled from past interview rounds."
      categoryIcon="💡"
      categoryColor="#EAB308"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}
