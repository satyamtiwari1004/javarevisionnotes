import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Collections Framework Overview",
    icon: "◎",
    color: "#06B6D4",
    desc: "The hierarchy, core interfaces, and how the framework is structured.",
    topics: [
      {
        n: "Collection Hierarchy & Core Interfaces",
        star: true,
        tag: "OVERVIEW",
        desc: `The Java Collections Framework (JCF) is a unified architecture for storing and manipulating groups of objects. Every collection class in Java implements one of the core interfaces, and understanding the hierarchy tells you exactly what operations are available.

CORE INTERFACE HIERARCHY:
• Iterable → Collection → List, Queue, Set
• Map (separate hierarchy — not a Collection)

COLLECTION (root of most):
  Defines: add(), remove(), contains(), size(), isEmpty(), iterator(), toArray()
  Subinterfaces: List, Set, Queue, Deque

LIST: Ordered, index-based, allows duplicates.
  Implementations: ArrayList, LinkedList, Vector (legacy), Stack (legacy)

SET: No duplicates, generally unordered.
  Implementations: HashSet, LinkedHashSet, TreeSet

QUEUE / DEQUE: For FIFO/LIFO workflows, priority-based access.
  Implementations: LinkedList, ArrayDeque, PriorityQueue

MAP: Key-value pairs, no duplicate keys.
  Implementations: HashMap, LinkedHashMap, TreeMap, Hashtable (legacy), ConcurrentHashMap

KEY DESIGN PRINCIPLE — Program to interface, not implementation:
  List<String> list = new ArrayList<>();   // ✓ good
  ArrayList<String> list = new ArrayList<>();  // ✗ locks you to ArrayList

WHY IT MATTERS IN INTERVIEWS: Interviewers expect you to know which interface to choose (List vs Set vs Map), which implementation to pick for the use case, and the time complexity of core operations.`,
        code: `// ── Core interfaces and their contract ───────────────────
// List — ordered, indexed, allows duplicates
List<String> list = new ArrayList<>();
list.add("A"); list.add("B"); list.add("A");  // [A, B, A]
list.get(1);    // "B" — O(1) for ArrayList
list.indexOf("A"); // 0 — first occurrence

// Set — no duplicates, no index
Set<String> set = new HashSet<>();
set.add("A"); set.add("B"); set.add("A");  // {A, B} — duplicate ignored
set.contains("A"); // true — O(1) for HashSet

// Map — key-value pairs, no duplicate keys
Map<String, Integer> map = new HashMap<>();
map.put("alice", 95); map.put("bob", 80);
map.put("alice", 100); // overwrites! map now has alice→100
map.get("alice"); // 100
map.getOrDefault("carol", 0); // 0 — safe get

// Queue — FIFO
Queue<String> queue = new LinkedList<>();
queue.offer("first"); queue.offer("second");
queue.poll();  // "first" — removes and returns head
queue.peek();  // "second" — views head without removing

// Deque — double-ended (use as stack OR queue)
Deque<String> deque = new ArrayDeque<>();
deque.push("A");    // stack push (addFirst)
deque.pop();        // stack pop  (removeFirst)
deque.offer("B");   // queue add  (addLast)
deque.poll();       // queue poll (removeFirst)

// ── Collection hierarchy diagram ──────────────────────────
//
//  Iterable
//    └── Collection
//          ├── List ──── ArrayList, LinkedList, Vector
//          ├── Set ───── HashSet, LinkedHashSet, TreeSet
//          └── Queue ─── PriorityQueue, ArrayDeque
//                └── Deque ─ ArrayDeque, LinkedList
//
//  Map (separate)
//    ├── HashMap, LinkedHashMap, Hashtable
//    └── SortedMap → TreeMap

// ── Choosing the right collection ─────────────────────────
// Need fast index access?        → ArrayList
// Need fast insert/delete at ends? → ArrayDeque or LinkedList
// Need no duplicates?            → HashSet
// Need no duplicates + ordered?  → LinkedHashSet or TreeSet
// Need key-value lookup?         → HashMap
// Need key-value + insertion order? → LinkedHashMap
// Need key-value + sorted keys?  → TreeMap
// Need thread safety?            → ConcurrentHashMap, CopyOnWriteArrayList`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "HashMap — Deep Internals",
    icon: "⊞",
    color: "#F59E0B",
    desc: "Bucket array, hashing, collision resolution, load factor, treeification — the most asked interview topic.",
    topics: [
      {
        n: "Internal Structure — Buckets, Array, Node",
        star: true,
        tag: "HASHMAP",
        desc: `HashMap is internally an array of buckets (Node<K,V>[] table). Each bucket is a linked list (or red-black tree for large buckets). The position in the array is determined by the key's hash code.

INITIAL CAPACITY: The array size when the HashMap is first created. Default = 16. Must always be a power of 2 — this is deliberate (explained below).

BUCKET: A single slot in the array. HashMap uses the term 'bucket' to mean table[index]. A bucket can hold:
  • null (empty)
  • A single Node (one entry)
  • A linked list of Nodes (collision chain)
  • A TreeNode (red-black tree — when chain grows too long)

NODE STRUCTURE (Java source):
  static class Node<K,V> implements Map.Entry<K,V> {
      final int hash;   // stored hash (avoids re-computation)
      final K key;
      V value;
      Node<K,V> next;   // pointer to next node in the same bucket
  }

HOW INDEX IS COMPUTED (the magic formula):
  Step 1: h = key.hashCode()               // get raw hash from key
  Step 2: h = h ^ (h >>> 16)              // spread high bits (HashMap.hash() method)
  Step 3: index = h & (capacity - 1)      // bitwise AND instead of modulo

WHY POWER OF 2 CAPACITY?
  capacity - 1 when capacity is a power of 2 is all 1-bits: 16-1 = 0b1111
  h & 0b1111 is equivalent to h % 16 but 5-10x faster (bitwise op vs division)
  Also ensures even distribution across all buckets.

WHY XOR WITH HIGH BITS (h ^ h>>>16)?
  hashCode() has 32 bits but capacity is often 16 or 32 (only 4-5 bits used by &).
  High bits would be ignored, causing more collisions.
  XOR-ing high 16 bits into low 16 bits mixes entropy from the full hash into the index computation.`,
        code: `// ── HashMap internal structure (simplified) ──────────────
// Actual Java source (OpenJDK):
//
//   static final int DEFAULT_INITIAL_CAPACITY = 16;   // must be power of 2
//   static final float DEFAULT_LOAD_FACTOR = 0.75f;
//   static final int TREEIFY_THRESHOLD = 8;           // chain → tree
//   static final int UNTREEIFY_THRESHOLD = 6;         // tree → chain
//   static final int MIN_TREEIFY_CAPACITY = 64;       // min table size for treeify
//
//   Node<K,V>[] table;                                // the bucket array
//   int size;                                         // number of key-value pairs
//   int threshold;                                    // capacity * loadFactor
//
// Node structure:
//   hash | key | value | next  →  next node in bucket chain

// ── How HashMap.put() works step by step ─────────────────
Map<String, Integer> map = new HashMap<>();
map.put("alice", 95);

// Internally:
// 1. hash  = HashMap.hash("alice")
//          = "alice".hashCode() ^ ("alice".hashCode() >>> 16)
// 2. index = hash & (16 - 1)  = hash & 15  (fits 0..15)
// 3. table[index] == null?  → create new Node, store at table[index]
// 4. table[index] != null?  → collision! walk the chain:
//      a. If existing node has same key → overwrite value
//      b. If chain end reached → append new Node (chaining)
//      c. If chain length >= TREEIFY_THRESHOLD → convert to TreeNode
// 5. size++; if (size > threshold) resize()

// ── Visualising bucket layout ─────────────────────────────
//
//  table (capacity=16):
//  [0]  null
//  [1]  null
//  [2]  Node{hash=x, key="alice", value=95, next=null}
//  [3]  Node{hash=y, key="bob",   value=80, next=
//              Node{hash=z, key="carol", value=70, next=null}}  ← collision chain
//  [4]  null
//  ...
//  [15] null
//
//  bucket [3] has a collision — "bob" and "carol" mapped to same index

// ── Checking the actual hash and index ────────────────────
String key = "alice";
int h = key.hashCode();
int spreadHash = h ^ (h >>> 16);
int capacity = 16;
int index = spreadHash & (capacity - 1);
System.out.println("hashCode: " + h);
System.out.println("spread:   " + spreadHash);
System.out.println("index:    " + index + "  (bucket " + index + " of 16)");`
      },
      {
        n: "Load Factor, Threshold & Resize",
        star: true,
        tag: "HASHMAP",
        desc: `LOAD FACTOR is the ratio of entries to buckets at which the HashMap decides to grow. Default = 0.75 (75%).

THRESHOLD = capacity × loadFactor
  With defaults: threshold = 16 × 0.75 = 12
  When size exceeds 12 entries, HashMap resizes.

RESIZE PROCESS:
  1. New capacity = old capacity × 2  (doubles each time, always power of 2)
  2. New threshold = new capacity × loadFactor
  3. New Node[] table created (old capacity * 2)
  4. Every existing entry is rehashed and moved to the new table
     (rehash = recompute index with new capacity)
  5. Old table is garbage-collected

WHY 0.75 SPECIFICALLY?
  This is a mathematical balance between two costs:
  • Too low (e.g. 0.5): resize frequently → more memory used, faster lookup
  • Too high (e.g. 0.9): fewer resizes → more collisions, slower lookup
  0.75 is a good middle ground from probability theory — at 75% fill, 
  the expected number of entries per bucket is about 1, balancing space and time.

TIME COST OF RESIZE:
  Resize is O(n) — every entry is rehashed and moved.
  In a loop doing 1000 puts into an empty HashMap:
  • Resize at 12: rehash 12 entries
  • Resize at 24: rehash 24 entries
  • Resize at 48: rehash 48 entries
  Total extra work is still O(n) amortized.

PRE-SIZING OPTIMIZATION:
  If you know you'll insert ~1000 entries, construct with:
  new HashMap<>(1 << (int)(Math.log(1000/0.75) / Math.log(2) + 1))
  Or simply: new HashMap<>(2048)  — next power of 2 above 1000/0.75 ≈ 1334
  This avoids all intermediate resizes.`,
        code: `// ── Default HashMap: threshold = 16 * 0.75 = 12 ──────────
HashMap<String, Integer> defaultMap = new HashMap<>();
// Resizes at 12, 24, 48, 96, 192...

// ── Custom load factor ────────────────────────────────────
// Lower load factor: fewer collisions, more memory
HashMap<String, Integer> fastMap = new HashMap<>(16, 0.5f);
// threshold = 16 * 0.5 = 8 → resizes sooner, less collision

// Higher load factor: more collisions, less memory
HashMap<String, Integer> memoryMap = new HashMap<>(16, 0.9f);
// threshold = 16 * 0.9 = 14 → resizes later, more collision

// ── Pre-sized HashMap (avoid resize overhead) ─────────────
int expectedEntries = 1000;
// Formula: capacity = expectedEntries / loadFactor, round up to power of 2
int capacity = (int)(expectedEntries / 0.75) + 1; // = 1334
HashMap<String, Integer> presSized = new HashMap<>(capacity);
// Never resizes for 1000 entries → better performance

// Guava's Maps.newHashMapWithExpectedSize(n) does this calculation for you

// ── Resize simulation ─────────────────────────────────────
// To see when resize happens, use reflection (educational, not production):
HashMap<String, Integer> map = new HashMap<>();
java.lang.reflect.Field tableField = HashMap.class.getDeclaredField("table");
tableField.setAccessible(true);

for (int i = 0; i < 20; i++) {
    map.put("key" + i, i);
    Object[] table = (Object[]) tableField.get(map);
    if (table != null) {
        System.out.printf("size=%-3d table.length=%-3d threshold=%-3d%n",
            map.size(), table.length, (int)(table.length * 0.75));
    }
}
// Output:
// size=1  table.length=16  threshold=12
// ...
// size=12 table.length=16  threshold=12
// size=13 table.length=32  threshold=24  ← RESIZE happened!
// ...
// size=24 table.length=32  threshold=24
// size=25 table.length=64  threshold=48  ← RESIZE again!`
      },
      {
        n: "Collision Resolution — Chaining & Treeification",
        star: true,
        tag: "HASHMAP",
        desc: `COLLISION: Two different keys that map to the same bucket index. This happens when hash(key1) & (cap-1) == hash(key2) & (cap-1).

Java HashMap uses SEPARATE CHAINING: colliding entries are stored in a linked list (chain) at the same bucket.

GET/CONTAINS WITH COLLISION:
  When looking up a key, HashMap:
  1. Computes the bucket index
  2. Walks the chain at that bucket
  3. For each node: compares hash first (int comparison, cheap), then checks key equality (equals())
  This is why a good hashCode() is critical — if all keys collide into one bucket, get() degrades from O(1) to O(n).

TREEIFICATION (Java 8+):
  When a single bucket's chain reaches TREEIFY_THRESHOLD = 8, AND the overall table size >= MIN_TREEIFY_CAPACITY = 64, the chain is converted to a Red-Black Tree (TreeNode). Tree lookup is O(log n) instead of O(n) for long chains.
  
  If the table is smaller than 64, HashMap resizes instead of treeifying (resize distributes entries across more buckets, reducing chain lengths).

  When entries are removed and the tree shrinks to UNTREEIFY_THRESHOLD = 6, it converts back to a linked list.

THE WORST CASE — HASH FLOODING:
  Malicious input can craft keys that all hash to the same bucket.
  Before Java 8: every get() was O(n) — hash flooding DoS attacks on web frameworks.
  After Java 8: treeification caps the worst case at O(log n) per bucket.

GOOD hashCode() REQUIREMENTS:
  • Deterministic: same object always returns same hash.
  • Uniform distribution: hashes spread evenly across integer range.
  • Consistent with equals(): if a.equals(b), then a.hashCode() == b.hashCode() (mandatory!).
  • If a.hashCode() != b.hashCode(), then a.equals(b) must be false.`,
        code: `// ── Collision example ────────────────────────────────────
// Keys "Aa" and "BB" have the same hashCode in Java!
System.out.println("Aa".hashCode());  // 2112
System.out.println("BB".hashCode());  // 2112 — same!
// Both map to the same bucket → collision chain

// ── What happens in the bucket chain ─────────────────────
// After map.put("Aa", 1) and map.put("BB", 2):
// table[index] → Node{hash=2112, key="Aa", value=1, next=
//                  Node{hash=2112, key="BB", value=2, next=null}}

// map.get("BB"):
// 1. compute index for "BB" → same index as "Aa"
// 2. table[index] != null → walk chain:
//    Node{key="Aa"}: "Aa".equals("BB")? No → next
//    Node{key="BB"}: "BB".equals("BB")? Yes → return 2

// ── Treeification threshold ───────────────────────────────
// Chain length 1-7: LinkedList (Node chain)
// Chain length 8+ AND table.size >= 64: Red-Black Tree (TreeNode)
//
// Treeified bucket lookup: O(log 8) = 3 comparisons worst case
// vs O(8) = 8 comparisons for a chain of 8

// ── Why good hashCode() matters ───────────────────────────
// BAD hashCode — all objects return same value
class BadKey {
    int id;
    BadKey(int id) { this.id = id; }

    @Override
    public int hashCode() { return 42; }  // ALL keys → same bucket!

    @Override
    public boolean equals(Object o) {
        return o instanceof BadKey && ((BadKey)o).id == this.id;
    }
}
// map.put(new BadKey(1), "a");
// map.put(new BadKey(2), "b");
// map.put(new BadKey(3), "c");
// All in bucket[42 & 15] → chain of 3 → O(n) lookup

// GOOD hashCode — distributes keys uniformly
class GoodKey {
    int id;
    GoodKey(int id) { this.id = id; }

    @Override
    public int hashCode() { return Integer.hashCode(id); }  // delegates to int hash

    @Override
    public boolean equals(Object o) {
        return o instanceof GoodKey && ((GoodKey)o).id == this.id;
    }
}

// ── The hashCode-equals CONTRACT ─────────────────────────
// RULE: if a.equals(b) == true, then a.hashCode() == b.hashCode()
// Violation breaks HashMap:
class BrokenContract {
    String name;
    @Override public boolean equals(Object o) {
        return o instanceof BrokenContract bc && bc.name.equals(this.name);
    }
    // forgot to override hashCode! uses Object.hashCode() → identity-based
    // Two "equal" objects may be in different buckets → get() returns null even though key "exists"
}`
      },
      {
        n: "HashMap vs LinkedHashMap vs TreeMap vs Hashtable vs ConcurrentHashMap",
        star: true,
        tag: "HASHMAP",
        desc: `This comparison table is one of the most common interview questions. Know the differences cold.

HashMap:
  • No ordering guarantee. Iteration order can change after resize.
  • O(1) average get/put. Not thread-safe. Allows one null key, many null values.
  • Best choice for most single-threaded use cases.

LinkedHashMap:
  • Maintains INSERTION ORDER (default) or ACCESS ORDER (new LinkedHashMap<>(16, 0.75f, true)).
  • Achieved via a doubly-linked list connecting all entries in insertion/access order, in addition to the bucket array.
  • Slightly slower than HashMap (extra pointer updates). Same O(1) complexity.
  • Use case: building an LRU cache (access order + override removeEldestEntry()).

TreeMap:
  • SORTED by key's natural order (Comparable) or a custom Comparator.
  • Backed by Red-Black Tree — O(log n) for get/put/remove.
  • Provides navigation methods: firstKey(), lastKey(), floorKey(), ceilingKey(), headMap(), tailMap(), subMap().
  • Does NOT allow null keys (NullPointerException on comparison).
  • Use case: sorted map, range queries, priority-based access.

Hashtable (legacy, avoid):
  • Every method is synchronized → thread-safe but very slow (one global lock).
  • Does NOT allow null key or null value.
  • Extends Dictionary (old pre-Collections Framework class).
  • Replaced by ConcurrentHashMap for thread safety.

ConcurrentHashMap:
  • Thread-safe without locking the entire map.
  • Java 7: segment-level locking (16 segments by default).
  • Java 8+: CAS (Compare-And-Swap) operations + bucket-level synchronization (only locks the specific bucket being modified).
  • Does NOT allow null key or null value (ambiguity: null could mean "absent" or "mapped to null").
  • Provides atomic operations: putIfAbsent(), computeIfAbsent(), merge(), compute().`,
        code: `// ── HashMap: no order ─────────────────────────────────────
Map<String, Integer> hashMap = new HashMap<>();
hashMap.put("banana", 2); hashMap.put("apple", 1); hashMap.put("cherry", 3);
// Iteration order: unpredictable (could be apple, cherry, banana or any order)
hashMap.forEach((k, v) -> System.out.println(k + "=" + v));

// ── LinkedHashMap: insertion order ────────────────────────
Map<String, Integer> linkedMap = new LinkedHashMap<>();
linkedMap.put("banana", 2); linkedMap.put("apple", 1); linkedMap.put("cherry", 3);
// Iteration order: banana, apple, cherry (insertion order preserved)
linkedMap.forEach((k, v) -> System.out.println(k + "=" + v));

// ── LinkedHashMap as LRU Cache ────────────────────────────
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity; // evict oldest accessed when over capacity
    }
}
LRUCache<String, String> cache = new LRUCache<>(3);
cache.put("a", "1"); cache.put("b", "2"); cache.put("c", "3");
cache.get("a"); // access "a" → moves to end (most recently used)
cache.put("d", "4"); // triggers eviction of "b" (least recently used)

// ── TreeMap: sorted order ─────────────────────────────────
Map<String, Integer> treeMap = new TreeMap<>();
treeMap.put("banana", 2); treeMap.put("apple", 1); treeMap.put("cherry", 3);
// Iteration order: apple, banana, cherry (alphabetical)
TreeMap<String, Integer> tm = (TreeMap<String, Integer>) treeMap;
System.out.println(tm.firstKey());             // "apple"
System.out.println(tm.lastKey());              // "cherry"
System.out.println(tm.floorKey("blueberry"));  // "banana" (greatest key <= "blueberry")
System.out.println(tm.ceilingKey("apricot"));  // "banana" (smallest key >= "apricot")
System.out.println(tm.headMap("cherry"));      // {apple=1, banana=2} (exclusive)
System.out.println(tm.tailMap("banana"));      // {banana=2, cherry=3} (inclusive)

// ── ConcurrentHashMap: thread-safe ────────────────────────
Map<String, Integer> concMap = new ConcurrentHashMap<>();
concMap.putIfAbsent("counter", 0);
concMap.computeIfAbsent("list", k -> new ArrayList<>());
concMap.merge("counter", 1, Integer::sum); // atomic: counter += 1

// ── Comparison table ──────────────────────────────────────
// Feature           HashMap  LinkedHashMap  TreeMap  Hashtable  ConcurrentHashMap
// Ordering          None     Insertion/Access Sorted  None       None
// Thread-safe       No       No             No       Yes(slow)  Yes(fast)
// Null key          1 yes    1 yes          No       No         No
// Null values       Yes      Yes            Yes      No         No
// get/put time      O(1)avg  O(1)avg        O(log n) O(1)avg    O(1)avg
// Iteration         Unpred.  Ordered        Sorted   Unpred.    Unpred.`
      },
      {
        n: "HashMap in Java 8+ — Changes & Improvements",
        star: true,
        tag: "HASHMAP",
        desc: `Java 8 made significant improvements to HashMap that every senior developer should know.

TREEIFICATION (Java 8):
  Before Java 8, collision chains were always linked lists. If an attacker crafted many keys with the same hash, every get() on the map would take O(n) — a hash flooding denial-of-service attack. Java 8 added automatic conversion of long chains to Red-Black Trees, capping worst-case at O(log n).

NEW COMPUTE METHODS (Java 8 Map interface):
  These enable atomic-style operations without check-then-act race conditions:
  
  compute(k, (k, v) -> newVal): Update a mapping using current key and value.
  computeIfAbsent(k, k -> newVal): Create mapping only if key absent.
  computeIfPresent(k, (k, v) -> newVal): Update only if key is present.
  merge(k, val, (old, new) -> merged): Merge new value with existing using function.
  getOrDefault(k, defaultVal): Get or return default without inserting.
  putIfAbsent(k, v): Insert only if key not already present (returns existing).
  replaceAll((k, v) -> newV): Replace all values in-place.
  forEach((k, v) -> ...): Functional iteration.

HASH FUNCTION IMPROVEMENT (Java 8):
  The internal hash() function was simplified to: h ^ (h >>> 16)
  This is simpler than earlier versions but still provides good distribution
  because of the treeification safety net below.

RESIZE OPTIMIZATION (Java 8):
  When resizing, the new position of an entry is either:
  • Same index as before, OR
  • Old index + old capacity
  This can be determined by checking just one bit of the hash,
  avoiding full recomputation. Entries stay in the same relative order 
  within their new buckets (preserving insertion ordering within buckets).`,
        code: `// ── Java 8 compute methods ───────────────────────────────

// computeIfAbsent: build complex values lazily
Map<String, List<String>> groups = new HashMap<>();
// Old way (verbose + not atomic):
if (!groups.containsKey("fruits")) groups.put("fruits", new ArrayList<>());
groups.get("fruits").add("apple");

// New way (atomic, clean):
groups.computeIfAbsent("fruits", k -> new ArrayList<>()).add("apple");
groups.computeIfAbsent("vegs",   k -> new ArrayList<>()).add("carrot");
// {fruits=[apple], vegs=[carrot]}

// ── merge: word frequency count ──────────────────────────
String[] words = {"the","cat","sat","on","the","mat","the"};
Map<String, Integer> freq = new HashMap<>();

for (String word : words) {
    freq.merge(word, 1, Integer::sum);
    // If absent: put(word, 1)
    // If present: put(word, existing + 1)
}
// {the=3, cat=1, sat=1, on=1, mat=1}

// ── compute: conditional update ──────────────────────────
Map<String, Integer> scores = new HashMap<>();
scores.put("alice", 50);

// Double score if present, remove if result is null
scores.compute("alice", (k, v) -> v == null ? null : v * 2);
// alice → 100

scores.compute("bob", (k, v) -> v == null ? 10 : v + 10);
// bob → 10 (new entry)

// ── replaceAll: apply function to all values ──────────────
Map<String, Integer> salaries = new HashMap<>(Map.of("alice", 80000, "bob", 70000));
salaries.replaceAll((name, salary) -> salary + 5000); // 10% raise

// ── putIfAbsent vs computeIfAbsent ───────────────────────
// putIfAbsent: always evaluates the value expression
Map<String, List<String>> m1 = new HashMap<>();
m1.putIfAbsent("key", new ArrayList<>()); // new ArrayList<>() ALWAYS created (wasteful if key exists)

// computeIfAbsent: only evaluates lambda if key is absent (lazy - preferred)
Map<String, List<String>> m2 = new HashMap<>();
m2.computeIfAbsent("key", k -> new ArrayList<>()); // lambda called only if "key" absent`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "HashSet & LinkedHashSet",
    icon: "◌",
    color: "#10B981",
    desc: "Set implementations — no duplicates, backed by HashMap internally.",
    topics: [
      {
        n: "HashSet — Internal Working & Interview Points",
        star: true,
        tag: "SET",
        desc: `HashSet is simply a HashMap where the values are a dummy constant object (PRESENT). The keys of the underlying HashMap are the elements of the set. This is not a coincidence — it means HashSet inherits ALL of HashMap's characteristics: O(1) add/remove/contains, no guaranteed order, one null element allowed.

INTERNAL STRUCTURE:
  private transient HashMap<E, Object> map;
  private static final Object PRESENT = new Object(); // dummy value

  add(e)      → map.put(e, PRESENT)
  contains(e) → map.containsKey(e)
  remove(e)   → map.remove(e)

UNIQUENESS: Because HashMap doesn't allow duplicate keys, HashSet automatically enforces uniqueness — adding a duplicate just overwrites the PRESENT value with PRESENT (no-op).

EQUALS AND HASHCODE CONTRACT:
  This is critical: the same key equality rules from HashMap apply. If you store custom objects in a HashSet, you MUST override both equals() AND hashCode() consistently. Failing to override hashCode() means equals() works but two "equal" objects can exist in the same HashSet (they hash to different buckets, so HashSet doesn't know they are "equal").

PERFORMANCE: O(1) average for add, remove, contains. Worst case O(n) if all elements collide (but treeification caps it at O(log n) for long chains).

LinkedHashSet: A HashSet backed by a LinkedHashMap instead of HashMap. Maintains insertion order while still providing O(1) operations. Uses slightly more memory due to the doubly-linked list.

TreeSet: Backed by a TreeMap. Elements sorted by natural order or Comparator. O(log n) for add/remove/contains. Provides navigation: first(), last(), floor(), ceiling(), headSet(), tailSet(), subSet().`,
        code: `// ── HashSet internal: backed by HashMap ──────────────────
Set<String> set = new HashSet<>();
set.add("apple");   // internally: map.put("apple", PRESENT)
set.add("banana");
set.add("apple");   // duplicate → map.put("apple", PRESENT) again = no change
System.out.println(set.size()); // 2

set.contains("apple"); // → map.containsKey("apple") → O(1)
set.remove("banana");  // → map.remove("banana")     → O(1)

// ── The hashCode + equals trap ────────────────────────────
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    // Only overrides equals, NOT hashCode!
    @Override
    public boolean equals(Object o) {
        return o instanceof Point p && p.x == x && p.y == y;
    }
    // hashCode() uses Object.hashCode() → identity-based → different for each instance
}

Set<Point> points = new HashSet<>();
Point p1 = new Point(1, 2);
Point p2 = new Point(1, 2); // "equal" to p1 by equals()
points.add(p1);
points.add(p2); // NOT detected as duplicate! Different hashCode → different bucket
System.out.println(points.size()); // 2 !!! BUG

// Fix: always override both equals AND hashCode
record PointFixed(int x, int y) {}  // record auto-generates both
Set<PointFixed> fixedPoints = new HashSet<>();
fixedPoints.add(new PointFixed(1, 2));
fixedPoints.add(new PointFixed(1, 2)); // detected as duplicate
System.out.println(fixedPoints.size()); // 1 ✓

// ── LinkedHashSet: insertion order ────────────────────────
Set<String> linked = new LinkedHashSet<>();
linked.add("C"); linked.add("A"); linked.add("B");
System.out.println(linked); // [C, A, B] — insertion order!

// ── TreeSet: sorted order + navigation ────────────────────
TreeSet<Integer> tree = new TreeSet<>(Set.of(5, 2, 8, 1, 9, 3));
System.out.println(tree);             // [1, 2, 3, 5, 8, 9]
System.out.println(tree.first());     // 1
System.out.println(tree.last());      // 9
System.out.println(tree.floor(4));    // 3 (greatest <= 4)
System.out.println(tree.ceiling(4));  // 5 (smallest >= 4)
System.out.println(tree.headSet(5));  // [1, 2, 3] (< 5, exclusive)
System.out.println(tree.tailSet(5));  // [5, 8, 9] (>= 5, inclusive)
System.out.println(tree.subSet(2,7)); // [2, 3, 5] (>= 2 and < 7)

// ── Set operations (union, intersection, difference) ──────
Set<Integer> a = new HashSet<>(Set.of(1, 2, 3, 4));
Set<Integer> b = new HashSet<>(Set.of(3, 4, 5, 6));

Set<Integer> union = new HashSet<>(a);
union.addAll(b);          // {1,2,3,4,5,6}

Set<Integer> intersect = new HashSet<>(a);
intersect.retainAll(b);   // {3,4}

Set<Integer> diff = new HashSet<>(a);
diff.removeAll(b);        // {1,2}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "ArrayList & LinkedList",
    icon: "▦",
    color: "#A855F7",
    desc: "The two most-used List implementations — internal arrays vs doubly-linked nodes.",
    topics: [
      {
        n: "ArrayList — Dynamic Array Internals",
        star: true,
        tag: "LIST",
        desc: `ArrayList is backed by a plain Object array (Object[] elementData). It is a resizable array: when the array is full and a new element is added, a new larger array is created and all elements are copied.

INITIAL CAPACITY: Default is 10 when first element is added (the array starts as empty, grows to 10 on first add). You can specify initial capacity: new ArrayList<>(100).

GROWTH FORMULA: When the internal array is full:
  newCapacity = oldCapacity + (oldCapacity >> 1)  = oldCapacity * 1.5
  So: 10 → 15 → 22 → 33 → 49 → 73 → 109...

WHY 1.5x (not 2x like HashMap)?
  ArrayList chose a smaller growth factor to waste less memory (2x would mean up to 50% of the array is empty; 1.5x means up to 33% empty). The trade-off is slightly more frequent copies.

TIME COMPLEXITIES:
  get(index)        O(1)    — direct array access
  add(element)      O(1)    — amortized (O(n) on resize, but rare)
  add(index, elem)  O(n)    — must shift elements right
  remove(index)     O(n)    — must shift elements left  
  remove(Object)    O(n)    — linear search + shift
  contains(Object)  O(n)    — linear search
  size()            O(1)    — stored field

WHEN TO USE:
  • Random access by index (frequent get(i))
  • Mostly appending to end
  • Memory-efficient storage (no per-element overhead like LinkedList's node objects)
  • CPU cache-friendly (contiguous memory = cache line optimization)`,
        code: `// ── ArrayList internal growth ─────────────────────────────
ArrayList<Integer> list = new ArrayList<>(); // capacity=0 initially
// After first add: capacity grows to 10 (default)
// Capacity grows: 10 → 15 → 22 → 33 → 49 → 73...

// Check capacity via reflection (educational):
ArrayList<String> al = new ArrayList<>();
java.lang.reflect.Field f = ArrayList.class.getDeclaredField("elementData");
f.setAccessible(true);
for (int i = 0; i < 20; i++) {
    al.add("item" + i);
    Object[] arr = (Object[]) f.get(al);
    System.out.printf("size=%-3d capacity=%d%n", al.size(), arr.length);
}
// size=1  capacity=10
// ...
// size=10 capacity=10
// size=11 capacity=15  ← grew! (10 + 10>>1 = 15)
// ...
// size=15 capacity=15
// size=16 capacity=22  ← grew! (15 + 15>>1 = 22)

// ── Pre-size to avoid resizes ─────────────────────────────
ArrayList<Integer> preSized = new ArrayList<>(1000); // no resize for 1000 elements

// ── trimToSize: release unused capacity ──────────────────
ArrayList<String> trimmed = new ArrayList<>(100);
for (int i = 0; i < 10; i++) trimmed.add("item" + i);
System.out.println("Before trim capacity: 100");
trimmed.trimToSize(); // shrinks internal array to size 10
System.out.println("After trim capacity: 10");

// ── Add in the middle: O(n) shift ────────────────────────
List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5));
nums.add(2, 99); // insert 99 at index 2
// Before: [1, 2, 3, 4, 5]
// Shift:  elements at 2,3,4 shift right to 3,4,5
// After:  [1, 2, 99, 3, 4, 5]

// ── Remove by index vs by object ─────────────────────────
List<Integer> l = new ArrayList<>(List.of(1, 2, 3, 4));
l.remove(1);        // removes by INDEX → removes 2 → [1, 3, 4]
l.remove(Integer.valueOf(3)); // removes by VALUE → removes 3 → [1, 4]

// ── Avoid ArrayList for frequent middle insertions ────────
// This is O(n) for each insert, making a loop O(n²):
List<Integer> bad = new ArrayList<>();
for (int i = 0; i < 10000; i++) {
    bad.add(0, i);  // always insert at head → shifts everything right every time
}
// Use ArrayDeque.addFirst() or LinkedList.addFirst() instead → O(1) per insert`
      },
      {
        n: "LinkedList — Doubly-Linked Nodes & Deque",
        star: true,
        tag: "LIST",
        desc: `LinkedList is a doubly-linked list: each element is stored in a Node object that contains the element, a pointer to the next node, and a pointer to the previous node.

NODE STRUCTURE:
  private static class Node<E> {
      E item;
      Node<E> next;
      Node<E> prev;
  }

FIELDS:
  transient Node<E> first;  // head of list
  transient Node<E> last;   // tail of list
  transient int size;

LinkedList implements BOTH List AND Deque, making it the only standard class that can be used as a list, stack, queue, and double-ended queue.

TIME COMPLEXITIES:
  get(index)            O(n) — must traverse from head or tail
  add(element)          O(1) — adds to tail
  addFirst(element)     O(1) — adds to head
  addLast(element)      O(1) — adds to tail
  add(index, element)   O(n) — traverse to index, then O(1) pointer update
  remove(index)         O(n) — traverse to index, then O(1) pointer update
  removeFirst()         O(1) — direct head access
  removeLast()          O(1) — direct tail access
  contains(Object)      O(n) — linear search

MEMORY: Each element requires a Node wrapper (3 object references + object overhead). A LinkedList of 1 million integers uses ~5x more memory than an ArrayList of the same.

WHEN TO USE LinkedList over ArrayList:
  • Frequent insertions/deletions at head or tail: O(1) vs O(n) for ArrayList
  • Implementing a queue or deque where both ends are frequently modified
  • When you don't need random index access
  MOST of the time, ArrayDeque is a better choice than LinkedList for queue/stack use.`,
        code: `// ── LinkedList as List ───────────────────────────────────
LinkedList<String> list = new LinkedList<>();
list.add("B");          // addLast → O(1)
list.add("C");          // addLast → O(1)
list.addFirst("A");     // O(1) — add to head
list.addLast("D");      // O(1) — add to tail
// list = [A, B, C, D]

// get is O(n) — must traverse (unlike ArrayList's O(1))
String mid = list.get(2); // traverses from head: head→A→B→C → returns "C"

// ── LinkedList as Queue (FIFO) ────────────────────────────
Queue<String> queue = new LinkedList<>();
queue.offer("first");   // addLast O(1)
queue.offer("second");
queue.offer("third");

String head = queue.poll();  // removeFirst O(1) → "first"
String peek = queue.peek();  // "second" — no removal

// ── LinkedList as Stack (LIFO) ────────────────────────────
Deque<String> stack = new LinkedList<>();
stack.push("bottom");  // addFirst O(1)
stack.push("middle");
stack.push("top");

String top = stack.pop();  // removeFirst O(1) → "top"

// ── LinkedList as Deque ───────────────────────────────────
Deque<String> deque = new LinkedList<>();
deque.addFirst("A");
deque.addLast("B");
deque.addFirst("Z");   // [Z, A, B]
deque.peekFirst();     // "Z" — no removal
deque.peekLast();      // "B" — no removal
deque.pollFirst();     // "Z"
deque.pollLast();      // "B"

// ── ArrayList vs LinkedList comparison ───────────────────
//
// Operation            ArrayList    LinkedList
// get(i)               O(1)         O(n)
// add(e) to end        O(1) amort   O(1)
// add(0, e) to head    O(n)         O(1)
// add(i, e) middle     O(n)         O(n) traverse + O(1) insert
// remove(i)            O(n)         O(n) traverse + O(1) remove
// removeFirst()        O(n) shift   O(1)
// contains(e)          O(n)         O(n)
// Memory per element   ~4 bytes     ~48 bytes (Node object overhead)
// Cache performance    Excellent    Poor (scattered in heap)
//
// RULE OF THUMB: Default to ArrayList. Use LinkedList only for frequent head/tail ops.
// BETTER for queue: use ArrayDeque — faster than LinkedList due to array backing`
      },
      {
        n: "ArrayList vs LinkedList vs ArrayDeque — Which to Choose?",
        star: true,
        tag: "LIST",
        desc: `The choice between these three depends entirely on your access pattern. Here are the definitive rules.

USE ArrayList WHEN:
  • Most operations are get(i) — random index access
  • Elements are mostly appended to the end
  • Iterating through all elements (cache-friendly, fastest iteration)
  • Memory efficiency matters (no per-element node overhead)
  • You have a fixed or predictable number of elements (pre-size it)

USE LinkedList WHEN (rare in practice):
  • You need frequent O(1) insertion/deletion at BOTH head and tail
  • You're using it as a Deque with arbitrary end access
  • Actually... ArrayDeque is almost always faster. LinkedList is rarely the best choice.

USE ArrayDeque WHEN:
  • You need a stack (push/pop) or queue (offer/poll)
  • Replacing LinkedList for Deque use — ArrayDeque is faster and uses less memory
  • Never needs null elements (ArrayDeque prohibits null)
  ArrayDeque is backed by a resizable circular array, giving O(1) amortized for all Deque operations with excellent cache performance.

THE BENCHMARK TRUTH:
  For 90% of use cases: ArrayList
  For stack/queue: ArrayDeque
  For sorted: TreeSet/TreeMap  
  LinkedList is almost never the best choice in modern Java.

ITERATOR PERFORMANCE:
  All three have O(n) iteration, but ArrayList and ArrayDeque are cache-friendly (elements in contiguous memory), while LinkedList nodes are scattered across the heap, causing many cache misses. On modern CPUs, ArrayList iteration can be 5-10x faster than LinkedList iteration on large collections.`,
        code: `// ── ArrayDeque as Stack (faster than LinkedList) ──────────
Deque<String> stack = new ArrayDeque<>();  // ← prefer over LinkedList
stack.push("a");
stack.push("b");
stack.push("c");
System.out.println(stack.pop());  // "c" — LIFO

// ── ArrayDeque as Queue (faster than LinkedList) ──────────
Queue<String> queue = new ArrayDeque<>();  // ← prefer over LinkedList
queue.offer("first");
queue.offer("second");
System.out.println(queue.poll()); // "first" — FIFO

// ── ArrayDeque internal: circular array ───────────────────
// head and tail pointers move around a circular array
// addFirst: head moves left (wraps around)
// addLast: tail moves right (wraps around)
// No node allocation overhead — elements stored directly in array
// Initial capacity: 16, grows by doubling

// ── Performance comparison (micro-benchmark context) ──────
// Adding 1M elements to head:
// LinkedList:  ~90ms  (1M Node allocations, GC pressure)
// ArrayDeque:  ~15ms  (array, rare resizes)

// Iterating 1M elements:
// ArrayList:   ~5ms   (sequential memory, cache-friendly)
// ArrayDeque:  ~6ms   (sequential memory, cache-friendly)
// LinkedList:  ~50ms  (scattered memory, cache misses)

// ── When LinkedList wins: large middle insertions with iterator ──
// If you have a ListIterator positioned at a node,
// LinkedList.add() is O(1) at that position
// ArrayList.add() at that position is still O(n) (must shift)
LinkedList<Integer> ll = new LinkedList<>();
for (int i = 0; i < 5; i++) ll.add(i); // [0,1,2,3,4]
ListIterator<Integer> it = ll.listIterator(2); // positioned at index 2
it.add(99); // O(1)! inserts without shifting
System.out.println(ll); // [0, 1, 99, 2, 3, 4]`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "PriorityQueue & Sorting",
    icon: "△",
    color: "#F97316",
    desc: "PriorityQueue internals, min/max heap, custom comparators.",
    topics: [
      {
        n: "PriorityQueue — Binary Heap Internals",
        star: true,
        tag: "QUEUE",
        desc: `PriorityQueue is backed by a binary heap stored in an array. It always gives you the minimum (or maximum) element in O(1), and poll removes it in O(log n).

BINARY MIN-HEAP PROPERTY:
  Every parent node's value ≤ its children's values.
  The minimum is always at index 0 (the root).

ARRAY REPRESENTATION:
  Parent of node at index i  = (i - 1) / 2
  Left child of index i      = 2 * i + 1
  Right child of index i     = 2 * i + 2

  Example heap [1, 3, 2, 7, 4, 5, 6]:
         1        ← index 0 (min)
        / \
       3   2      ← indices 1, 2
      / \ / \
     7  4 5  6   ← indices 3,4,5,6

OFFER (add) — O(log n):
  1. Add element at the next available position (end of array).
  2. Sift UP: compare with parent. If smaller than parent, swap. Repeat until heap property is restored or root is reached.

POLL (remove min) — O(log n):
  1. Return element at index 0 (the minimum).
  2. Move last element to index 0.
  3. Sift DOWN: compare with children. Swap with smallest child if smaller than current. Repeat until heap property is restored or leaf is reached.

PEEK — O(1):
  Return element at index 0. No structural change.

PriorityQueue does NOT guarantee sorted iteration! Calling iterator() or forEach() does NOT return elements in priority order. Only poll() is guaranteed to return elements in priority order.

NULL: PriorityQueue does NOT allow null elements (NullPointerException).`,
        code: `// ── Min-heap (default) ───────────────────────────────────
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
minHeap.offer(2);
minHeap.offer(4);

// Internal array: [1, 2, 3, 5, 4] — heap property maintained
System.out.println(minHeap.peek()); // 1 — O(1), minimum always at root

while (!minHeap.isEmpty()) {
    System.out.print(minHeap.poll() + " "); // 1 2 3 4 5 — sorted order via poll
}

// ── Max-heap ──────────────────────────────────────────────
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(5); maxHeap.offer(1); maxHeap.offer(3);
System.out.println(maxHeap.peek()); // 5 — maximum at root
maxHeap.poll(); // 5
maxHeap.poll(); // 3
maxHeap.poll(); // 1

// ── Custom object with comparator ─────────────────────────
record Task(String name, int priority) {}

// Process highest priority (lowest number) first
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::priority)
);
taskQueue.offer(new Task("Low",  3));
taskQueue.offer(new Task("High", 1));
taskQueue.offer(new Task("Med",  2));

while (!taskQueue.isEmpty()) {
    System.out.println(taskQueue.poll().name()); // High, Med, Low
}

// ── Kth largest element pattern ───────────────────────────
int[] nums = {3, 2, 1, 5, 6, 4};
int k = 2;
PriorityQueue<Integer> kthLargest = new PriorityQueue<>(); // min-heap of size k
for (int n : nums) {
    kthLargest.offer(n);
    if (kthLargest.size() > k) kthLargest.poll(); // remove smallest
}
System.out.println(kthLargest.peek()); // 5 — kth largest

// ── WARNING: iteration order is NOT sorted! ───────────────
PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 3, 2, 4));
System.out.println(pq); // [1, 2, 3, 5, 4] — heap order, NOT sorted!
// Only poll() is sorted. Use TreeSet if you need sorted iteration.

// ── Initial capacity for performance ─────────────────────
PriorityQueue<Integer> largePQ = new PriorityQueue<>(10000); // avoid resizing`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Concurrent Collections",
    icon: "⇆",
    color: "#EC4899",
    desc: "Thread-safe collections — ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue internals.",
    topics: [
      {
        n: "ConcurrentHashMap — Segment Locking to CAS",
        star: true,
        tag: "CONCURRENT",
        desc: `ConcurrentHashMap provides thread safety without the performance penalty of synchronized HashMap or Hashtable.

JAVA 7 IMPLEMENTATION — SEGMENT LOCKING:
  The map was divided into 16 Segments by default (each is a mini HashMap with its own ReentrantLock).
  Reads: lock-free (volatile reads).
  Writes: lock only the affected segment — 16 threads could write simultaneously to different segments.
  Concurrency level (number of segments) was configurable: new ConcurrentHashMap<>(16, 0.75f, 32).

JAVA 8+ IMPLEMENTATION — CAS + SYNCHRONIZED ON BUCKET:
  Segments are gone. The implementation uses:
  • CAS (Compare-And-Swap) for inserting into an empty bucket — no locking at all.
  • synchronized(bucket_head_node) for non-empty buckets — locks only ONE bucket (one linked list node), not the entire map or a segment.
  This gives finer-grained locking: up to N threads can write concurrently where N = number of non-empty buckets.

KEY DIFFERENCES FROM HashMap:
  • No null key, no null value — ambiguity between "key not present" and "key maps to null".
  • size() is approximate — returns a rough estimate. Use mappingCount() for better accuracy on large maps.
  • Atomic operations: putIfAbsent(), computeIfAbsent(), merge(), compute() are atomic at the entry level.
  • Weakly consistent iterators: iteration sees the state at some point during or after iterator creation. Will not throw ConcurrentModificationException.

READ OPERATIONS (get, containsKey): Always lock-free in Java 8+. Uses volatile reads of the bucket head.

WHEN TO USE: Any shared mutable map accessed by multiple threads. Prefer over Collections.synchronizedMap() which locks the entire map for every operation.`,
        code: `// ── ConcurrentHashMap thread-safe operations ──────────────
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// Thread 1
map.put("a", 1);
map.putIfAbsent("b", 2); // atomic: insert only if absent

// Thread 2 simultaneously
map.computeIfAbsent("c", k -> expensiveCompute(k)); // atomic + lazy

// ── Atomic counter pattern ────────────────────────────────
ConcurrentHashMap<String, Integer> wordCount = new ConcurrentHashMap<>();

// Thread-safe word counting (no race condition):
wordCount.merge("hello", 1, Integer::sum);
// merge is atomic: if "hello" absent → put(hello, 1)
//                  if "hello" present → put(hello, existing + 1)

// ── Segment locking (Java 7 concept) vs CAS (Java 8+) ────
//
// Java 7 (16 segments):
//   map divided into 16 mini-HashMaps (Segments)
//   put("a", 1) → lock segment for "a", write, unlock
//   put("z", 26) → lock segment for "z", write, unlock (DIFFERENT segment, no contention)
//
// Java 8+ (per-bucket CAS):
//   empty bucket: CAS → no lock at all
//   non-empty:    synchronized(first_node_of_bucket) → micro-lock

// ── size() vs mappingCount() ──────────────────────────────
ConcurrentHashMap<String, Integer> big = new ConcurrentHashMap<>();
// Internally uses LongAdder (per-thread counters) for size
// size() sums all counters — snapshot may not be perfectly accurate during concurrent writes
System.out.println(big.size());          // approximate
System.out.println(big.mappingCount()); // better for large maps (returns long)

// ── Null prohibition ──────────────────────────────────────
ConcurrentHashMap<String, String> cnc = new ConcurrentHashMap<>();
// cnc.put(null, "value"); // NullPointerException!
// cnc.put("key", null);   // NullPointerException!

// WHY? Ambiguity:
// map.get("key") == null could mean:
//   (a) key not in map, OR (b) key maps to null
// In a concurrent context you can't safely distinguish without an extra containsKey() call
// → null is prohibited to eliminate the ambiguity

// ── forEach with parallelism ──────────────────────────────
map.forEach(4, (k, v) ->                        // parallelism threshold=4
    System.out.println(k + "=" + v));
long sum = map.reduceValues(4, Integer::sum);   // parallel reduce`
      },
      {
        n: "CopyOnWriteArrayList & BlockingQueue",
        hot: false,
        tag: "CONCURRENT",
        desc: `CopyOnWriteArrayList:
  Every mutative operation (add, set, remove) creates a FRESH COPY of the underlying array. The old array is still being used by any iterators that were created before the modification — they see a consistent snapshot and never throw ConcurrentModificationException.

  Cost: O(n) for every write (copy entire array). O(1) for reads.
  Use only when: reads vastly outnumber writes (event listener lists, rarely-updated config, observer lists).

BlockingQueue:
  A thread-safe queue that BLOCKS the producer when the queue is full and BLOCKS the consumer when the queue is empty. This is the preferred way to implement Producer-Consumer in Java.

  Key implementations:
  • LinkedBlockingQueue: optionally bounded (default Integer.MAX_VALUE). Uses separate head and tail locks — allows concurrent put() and take() when not at capacity boundary.
  • ArrayBlockingQueue: bounded, backed by array. Single lock for both ends. Fair mode available (FIFO among waiting threads).
  • PriorityBlockingQueue: unbounded priority queue — blocks only on take() when empty.
  • SynchronousQueue: zero-capacity — every put() blocks until a take() matches it. Direct handoff between threads.
  • DelayQueue: elements can only be taken when their delay expires.

  Key methods:
  • put(e): blocks if full
  • take(): blocks if empty
  • offer(e, timeout, unit): blocks up to timeout
  • poll(timeout, unit): blocks up to timeout
  • offer(e): non-blocking, returns false if full
  • poll(): non-blocking, returns null if empty`,
        code: `// ── CopyOnWriteArrayList ─────────────────────────────────
CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
cowList.add("A"); cowList.add("B"); cowList.add("C");

// Iterator captures a snapshot of the array at this point
Iterator<String> iter = cowList.iterator();

// Another thread adds while iteration is in progress
cowList.add("D"); // creates new array ["A","B","C","D"] — snapshot unaffected

// Iterator still sees ["A","B","C"] — NO ConcurrentModificationException
while (iter.hasNext()) System.out.println(iter.next()); // A, B, C only

// ── Producer-Consumer with LinkedBlockingQueue ─────────────
BlockingQueue<String> queue = new LinkedBlockingQueue<>(100); // bounded: max 100

// Producer thread
Thread producer = new Thread(() -> {
    try {
        for (int i = 0; i < 1000; i++) {
            queue.put("task-" + i); // BLOCKS if queue is full (100 items)
        }
    } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
});

// Consumer thread
Thread consumer = new Thread(() -> {
    try {
        while (true) {
            String task = queue.take(); // BLOCKS if queue is empty
            process(task);
        }
    } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
});

// ── ArrayBlockingQueue: fair mode ─────────────────────────
// fair=true: threads waiting to put/take are served in FIFO order
// fair=false (default): no ordering guarantee, higher throughput
BlockingQueue<Integer> fair   = new ArrayBlockingQueue<>(10, true);
BlockingQueue<Integer> unfair = new ArrayBlockingQueue<>(10, false);

// ── SynchronousQueue: direct handoff ─────────────────────
BlockingQueue<String> handoff = new SynchronousQueue<>();
// No buffering: put() blocks until a thread calls take()
// Perfect for thread pool task handoff (used by Executors.newCachedThreadPool())

Thread putter = new Thread(() -> {
    try { handoff.put("direct-handoff"); } catch (InterruptedException e) {}
});
Thread taker = new Thread(() -> {
    try { System.out.println(handoff.take()); } catch (InterruptedException e) {}
});
putter.start(); taker.start(); // they synchronize and exchange directly`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Iterators & Fail-Fast vs Fail-Safe",
    icon: "⇢",
    color: "#8B5CF6",
    desc: "How iteration works internally, ConcurrentModificationException, and safe concurrent iteration.",
    topics: [
      {
        n: "Iterator, ListIterator, Fail-Fast vs Fail-Safe",
        star: true,
        tag: "ITERATOR",
        desc: `Every Collection can produce an Iterator via iterator(). Understanding how iterators work and when they throw ConcurrentModificationException is a common interview topic.

FAIL-FAST ITERATORS (ArrayList, HashMap, HashSet, LinkedList):
  These collections maintain a modCount counter that is incremented on every structural modification (add, remove, clear, etc.). When an iterator is created, it captures the current modCount as expectedModCount. Before every next() or remove() call, the iterator checks: if (modCount != expectedModCount) throw ConcurrentModificationException.
  
  This is a best-effort mechanism — it is not guaranteed to detect all concurrent modifications (the check is not synchronized). Do not rely on it for thread safety; it is a debugging aid.

PROPER WAY TO REMOVE DURING ITERATION:
  Never call collection.remove() inside a for-each loop — that modifies modCount and causes ConcurrentModificationException. Use iterator.remove() which updates both modCount and expectedModCount.

FAIL-SAFE ITERATORS (CopyOnWriteArrayList, ConcurrentHashMap):
  These iterate over a snapshot of the collection taken at iterator creation time. Modifications to the collection are not reflected in the iterator, and ConcurrentModificationException is never thrown. The trade-off: stale data during iteration, and extra memory for the snapshot.

LISTITERATOR:
  A bidirectional iterator for List. Can traverse both forward and backward. Can add() and set() elements at the current position. Critical: ListIterator tracks lastRet (last returned element index) and uses it for remove()/set() operations.

FOR-EACH is syntactic sugar for Iterator:
  for (String s : list) → compiles to → Iterator<String> it = list.iterator(); while(it.hasNext()) { String s = it.next(); ... }`,
        code: `// ── Basic Iterator usage ─────────────────────────────────
List<String> list = new ArrayList<>(List.of("A","B","C","D"));

Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    if (s.equals("B")) {
        it.remove(); // SAFE: updates modCount internally
    }
}
System.out.println(list); // [A, C, D]

// ── WRONG: ConcurrentModificationException ────────────────
try {
    for (String s : list) {
        if (s.equals("C")) {
            list.remove(s); // modifies modCount → iterator detects → throws!
        }
    }
} catch (ConcurrentModificationException e) {
    System.out.println("CME thrown!"); // ← always thrown
}

// ── CORRECT: removeIf (Java 8+, cleanest approach) ────────
list.removeIf(s -> s.equals("D")); // internally safe
System.out.println(list); // [A]

// ── modCount demonstration ────────────────────────────────
ArrayList<Integer> al = new ArrayList<>(List.of(1, 2, 3));
Iterator<Integer> iter = al.iterator();
al.add(4); // modCount++ — iterator's expectedModCount is now stale
try {
    iter.next(); // checks modCount != expectedModCount → CME!
} catch (ConcurrentModificationException e) {
    System.out.println("CME! List was modified during iteration");
}

// ── ListIterator: bidirectional, add/set ──────────────────
List<String> lst = new ArrayList<>(List.of("A", "B", "C"));
ListIterator<String> lit = lst.listIterator();

// Forward
while (lit.hasNext()) {
    String s = lit.next();
    lit.set(s.toLowerCase()); // replace with lowercase
}
System.out.println(lst); // [a, b, c]

// Backward
while (lit.hasPrevious()) {
    System.out.print(lit.previous() + " "); // c b a
}

// Add at current position
lit = lst.listIterator(1); // position cursor at index 1
lit.add("X"); // inserts before index 1
System.out.println(lst); // [a, X, b, c]

// ── Fail-safe: CopyOnWriteArrayList never throws CME ──────
CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>(List.of("A","B","C"));
for (String s : cowList) {
    cowList.add("X"); // modifies underlying list — iterator sees snapshot, no CME
}
System.out.println(cowList.size()); // 6 (original 3 + 3 X's added)`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Utility Methods & Algorithms",
    icon: "★",
    color: "#06B6D4",
    desc: "Collections utility class, sorting, searching, unmodifiable wrappers, and common patterns.",
    topics: [
      {
        n: "Collections Utility Class & Java 9+ Factory Methods",
        star: true,
        tag: "UTILITY",
        desc: `The java.util.Collections class provides static utility methods for working with collections: sorting, searching, reversing, shuffling, finding min/max, and creating synchronized/unmodifiable wrappers.

KEY SORT: Collections.sort() uses Timsort — a hybrid merge sort + insertion sort algorithm. It is O(n log n) in all cases but takes advantage of existing partial ordering (runs) in the data, making it very efficient in practice. Timsort is stable (preserves original order of equal elements). As of Java 8, List.sort() is preferred over Collections.sort().

BINARY SEARCH: Collections.binarySearch() requires the list to be sorted. Returns the index if found, or -(insertion point + 1) if not found. Works in O(log n) for RandomAccess lists (ArrayList) but O(n) for LinkedList (sequential traversal to reach the midpoint).

UNMODIFIABLE WRAPPERS: Collections.unmodifiableList(), unmodifiableMap(), unmodifiableSet() — wrap a collection in a view that throws UnsupportedOperationException on any mutative operation. The underlying collection is still modifiable directly. This is a view, not a copy.

JAVA 9+ IMMUTABLE FACTORIES: List.of(), Set.of(), Map.of() create truly immutable collections. They:
  • Throw UnsupportedOperationException on any mutation.
  • Are compact (no extra wrapper class).
  • Disallow null elements or keys (NullPointerException).
  • Iteration order for Set and Map keys is not guaranteed.
  • Cannot be used as the backing collection when you need mutability.
  
DIFFERENCE: Collections.unmodifiableList(list) wraps a mutable list (the original can still be mutated from another reference). List.of() creates a completely independent, permanently immutable object.`,
        code: `// ── Sorting ───────────────────────────────────────────────
List<Integer> nums = new ArrayList<>(List.of(5, 2, 8, 1, 9, 3));
Collections.sort(nums);                          // [1, 2, 3, 5, 8, 9]
nums.sort(Comparator.reverseOrder());            // [9, 8, 5, 3, 2, 1]
nums.sort(Comparator.naturalOrder());            // [1, 2, 3, 5, 8, 9]

// Sort objects
List<String> names = new ArrayList<>(List.of("Charlie","Alice","Bob"));
Collections.sort(names);                         // [Alice, Bob, Charlie]
names.sort(Comparator.comparing(String::length)); // [Bob, Alice, Charlie] (by length)
names.sort(Comparator.comparing(String::length)
          .thenComparing(Comparator.naturalOrder())); // stable multi-key sort

// ── Binary search ─────────────────────────────────────────
List<Integer> sorted = List.of(1, 3, 5, 7, 9, 11);
System.out.println(Collections.binarySearch(sorted, 7));  // 3 (index)
System.out.println(Collections.binarySearch(sorted, 4));  // -3 (-(2+1), would be at index 2)
// Decode: -(result + 1) = -((-3) + 1) = 2 → would insert at index 2

// ── Min / Max / Frequency ─────────────────────────────────
List<Integer> list = List.of(3, 1, 4, 1, 5, 9, 2, 6);
System.out.println(Collections.min(list));               // 1
System.out.println(Collections.max(list));               // 9
System.out.println(Collections.frequency(list, 1));      // 2 (count of 1s)

// ── Reverse, shuffle, swap ────────────────────────────────
List<Integer> mutable = new ArrayList<>(List.of(1, 2, 3, 4, 5));
Collections.reverse(mutable);                     // [5, 4, 3, 2, 1]
Collections.shuffle(mutable);                     // random order
Collections.shuffle(mutable, new Random(42));     // deterministic shuffle (seeded)
Collections.swap(mutable, 0, 4);                  // swap index 0 and 4
Collections.fill(mutable, 0);                     // fill all with 0
Collections.copy(new ArrayList<>(mutable), mutable); // copy src into dest

// ── Unmodifiable wrappers ─────────────────────────────────
List<String> base = new ArrayList<>(List.of("a", "b", "c"));
List<String> unmod = Collections.unmodifiableList(base);

try {
    unmod.add("d"); // UnsupportedOperationException
} catch (UnsupportedOperationException e) { System.out.println("Can't modify!"); }

base.add("d"); // This STILL works — unmod is a VIEW of base
System.out.println(unmod); // [a, b, c, d] — change is visible through the view!

// ── Java 9+ truly immutable ───────────────────────────────
List<String> immList = List.of("a", "b", "c");       // no nulls, immutable
Set<String>  immSet  = Set.of("x", "y", "z");        // no nulls, no dups, immutable
Map<String,Integer> immMap = Map.of("a",1,"b",2);    // no nulls, immutable

// ── Collections.nCopies ──────────────────────────────────
List<String> nCopies = Collections.nCopies(5, "hello"); // [hello, hello, hello, hello, hello]
// Immutable, all elements are the SAME reference (memory efficient)`
      },
      {
        n: "Common Interview Patterns with Collections",
        star: true,
        tag: "UTILITY",
        desc: `These patterns come up repeatedly in coding interviews and production code. Master these before any Java interview.

FREQUENCY MAP: Use HashMap<T, Integer> with merge(k, 1, Integer::sum) to count occurrences of elements. Essential for anagram detection, word frequency, finding duplicates.

GROUPING: LinkedHashMap preserves insertion order for grouped results. Useful for GroupBy operations without streams.

TWO-SUM PATTERN: Use a HashMap to store seen elements and look up complement in O(1) — reducing O(n²) brute force to O(n).

SLIDING WINDOW WITH MAP: Use a HashMap to track character frequencies in a window. Expand/shrink window based on the frequency map state.

TOP K PATTERN: PriorityQueue of size K (min-heap). Process all elements, keeping only the K largest. O(n log k) instead of O(n log n) full sort.

DEDUPLICATION WITH LINKED HASH SET: LinkedHashSet removes duplicates while preserving insertion order — a one-liner deduplication that ArrayList + contains() cannot match efficiently.`,
        code: `// ── Frequency map ────────────────────────────────────────
String[] words = {"apple","banana","apple","cherry","banana","apple"};
Map<String, Long> freq = new LinkedHashMap<>();
for (String w : words) freq.merge(w, 1L, Long::sum);
// {apple=3, banana=2, cherry=1}

// Most frequent element
String mostFreq = freq.entrySet().stream()
    .max(Map.Entry.comparingByValue())
    .map(Map.Entry::getKey)
    .orElseThrow();
// "apple"

// ── Two-sum O(n) ─────────────────────────────────────────
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // value → index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(nums[i], i);
    }
    return new int[]{};
}

// ── Sliding window: longest substring no repeat ───────────
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastIndex = new HashMap<>();
    int max = 0;
    for (int left = 0, right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastIndex.containsKey(c) && lastIndex.get(c) >= left) {
            left = lastIndex.get(c) + 1; // shrink window
        }
        lastIndex.put(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}

// ── Top K frequent elements ───────────────────────────────
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq2 = new HashMap<>();
    for (int n : nums) freq2.merge(n, 1, Integer::sum);

    PriorityQueue<Integer> minHeap = new PriorityQueue<>(
        Comparator.comparingInt(freq2::get)); // min-heap by frequency

    for (int n : freq2.keySet()) {
        minHeap.offer(n);
        if (minHeap.size() > k) minHeap.poll(); // evict least frequent
    }

    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) result[i] = minHeap.poll();
    return result;
}

// ── Deduplication preserving order ───────────────────────
List<String> duped = List.of("C","A","B","A","C","D");
List<String> deduped = new ArrayList<>(new LinkedHashSet<>(duped));
// [C, A, B, D] — order preserved, duplicates removed — O(n)

// ── Group anagrams ────────────────────────────────────────
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        groups.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Performance & Complexity Summary",
    icon: "⚡",
    color: "#10B981",
    desc: "Big-O cheat sheet, memory costs, and when to use each collection.",
    topics: [
      {
        n: "Big-O Cheat Sheet & Decision Guide",
        star: true,
        tag: "PERFORMANCE",
        desc: `LEGEND:
  n = number of elements currently in the collection
  k = key or element being looked up
  avg = average case (amortized for ArrayList add/ArrayDeque)
  * = amortized — occasionally O(n) for resize but O(1) amortized over many operations

CHOOSING THE RIGHT COLLECTION — DECISION TREE:
  
  Need key-value lookup?
    Yes → Need thread safety?
            Yes → ConcurrentHashMap
            No  → Need sorted keys?
                    Yes → TreeMap (O(log n) ops, navigation methods)
                    No  → Need insertion order?
                            Yes → LinkedHashMap (LRU cache: access order)
                            No  → HashMap (fastest, most common)
    No  → Need unique elements only?
            Yes → Need sorted?
                    Yes → TreeSet (O(log n), navigation)
                    No  → Need insertion order? → LinkedHashSet : HashSet
            No  → Need index access (get(i))?
                    Yes → ArrayList (O(1) get, O(n) insert-middle)
                    No  → Need priority order?
                            Yes → PriorityQueue (O(1) peek, O(log n) poll)
                            No  → Need queue/stack with head+tail access?
                                    Yes → ArrayDeque (O(1) both ends)
                                    No  → ArrayList`,
        code: `// ── Time Complexity Cheat Sheet ─────────────────────────
//
// COLLECTION        ADD/OFFER  GET(idx)  REMOVE   CONTAINS  ITERATOR
// ArrayList         O(1)*      O(1)      O(n)     O(n)      O(n)
// LinkedList        O(1)†      O(n)      O(1)†    O(n)      O(n)
// ArrayDeque        O(1)*      O(n)      O(1)†    O(n)      O(n)
// HashSet           O(1)*      —         O(1)*    O(1)*     O(n)
// LinkedHashSet     O(1)*      —         O(1)*    O(1)*     O(n)
// TreeSet           O(log n)   —         O(log n) O(log n)  O(n)
// HashMap           O(1)*      O(1)*     O(1)*    O(1)*     O(n)
// LinkedHashMap     O(1)*      O(1)*     O(1)*    O(1)*     O(n)
// TreeMap           O(log n)   O(log n)  O(log n) O(log n)  O(n)
// ConcurrentHashMap O(1)*      O(1)*     O(1)*    O(1)*     O(n)
// PriorityQueue     O(log n)   O(1)peek  O(log n) O(n)      O(n)
//
// * = amortized O(1) (occasional O(n) resize)
// † = O(1) at head/tail only

// ── Memory overhead per element (approximate) ─────────────
// ArrayList:          4 bytes (int reference in array)
//                     + 4-8 bytes padding on resize
// LinkedList:         48 bytes per node (Node object + 3 references + header)
// HashMap entry:      32-48 bytes per entry (Node object overhead)
// TreeMap entry:      48-64 bytes per entry (TreeNode is larger — 5 references)
// HashSet:            same as HashMap (backed by it)

// ── When to pre-size ─────────────────────────────────────
int n = 10_000;

// ArrayList: avoid 7 resizes (10→15→22→33→49→73→109→163...)
List<Integer> al = new ArrayList<>(n);

// HashMap: avoid resizes, prevent collision build-up
// optimal capacity = n / loadFactor = 10000 / 0.75 ≈ 13334 → next power of 2 = 16384
Map<String, Integer> hm = new HashMap<>((int)(n / 0.75) + 1);

// ── Synchronized wrappers (legacy — prefer concurrent classes) ──
// Wraps entire collection — global lock on every operation (poor concurrency)
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());
// Even iteration must be manually synchronized:
synchronized (syncList) {
    for (String s : syncList) { System.out.println(s); }
}
// BETTER: CopyOnWriteArrayList, ConcurrentHashMap

// ── Null handling matrix ──────────────────────────────────
// Collection          Null Key   Null Value
// HashMap             1 yes      yes (multiple)
// LinkedHashMap       1 yes      yes
// TreeMap             NO (NPE)   yes
// Hashtable           NO         NO
// ConcurrentHashMap   NO         NO
// HashSet             1 null     —
// TreeSet             NO (NPE)   —
// ArrayDeque          NO (NPE)   —
// PriorityQueue       NO (NPE)   —`
      },
    ]
  },
];

const TAG_META = {
  OVERVIEW:    { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  HASHMAP:     { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  SET:         { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  LIST:        { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  QUEUE:       { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  CONCURRENT:  { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  ITERATOR:    { bg: "#2A1A4A", text: "#8B5CF6", border: "#3A206A" },
  UTILITY:     { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  PERFORMANCE: { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
};

export default function JavaCollections() {
  return (
    <RevisionNotesLayout
      pageKey="collections"
      title="Java Collections Framework"
      subtitle="Unified architecture for storing and manipulating groups of objects with internals, complexity, and code examples."
      categoryIcon="📦"
      categoryColor="#10B981"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}

export { SECTIONS };
