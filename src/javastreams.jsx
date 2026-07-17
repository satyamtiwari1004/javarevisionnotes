import { useState, useMemo } from "react";

const SECTIONS = [
  {
    cat: "Stream Creation",
    icon: "⊕",
    color: "#06B6D4",
    desc: "Ways to create streams from various data sources.",
    topics: [
      {
        n: "Stream.of, Arrays.stream, Collection.stream",
        tag: "CREATION",
        desc: "Most common ways to create a stream. Collection.stream() is the most frequent — every List, Set, Map turns into a stream. Stream.of() is handy for fixed values. Arrays.stream() handles primitive and object arrays.",
        code: `// ── From a Collection ─────────────────────────────────────
List<String> names = List.of("Alice", "Bob", "Carol", "Dave");
Stream<String> fromList = names.stream();
Stream<String> parallel = names.parallelStream();   // parallel variant

// ── From values directly ───────────────────────────────────
Stream<String> fromOf    = Stream.of("a", "b", "c");
Stream<String> singleOf  = Stream.of("only-one");
Stream<Object> empty     = Stream.empty();

// ── From an array ─────────────────────────────────────────
String[] arr = {"x", "y", "z"};
Stream<String>  fromArray  = Arrays.stream(arr);
Stream<String>  sliced     = Arrays.stream(arr, 1, 3);   // y, z

int[]    ints  = {1, 2, 3, 4, 5};
IntStream fromInts = Arrays.stream(ints);   // specialized IntStream

// ── From a Map (entry set) ────────────────────────────────
Map<String, Integer> scores = Map.of("Alice", 95, "Bob", 80);
Stream<Map.Entry<String, Integer>> entries = scores.entrySet().stream();
Stream<String> keys   = scores.keySet().stream();
Stream<Integer> vals  = scores.values().stream();

// ── Primitive specialized streams ─────────────────────────
IntStream    range     = IntStream.range(0, 10);       // 0..9 exclusive
IntStream    rangeClosed = IntStream.rangeClosed(1, 5); // 1..5 inclusive
LongStream   longs     = LongStream.of(100L, 200L, 300L);
DoubleStream doubles   = DoubleStream.of(1.1, 2.2, 3.3);

// ── From a String ─────────────────────────────────────────
IntStream chars  = "Hello".chars();          // character code points
Stream<String> lines = "a\nb\nc".lines();    // split by line breaks (Java 11+)

// ── From a file ───────────────────────────────────────────
try (Stream<String> fileLines = Files.lines(Path.of("data.txt"))) {
    fileLines.forEach(System.out::println);   // auto-closed after try
}

// ── Builder ───────────────────────────────────────────────
Stream<String> built = Stream.<String>builder()
    .add("one").add("two").add("three")
    .build();`
      },
      {
        n: "Stream.generate, Stream.iterate, Stream.concat",
        tag: "CREATION",
        desc: "Infinite streams from generators and iterators. Always pair with limit() or takeWhile() to avoid infinite loops. Stream.concat() merges two streams lazily.",
        code: `// ── Stream.generate — infinite, stateless supplier ────────
Stream<Double> randoms   = Stream.generate(Math::random).limit(5);
Stream<String> constants = Stream.generate(() -> "ping").limit(3);
Stream<UUID>   ids       = Stream.generate(UUID::randomUUID).limit(10);

// ── Stream.iterate — infinite, dependent on previous value ─
// Java 9+ 3-arg form (like a for loop):
Stream<Integer> evens = Stream.iterate(0, n -> n < 20, n -> n + 2);
// Prints: 0 2 4 6 8 10 12 14 16 18

// Java 8 2-arg form — must pair with limit/takeWhile
Stream<Integer> powers = Stream.iterate(1, n -> n * 2).limit(10);
// 1 2 4 8 16 32 64 128 256 512

// Fibonacci sequence
Stream.iterate(new long[]{0, 1}, f -> new long[]{f[1], f[0] + f[1]})
      .limit(10)
      .map(f -> f[0])
      .forEach(System.out::println);  // 0 1 1 2 3 5 8 13 21 34

// ── Stream.concat — lazy merge of two streams ────────────
Stream<String> first  = Stream.of("a", "b", "c");
Stream<String> second = Stream.of("d", "e", "f");
Stream<String> merged = Stream.concat(first, second);  // a b c d e f

// Merge multiple streams
List<Stream<String>> streams = List.of(
    Stream.of("1","2"), Stream.of("3","4"), Stream.of("5")
);
Stream<String> all = streams.stream().reduce(Stream.empty(), Stream::concat);

// ── Stream from Optional ──────────────────────────────────
Optional<String> opt = Optional.of("value");
Stream<String> fromOpt = opt.stream();   // Java 9+; empty stream if empty Optional

// ── Stream from Spliterator ───────────────────────────────
Spliterator<String> split = names.spliterator();
Stream<String> fromSplit  = StreamSupport.stream(split, false);`
      },
    ]
  },
  {
    cat: "Intermediate Operations",
    icon: "⇢",
    color: "#F59E0B",
    desc: "Lazy operations — return a new Stream. Nothing executes until a terminal operation is called.",
    topics: [
      {
        n: "filter — keep elements matching a predicate",
        tag: "INTERMEDIATE",
        desc: "filter(Predicate<T>) keeps only elements for which the predicate returns true. It is lazy — no elements are evaluated until a terminal op is called. Combine multiple filters or use && in one predicate.",
        code: `List<Employee> employees = List.of(
    new Employee("Alice", "Engineering", 95000, true),
    new Employee("Bob",   "Marketing",   60000, true),
    new Employee("Carol", "Engineering", 80000, false),
    new Employee("Dave",  "HR",          55000, true)
);

// ── Basic filter ──────────────────────────────────────────
List<Employee> engineers = employees.stream()
    .filter(e -> e.department().equals("Engineering"))
    .collect(Collectors.toList());
// [Alice, Carol]

// ── Multiple filters (each is AND logic) ─────────────────
List<Employee> activeEngineers = employees.stream()
    .filter(e -> e.department().equals("Engineering"))
    .filter(Employee::isActive)
    .collect(Collectors.toList());
// [Alice]

// ── Equivalent single filter with && ──────────────────────
List<Employee> same = employees.stream()
    .filter(e -> e.department().equals("Engineering") && e.isActive())
    .collect(Collectors.toList());

// ── Filter with method reference ─────────────────────────
List<String> nonEmpty = Stream.of("a", "", "b", null, "c")
    .filter(s -> s != null && !s.isEmpty())
    .collect(Collectors.toList());  // [a, b, c]

// ── Filter on numeric range ───────────────────────────────
List<Employee> highEarners = employees.stream()
    .filter(e -> e.salary() > 70000)
    .collect(Collectors.toList());  // [Alice, Carol]

// ── Negate a predicate ────────────────────────────────────
Predicate<Employee> isActive = Employee::isActive;
List<Employee> inactive = employees.stream()
    .filter(isActive.negate())      // Predicate.not(Employee::isActive) in Java 11+
    .collect(Collectors.toList());  // [Carol]

record Employee(String name, String department, double salary, boolean isActive) {}`
      },
      {
        n: "map — transform each element",
        tag: "INTERMEDIATE",
        desc: "map(Function<T,R>) transforms each element from type T to type R. It is a 1-to-1 transformation. Use mapToInt/mapToLong/mapToDouble to get primitive specialized streams and avoid boxing overhead.",
        code: `List<String> names = List.of("alice", "bob", "carol", "dave");

// ── Basic map ─────────────────────────────────────────────
List<String> upper = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());
// [ALICE, BOB, CAROL, DAVE]

// ── Map to a different type ───────────────────────────────
List<Integer> lengths = names.stream()
    .map(String::length)
    .collect(Collectors.toList());
// [5, 3, 5, 4]

// ── Map to DTO ────────────────────────────────────────────
record UserDto(String displayName, int nameLength) {}

List<UserDto> dtos = names.stream()
    .map(n -> new UserDto(n.substring(0,1).toUpperCase() + n.substring(1), n.length()))
    .collect(Collectors.toList());

// ── mapToInt — avoids boxing, enables sum/avg/min/max ─────
int totalLength = names.stream()
    .mapToInt(String::length)     // Stream<String> → IntStream
    .sum();                        // 17

OptionalDouble avgLength = names.stream()
    .mapToInt(String::length)
    .average();                    // OptionalDouble[4.25]

// ── mapToLong / mapToDouble ───────────────────────────────
List<Order> orders = getOrders();
double totalRevenue = orders.stream()
    .mapToDouble(Order::getAmount)
    .sum();

// ── mapToObj (reverse: primitive → object stream) ─────────
Stream<String> strs = IntStream.range(1, 6)
    .mapToObj(i -> "Item-" + i);  // Item-1, Item-2, Item-3, Item-4, Item-5

// ── Chained maps ─────────────────────────────────────────
List<String> result = names.stream()
    .map(String::trim)
    .map(String::toLowerCase)
    .map(s -> s.replaceAll("[^a-z]", ""))
    .filter(s -> !s.isEmpty())
    .collect(Collectors.toList());`
      },
      {
        n: "flatMap — flatten nested structures",
        tag: "INTERMEDIATE",
        desc: "flatMap(Function<T, Stream<R>>) transforms each element into a Stream and then merges (flattens) all those streams into one. Essential for working with collections-of-collections, Optional chaining, and splitting strings.",
        code: `// ── Problem flatMap solves: nested collections ───────────
List<List<Integer>> nested = List.of(
    List.of(1, 2, 3),
    List.of(4, 5),
    List.of(6, 7, 8, 9)
);

// map produces Stream<Stream<Integer>> — wrong!
Stream<Stream<Integer>> wrong = nested.stream().map(Collection::stream);

// flatMap flattens into Stream<Integer> — correct
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5, 6, 7, 8, 9]

// ── Split strings and flatten ─────────────────────────────
List<String> sentences = List.of("Hello World", "Java Streams", "Are Powerful");
List<String> words = sentences.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .collect(Collectors.toList());
// [Hello, World, Java, Streams, Are, Powerful]

// unique words sorted
List<String> uniqueWords = sentences.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .collect(Collectors.toList());

// ── flatMap on domain objects ─────────────────────────────
record Order(String id, List<LineItem> items) {}
record LineItem(String product, int qty) {}

List<Order> orders = getOrders();

// All line items across all orders
List<LineItem> allItems = orders.stream()
    .flatMap(o -> o.items().stream())
    .collect(Collectors.toList());

// All product names (with duplicates)
List<String> products = orders.stream()
    .flatMap(o -> o.items().stream())
    .map(LineItem::product)
    .collect(Collectors.toList());

// ── flatMap with Optional (Java 9+) ──────────────────────
List<Optional<String>> optionals = List.of(
    Optional.of("a"), Optional.empty(), Optional.of("b")
);
List<String> values = optionals.stream()
    .flatMap(Optional::stream)   // empty Optional contributes nothing
    .collect(Collectors.toList()); // [a, b]

// ── flatMapToInt / flatMapToLong ──────────────────────────
int totalQty = orders.stream()
    .flatMapToInt(o -> o.items().stream().mapToInt(LineItem::qty))
    .sum();`
      },
      {
        n: "sorted — order stream elements",
        tag: "INTERMEDIATE",
        desc: "sorted() uses natural ordering (elements must implement Comparable). sorted(Comparator) uses a custom comparator. Chaining Comparator.thenComparing() handles multi-level sorting. sorted() is a stateful operation — it must see all elements before emitting any.",
        code: `List<String> names = List.of("Charlie", "Alice", "Dave", "Bob");

// ── Natural order ────────────────────────────────────────
List<String> asc = names.stream()
    .sorted()
    .collect(Collectors.toList());
// [Alice, Bob, Charlie, Dave]

// ── Reverse natural order ─────────────────────────────────
List<String> desc = names.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());
// [Dave, Charlie, Bob, Alice]

// ── Sort by field ─────────────────────────────────────────
record Employee(String name, String dept, double salary, int yearsExp) {}

List<Employee> employees = getEmployees();

// Sort by salary ascending
List<Employee> bySalary = employees.stream()
    .sorted(Comparator.comparingDouble(Employee::salary))
    .collect(Collectors.toList());

// Sort by salary descending
List<Employee> bySalaryDesc = employees.stream()
    .sorted(Comparator.comparingDouble(Employee::salary).reversed())
    .collect(Collectors.toList());

// ── Multi-level sort: dept asc, then salary desc ──────────
List<Employee> multiSort = employees.stream()
    .sorted(Comparator.comparing(Employee::dept)
        .thenComparing(Comparator.comparingDouble(Employee::salary).reversed()))
    .collect(Collectors.toList());

// ── Sort with nulls last ──────────────────────────────────
List<String> withNulls = Arrays.asList("Bob", null, "Alice", null, "Carol");
List<String> nullsLast = withNulls.stream()
    .sorted(Comparator.nullsLast(Comparator.naturalOrder()))
    .collect(Collectors.toList());
// [Alice, Bob, Carol, null, null]

// ── Sort by multiple fields (name-based) ─────────────────
List<Employee> complex = employees.stream()
    .sorted(Comparator.comparing(Employee::dept)
        .thenComparingInt(Employee::yearsExp).reversed()
        .thenComparing(Employee::name))
    .collect(Collectors.toList());

// ── Sort strings case-insensitively ──────────────────────
List<String> caseInsensitive = names.stream()
    .sorted(String.CASE_INSENSITIVE_ORDER)
    .collect(Collectors.toList());`
      },
      {
        n: "distinct — remove duplicates",
        tag: "INTERMEDIATE",
        desc: "distinct() removes duplicate elements based on equals() and hashCode(). It is a stateful operation. For objects, make sure equals/hashCode are correctly implemented.",
        code: `// ── Distinct primitives ──────────────────────────────────
List<Integer> nums = List.of(1, 2, 2, 3, 3, 3, 4);
List<Integer> unique = nums.stream()
    .distinct()
    .collect(Collectors.toList());
// [1, 2, 3, 4]

// ── Distinct strings ─────────────────────────────────────
List<String> tags = List.of("java", "stream", "java", "api", "stream", "java");
List<String> uniqueTags = tags.stream()
    .distinct()
    .collect(Collectors.toList());
// [java, stream, api]

// ── Distinct after transformation ────────────────────────
List<String> words = List.of("Hello", "hello", "HELLO", "World", "world");

// Distinct case-sensitive (default)
List<String> caseSensitive = words.stream()
    .distinct()
    .collect(Collectors.toList());
// [Hello, hello, HELLO, World, world]

// Distinct case-insensitive: normalize first
List<String> caseInsensitive = words.stream()
    .map(String::toLowerCase)
    .distinct()
    .collect(Collectors.toList());
// [hello, world]

// ── Count distinct elements ───────────────────────────────
long distinctCount = tags.stream().distinct().count();  // 3

// ── Distinct objects — requires proper equals/hashCode ────
record Product(String sku, String name) {}   // records auto-generate equals/hashCode

List<Product> products = List.of(
    new Product("A1", "Widget"),
    new Product("A1", "Widget"),  // duplicate
    new Product("B2", "Gadget")
);

List<Product> uniqueProducts = products.stream()
    .distinct()
    .collect(Collectors.toList());
// [Product[sku=A1, name=Widget], Product[sku=B2, name=Gadget]]

// ── Distinct by a specific field (no built-in — use workaround) ──
// Distinct by SKU only (not full equality)
Map<String, Product> seen = new ConcurrentHashMap<>();
List<Product> distinctBySku = products.stream()
    .filter(p -> seen.putIfAbsent(p.sku(), p) == null)
    .collect(Collectors.toList());`
      },
      {
        n: "limit & skip — pagination",
        tag: "INTERMEDIATE",
        desc: "limit(n) keeps only the first n elements. skip(n) discards the first n elements. Together they implement pagination. Both are short-circuit operations when combined with limit.",
        code: `List<String> items = List.of("A","B","C","D","E","F","G","H","I","J");

// ── limit — take first N ──────────────────────────────────
List<String> first3 = items.stream()
    .limit(3)
    .collect(Collectors.toList());
// [A, B, C]

// ── skip — drop first N ───────────────────────────────────
List<String> after3 = items.stream()
    .skip(3)
    .collect(Collectors.toList());
// [D, E, F, G, H, I, J]

// ── Pagination: skip + limit ──────────────────────────────
int pageSize = 3;

List<String> page1 = items.stream().skip(0 * pageSize).limit(pageSize).collect(Collectors.toList()); // A B C
List<String> page2 = items.stream().skip(1 * pageSize).limit(pageSize).collect(Collectors.toList()); // D E F
List<String> page3 = items.stream().skip(2 * pageSize).limit(pageSize).collect(Collectors.toList()); // G H I
List<String> page4 = items.stream().skip(3 * pageSize).limit(pageSize).collect(Collectors.toList()); // J

// Generic paging function
public static <T> List<T> getPage(List<T> source, int page, int size) {
    return source.stream()
        .skip((long) page * size)
        .limit(size)
        .collect(Collectors.toList());
}

// ── limit with infinite streams ───────────────────────────
List<Integer> first10Evens = Stream.iterate(0, n -> n + 2)
    .limit(10)
    .collect(Collectors.toList());
// [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

// ── Skip on sorted stream (drop top N earners) ───────────
List<Employee> withoutTop3 = employees.stream()
    .sorted(Comparator.comparingDouble(Employee::salary).reversed())
    .skip(3)
    .collect(Collectors.toList());`
      },
      {
        n: "peek — debug / side-effect between operations",
        tag: "INTERMEDIATE",
        desc: "peek(Consumer<T>) performs a side-effect for each element without changing the stream. Its primary use is debugging — inspect elements at each pipeline stage. Because streams are lazy, peek only executes when a terminal operation drives evaluation.",
        code: `List<String> names = List.of("alice", "bob", "carol", "dave");

// ── Debug pipeline stages ─────────────────────────────────
List<String> result = names.stream()
    .peek(s -> System.out.println("1-ORIGINAL : " + s))
    .filter(s -> s.length() > 3)
    .peek(s -> System.out.println("2-FILTERED : " + s))
    .map(String::toUpperCase)
    .peek(s -> System.out.println("3-MAPPED   : " + s))
    .sorted()
    .peek(s -> System.out.println("4-SORTED   : " + s))
    .collect(Collectors.toList());

// Output (note: lazy evaluation — elements processed one at a time):
// 1-ORIGINAL : alice
// 2-FILTERED : alice
// 3-MAPPED   : ALICE
// 1-ORIGINAL : bob   ← bob is filtered out, no "2-FILTERED" for it
// 1-ORIGINAL : carol
// 2-FILTERED : carol
// 3-MAPPED   : CAROL
// 1-ORIGINAL : dave
// 2-FILTERED : dave
// 3-MAPPED   : DAVE
// 4-SORTED   : ALICE  ← sorted emits all at once after seeing all elements
// 4-SORTED   : CAROL
// 4-SORTED   : DAVE

// ── peek for logging in production ───────────────────────
List<Order> processedOrders = pendingOrders.stream()
    .peek(o -> log.debug("Processing order: {}", o.getId()))
    .filter(Order::isValid)
    .peek(o -> metrics.increment("orders.valid"))
    .map(orderService::process)
    .peek(o -> log.info("Order processed: {}", o.getId()))
    .collect(Collectors.toList());

// ⚠️  WARNING: peek does NOT execute without a terminal op!
Stream<String> lazy = names.stream()
    .peek(s -> System.out.println("WON'T PRINT"));
// Nothing printed — no terminal operation triggered yet`
      },
      {
        n: "takeWhile & dropWhile (Java 9+)",
        tag: "INTERMEDIATE",
        desc: "takeWhile(Predicate) takes elements from the stream while the predicate is true, stops at the first false. dropWhile(Predicate) drops elements while the predicate is true, then emits the rest. Both are designed for ordered (sorted) streams — behaviour on unordered streams is non-deterministic.",
        code: `// ── takeWhile — take elements until condition breaks ───────
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// Take while less than 5 — stops at first element where predicate is false
List<Integer> taken = numbers.stream()
    .takeWhile(n -> n < 5)
    .collect(Collectors.toList());
// [1, 2, 3, 4]   ← stops when n=5 fails the predicate

// ── dropWhile — drop until condition breaks ───────────────
List<Integer> dropped = numbers.stream()
    .dropWhile(n -> n < 5)
    .collect(Collectors.toList());
// [5, 6, 7, 8, 9, 10]  ← drops 1-4, emits from 5 onward

// ── Combine takeWhile + dropWhile for slicing ─────────────
// Extract elements between indices logically:
List<Integer> middle = numbers.stream()
    .dropWhile(n -> n < 4)   // drop 1,2,3
    .takeWhile(n -> n < 8)   // take until 8
    .collect(Collectors.toList());
// [4, 5, 6, 7]

// ── Real-world: process log entries until error ────────────
List<LogEntry> goodLogs = logEntries.stream()
    .takeWhile(entry -> !entry.isError())   // stop at first error
    .collect(Collectors.toList());

// ── Read sorted prices up to a threshold ─────────────────
List<Product> affordable = products.stream()
    .sorted(Comparator.comparingDouble(Product::price))
    .takeWhile(p -> p.price() <= 100.0)     // stop once price exceeds 100
    .collect(Collectors.toList());

// ── dropWhile with history ────────────────────────────────
// Process events after a known checkpoint
List<Event> newEvents = allEvents.stream()
    .dropWhile(e -> e.timestamp().isBefore(lastProcessedTime))
    .collect(Collectors.toList());

// ⚠️  WARNING: filter vs takeWhile
// filter(n -> n < 5)     on [1,2,6,3,4] → [1,2,3,4]  (checks ALL elements)
// takeWhile(n -> n < 5)  on [1,2,6,3,4] → [1,2]       (stops at 6!)`
      },
      {
        n: "mapMulti (Java 16+) — one-to-many mapping",
        tag: "INTERMEDIATE",
        desc: "mapMulti is a more efficient alternative to flatMap for cases where you're emitting a small number of elements per input. Instead of creating an intermediate stream, it uses a consumer to push 0..N elements downstream directly.",
        code: `// ── mapMulti vs flatMap ────────────────────────────────────
List<String> words = List.of("hello world", "java streams", "rock");

// flatMap approach (creates intermediate streams)
List<String> withFlatMap = words.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .collect(Collectors.toList());

// mapMulti approach (no intermediate streams — more efficient)
List<String> withMapMulti = words.stream()
    .<String>mapMulti((sentence, consumer) -> {
        for (String word : sentence.split(" ")) {
            consumer.accept(word);   // push each word downstream directly
        }
    })
    .collect(Collectors.toList());
// [hello, world, java, streams, rock]

// ── Emit 0 elements (like filter) ────────────────────────
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
List<Integer> evenDoubled = nums.stream()
    .<Integer>mapMulti((n, consumer) -> {
        if (n % 2 == 0) {
            consumer.accept(n);         // original
            consumer.accept(n * 2);     // doubled
        }
        // odd numbers → 0 elements emitted
    })
    .collect(Collectors.toList());
// [2, 4, 4, 8, 6, 12]

// ── Type narrowing with mapMulti ─────────────────────────
List<Object> mixed = List.of("hello", 42, "world", 3.14, "java");

List<String> stringsOnly = mixed.stream()
    .<String>mapMulti((obj, consumer) -> {
        if (obj instanceof String s) consumer.accept(s);  // type-safe filter+cast
    })
    .collect(Collectors.toList());
// [hello, world, java]

// ── mapMultiToInt / mapMultiToLong / mapMultiToDouble ─────
int[] expanded = IntStream.of(1, 2, 3)
    .mapMulti((n, consumer) -> {
        for (int i = 0; i < n; i++) consumer.accept(n);  // emit n times
    })
    .toArray();
// [1, 2, 2, 3, 3, 3]`
      },
    ]
  },
  {
    cat: "Terminal Operations",
    icon: "⊛",
    color: "#EF4444",
    desc: "Eager operations — trigger stream evaluation and produce a result or side effect.",
    topics: [
      {
        n: "forEach & forEachOrdered — consume each element",
        tag: "TERMINAL",
        desc: "forEach(Consumer<T>) processes each element with a side effect. It does not preserve order in parallel streams. forEachOrdered preserves encounter order even in parallel, but sacrifices parallelism benefit.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol");

// ── forEach — sequential ──────────────────────────────────
names.stream()
    .forEach(System.out::println);
// Alice, Bob, Carol (in order)

// ── forEach — parallel (order NOT guaranteed) ─────────────
names.parallelStream()
    .forEach(System.out::println);
// Output order unpredictable: may be Carol, Alice, Bob

// ── forEachOrdered — parallel but preserves order ─────────
names.parallelStream()
    .forEachOrdered(System.out::println);
// Alice, Bob, Carol (always in order, but loses parallelism benefit)

// ── forEach with index (no built-in — workaround) ─────────
List<String> items = List.of("x", "y", "z");
AtomicInteger index = new AtomicInteger();
items.stream().forEach(item ->
    System.out.println(index.getAndIncrement() + ": " + item));

// ── forEach with IntStream.range for index access ─────────
IntStream.range(0, items.size())
    .forEach(i -> System.out.println(i + ": " + items.get(i)));

// ── forEach with Map entries ──────────────────────────────
Map<String, Integer> scores = Map.of("Alice", 95, "Bob", 80, "Carol", 90);
scores.entrySet().stream()
    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
    .forEach(e -> System.out.println(e.getKey() + " → " + e.getValue()));

// ── forEach with exception handling ──────────────────────
names.stream().forEach(name -> {
    try {
        processName(name);
    } catch (IOException e) {
        throw new UncheckedIOException(e);  // wrap checked exception
    }
});`
      },
      {
        n: "collect — gather into collection",
        tag: "TERMINAL",
        desc: "The most powerful terminal operation. collect(Collector) accumulates stream elements into a mutable result container — a List, Set, Map, String, or any custom container. See the full Collectors section below for all sub-methods.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol", "Dave", "Alice");

// ── toList (Java 16+, unmodifiable) ──────────────────────
List<String> immutable = names.stream().collect(Collectors.toUnmodifiableList());
List<String> shorthand = names.stream().toList();  // Java 16+

// ── toList (modifiable) ───────────────────────────────────
List<String> modifiable = names.stream().collect(Collectors.toList());

// ── toSet (removes duplicates) ────────────────────────────
Set<String> unique = names.stream().collect(Collectors.toSet());
// {Alice, Bob, Carol, Dave}

// ── toCollection (specific collection type) ───────────────
LinkedList<String> linked = names.stream()
    .collect(Collectors.toCollection(LinkedList::new));

TreeSet<String> sorted = names.stream()
    .collect(Collectors.toCollection(TreeSet::new));

ArrayDeque<String> deque = names.stream()
    .collect(Collectors.toCollection(ArrayDeque::new));

// ── joining — collect to String ───────────────────────────
String joined   = names.stream().collect(Collectors.joining());            // AliceBobCarolDaveAlice
String csv      = names.stream().collect(Collectors.joining(", "));        // Alice, Bob, Carol, Dave, Alice
String pretty   = names.stream().collect(Collectors.joining(", ", "[", "]")); // [Alice, Bob, Carol, Dave, Alice]

// ── toMap ─────────────────────────────────────────────────
record User(int id, String name, String email) {}
List<User> users = getUsers();

Map<Integer, User> byId = users.stream()
    .collect(Collectors.toMap(User::id, u -> u));

Map<Integer, String> idToName = users.stream()
    .collect(Collectors.toMap(User::id, User::name));

// Handle duplicate keys with merge function
Map<String, String> emailByName = users.stream()
    .collect(Collectors.toMap(
        User::name,
        User::email,
        (existing, replacement) -> existing   // keep first on duplicate key
    ));`
      },
      {
        n: "reduce — fold elements into one value",
        tag: "TERMINAL",
        desc: "reduce() combines all stream elements into a single result using a BinaryOperator. The 3-argument form is used with parallel streams where an identity value and combiner are needed for correct parallel aggregation.",
        code: `List<Integer> numbers = List.of(1, 2, 3, 4, 5);

// ── reduce with identity (always returns T) ────────────────
int sum = numbers.stream()
    .reduce(0, Integer::sum);  // 0+1+2+3+4+5 = 15

int product = numbers.stream()
    .reduce(1, (a, b) -> a * b);  // 1*2*3*4*5 = 120

int max = numbers.stream()
    .reduce(Integer.MIN_VALUE, Integer::max);  // 5

// ── reduce without identity (returns Optional) ────────────
Optional<Integer> sum2 = numbers.stream()
    .reduce(Integer::sum);  // Optional[15]

Optional<String> longest = Stream.of("cat", "elephant", "dog", "hippopotamus")
    .reduce((a, b) -> a.length() >= b.length() ? a : b);
// Optional[hippopotamus]

// ── reduce to build a string (use joining instead!) ───────
String concat = Stream.of("a", "b", "c")
    .reduce("", (a, b) -> a + b);  // "abc" (inefficient — use joining!)

// ── 3-argument reduce (parallel-safe) ────────────────────
// reduce(identity, accumulator, combiner)
int sumOfLengths = Stream.of("Hello", "World", "Java")
    .reduce(0,
        (partialSum, s) -> partialSum + s.length(),  // accumulator: int + String → int
        Integer::sum                                   // combiner: merge two partial sums
    );
// 5 + 5 + 4 = 14

// ── Immutable reduction to build a result object ──────────
record Stats(int count, int sum) {
    Stats combine(Stats other) { return new Stats(count + other.count, sum + other.sum); }
    Stats add(int n)           { return new Stats(count + 1, sum + n); }
    double average()           { return count == 0 ? 0 : (double) sum / count; }
}

Stats stats = numbers.stream()
    .reduce(new Stats(0, 0), Stats::add, Stats::combine);
System.out.println("avg: " + stats.average()); // avg: 3.0

// ── When to use reduce vs specialized operations ──────────
// PREFER:   numbers.stream().mapToInt(i->i).sum()   over reduce(0, Integer::sum)
// PREFER:   Collectors.joining()                    over reduce("", String::concat)
// USE reduce for: custom aggregation, immutable accumulation, non-numeric combining`
      },
      {
        n: "count — number of elements",
        tag: "TERMINAL",
        desc: "count() returns the number of elements in the stream as a long. It is a terminal operation that triggers full evaluation. For simple collection counts, Collection.size() is faster — use count() when you need to count after filter/map.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol", "Dave", "Anna");

// ── Basic count ───────────────────────────────────────────
long total = names.stream().count();  // 5

// ── Count after filter ────────────────────────────────────
long startsWithA = names.stream()
    .filter(n -> n.startsWith("A"))
    .count();   // 2 (Alice, Anna)

long longNames = names.stream()
    .filter(n -> n.length() > 4)
    .count();   // 2 (Alice, Carol)

// ── Count distinct elements ───────────────────────────────
List<String> withDups = List.of("a", "b", "a", "c", "b");
long distinctCount = withDups.stream().distinct().count();  // 3

// ── Count grouped (using Collectors.counting()) ───────────
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));
// {Engineering=5, Marketing=3, HR=2}

// ── Count in IntStream ────────────────────────────────────
long evenCount = IntStream.rangeClosed(1, 100)
    .filter(n -> n % 2 == 0)
    .count();   // 50

// ── Avoid unnecessary count() ────────────────────────────
// DON'T: names.stream().count() == 0  ← processes all elements
// DO:    names.isEmpty()              ← O(1) on Collection

// DON'T: names.stream().filter(...).count() > 0  ← processes all
// DO:    names.stream().filter(...).findAny().isPresent()  ← short-circuits!`
      },
      {
        n: "findFirst & findAny — short-circuit search",
        tag: "TERMINAL",
        desc: "findFirst() returns the first element (respects encounter order). findAny() returns any element — faster in parallel streams since it doesn't have to wait for the first. Both return Optional. Both short-circuit — they stop processing once an element is found.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol", "Dave");

// ── findFirst — first matching element ────────────────────
Optional<String> first = names.stream()
    .filter(n -> n.length() > 3)
    .findFirst();
// Optional[Alice]

first.ifPresent(System.out::println);        // Alice
String val = first.orElse("none");           // Alice
String val2 = first.orElseThrow();           // Alice (throws if empty)
String val3 = first.orElseGet(() -> computeDefault()); // lazy default

// ── findAny — any match (faster in parallel) ──────────────
Optional<String> any = names.parallelStream()
    .filter(n -> n.length() > 3)
    .findAny();    // may return Alice, Bob, Carol, or Dave — non-deterministic

// In sequential streams, findAny behaves like findFirst
Optional<String> anySeq = names.stream().filter(n -> n.startsWith("C")).findAny();
// Optional[Carol]

// ── Empty Optional when no match ─────────────────────────
Optional<String> notFound = names.stream()
    .filter(n -> n.startsWith("Z"))
    .findFirst();
// Optional.empty

boolean exists = notFound.isPresent();  // false
boolean empty  = notFound.isEmpty();    // true (Java 11+)

// ── Chaining Optional ─────────────────────────────────────
String result = employees.stream()
    .filter(e -> e.dept().equals("Engineering"))
    .filter(e -> e.salary() > 90000)
    .findFirst()
    .map(Employee::name)              // transform if present
    .map(String::toUpperCase)
    .orElse("No senior engineer found");

// ── findFirst vs filter + get ─────────────────────────────
// DON'T:
List<String> filtered = names.stream().filter(n -> n.startsWith("C")).collect(Collectors.toList());
String first2 = filtered.isEmpty() ? null : filtered.get(0);  // processes ALL elements!

// DO (short-circuits after first match):
String firstC = names.stream()
    .filter(n -> n.startsWith("C"))
    .findFirst()
    .orElse(null);`
      },
      {
        n: "anyMatch, allMatch, noneMatch — predicate checks",
        tag: "TERMINAL",
        desc: "Short-circuit boolean terminal operations. anyMatch stops at the first true. allMatch stops at the first false. noneMatch stops at the first true. All return boolean directly (not Optional).",
        code: `List<Integer> numbers = List.of(2, 4, 6, 8, 10, 13);

// ── anyMatch — at least one matches ──────────────────────
boolean hasOdd    = numbers.stream().anyMatch(n -> n % 2 != 0);  // true  (13)
boolean hasNeg    = numbers.stream().anyMatch(n -> n < 0);        // false
boolean hasAbove9 = numbers.stream().anyMatch(n -> n > 9);        // true  (10, 13)

// ── allMatch — every element matches ─────────────────────
boolean allEven  = numbers.stream().allMatch(n -> n % 2 == 0);  // false (13 fails)
boolean allPos   = numbers.stream().allMatch(n -> n > 0);        // true
boolean allBelow100 = numbers.stream().allMatch(n -> n < 100);   // true

// ── noneMatch — no element matches ───────────────────────
boolean noneNeg  = numbers.stream().noneMatch(n -> n < 0);        // true
boolean noneOdd  = numbers.stream().noneMatch(n -> n % 2 != 0);   // false (13 is odd)

// ── Short-circuit behaviour ───────────────────────────────
// anyMatch stops at first TRUE:
boolean found = Stream.of(1, 2, 3, 4, 5)
    .peek(System.out::println)   // prints 1, 2 then stops (2 is even)
    .anyMatch(n -> n % 2 == 0);

// allMatch stops at first FALSE:
boolean allSingle = Stream.of("a", "bb", "c")
    .peek(System.out::println)   // prints a, bb then stops
    .allMatch(s -> s.length() == 1);

// ── Real-world examples ───────────────────────────────────
boolean hasAdminUser = users.stream()
    .anyMatch(u -> u.roles().contains("ADMIN"));

boolean allOrdersShipped = orders.stream()
    .allMatch(o -> o.status() == OrderStatus.SHIPPED);

boolean noFailedPayments = payments.stream()
    .noneMatch(p -> p.status() == PaymentStatus.FAILED);

boolean cartIsEmpty = cart.items().stream().noneMatch(item -> item.qty() > 0);

// ── Edge cases ────────────────────────────────────────────
// On empty stream:
Stream.empty().anyMatch(x -> true);   // false — no elements matched
Stream.empty().allMatch(x -> false);  // TRUE  — vacuously true!
Stream.empty().noneMatch(x -> true);  // true  — nothing matched`
      },
      {
        n: "min & max — find extreme elements",
        tag: "TERMINAL",
        desc: "min(Comparator) and max(Comparator) find the smallest and largest elements. They return Optional since the stream could be empty. For IntStream/LongStream/DoubleStream, use the no-argument min()/max() which return OptionalInt etc.",
        code: `List<Integer> numbers = List.of(5, 2, 8, 1, 9, 3);

// ── min and max on numbers ────────────────────────────────
Optional<Integer> min = numbers.stream().min(Integer::compareTo);  // Optional[1]
Optional<Integer> max = numbers.stream().max(Integer::compareTo);  // Optional[9]

// Shorter with Comparator.naturalOrder()
Optional<Integer> min2 = numbers.stream().min(Comparator.naturalOrder());
Optional<Integer> max2 = numbers.stream().max(Comparator.reverseOrder());

// ── min/max on objects ────────────────────────────────────
record Product(String name, double price, int stock) {}
List<Product> products = getProducts();

Optional<Product> cheapest = products.stream()
    .min(Comparator.comparingDouble(Product::price));

Optional<Product> mostExpensive = products.stream()
    .max(Comparator.comparingDouble(Product::price));

Optional<Product> longestName = products.stream()
    .max(Comparator.comparingInt(p -> p.name().length()));

// ── Primitive stream min/max (no comparator needed) ───────
OptionalInt minInt = IntStream.of(3, 1, 4, 1, 5, 9).min();  // OptionalInt[1]
OptionalInt maxInt = IntStream.of(3, 1, 4, 1, 5, 9).max();  // OptionalInt[9]

// ── min/max with chained Comparator ──────────────────────
// Cheapest product; if tie, alphabetically first by name
Optional<Product> cheapestAlpha = products.stream()
    .min(Comparator.comparingDouble(Product::price)
                   .thenComparing(Product::name));

// ── Use min/max to find by derived field ─────────────────
OptionalInt maxLength = Stream.of("cat", "elephant", "ox")
    .mapToInt(String::length)
    .max();  // OptionalInt[8]

// ── Summary statistics (min, max, sum, avg, count together) ─
IntSummaryStatistics stats = numbers.stream()
    .mapToInt(Integer::intValue)
    .summaryStatistics();
System.out.println(stats.getMin());    // 1
System.out.println(stats.getMax());    // 9
System.out.println(stats.getSum());    // 28
System.out.println(stats.getAverage()); // 4.666...
System.out.println(stats.getCount());  // 6`
      },
      {
        n: "toArray — collect to array",
        tag: "TERMINAL",
        desc: "toArray() returns Object[]. toArray(IntFunction<T[]>) returns a typed array. For primitive streams (IntStream etc.), toArray() returns the correct primitive array type directly.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol");

// ── toArray() — returns Object[] ──────────────────────────
Object[] arr1 = names.stream().toArray();

// ── toArray(generator) — returns typed array ──────────────
String[] arr2 = names.stream().toArray(String[]::new);   // ["Alice", "Bob", "Carol"]

// ── Primitive stream toArray — returns primitive array ─────
int[]    ints    = IntStream.range(1, 6).toArray();      // [1, 2, 3, 4, 5]
long[]   longs   = LongStream.of(1L, 2L, 3L).toArray(); // [1, 2, 3]
double[] doubles = DoubleStream.of(1.1, 2.2).toArray(); // [1.1, 2.2]

// ── Filter → transform → array ────────────────────────────
int[] evenSquares = IntStream.rangeClosed(1, 10)
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .toArray();
// [4, 16, 36, 64, 100]

// ── Stream to array to stream again ──────────────────────
String[] processed = names.stream()
    .map(String::toUpperCase)
    .filter(s -> s.length() > 3)
    .toArray(String[]::new);
// ["ALICE", "CAROL"]

// ── 2D array from stream ──────────────────────────────────
int[][] matrix = IntStream.range(0, 3)
    .mapToObj(i -> IntStream.range(0, 3).map(j -> i * 3 + j).toArray())
    .toArray(int[][]::new);
// [[0,1,2], [3,4,5], [6,7,8]]`
      },
      {
        n: "sum, average, min, max — IntStream/LongStream/DoubleStream",
        tag: "TERMINAL",
        desc: "Primitive specialized streams (IntStream, LongStream, DoubleStream) have built-in numeric operations: sum(), average(), min(), max(), summaryStatistics(). Always prefer these over boxing to Integer and using reduce — much faster and no GC pressure.",
        code: `int[] scores = {85, 92, 78, 95, 88, 70, 99};

IntStream stream = Arrays.stream(scores);

// ── sum ───────────────────────────────────────────────────
int total = Arrays.stream(scores).sum();                // 607

// ── average ───────────────────────────────────────────────
OptionalDouble avg = Arrays.stream(scores).average();   // OptionalDouble[86.71...]
double avgVal = avg.orElse(0.0);                        // 86.71...

// ── min and max ───────────────────────────────────────────
OptionalInt min = Arrays.stream(scores).min();  // OptionalInt[70]
OptionalInt max = Arrays.stream(scores).max();  // OptionalInt[99]

// ── summaryStatistics — all in one pass ───────────────────
IntSummaryStatistics stats = Arrays.stream(scores).summaryStatistics();
System.out.println("Count: "   + stats.getCount());    // 7
System.out.println("Sum: "     + stats.getSum());       // 607
System.out.println("Min: "     + stats.getMin());       // 70
System.out.println("Max: "     + stats.getMax());       // 99
System.out.println("Average: " + stats.getAverage());   // 86.71...

// ── From object stream via mapToInt ───────────────────────
List<Employee> employees = getEmployees();

double avgSalary = employees.stream()
    .mapToDouble(Employee::salary)
    .average()
    .orElse(0.0);

int totalSales = employees.stream()
    .mapToInt(Employee::salesCount)
    .sum();

// ── DoubleSummaryStatistics ───────────────────────────────
DoubleSummaryStatistics salaryStats = employees.stream()
    .mapToDouble(Employee::salary)
    .summaryStatistics();

// ── AsLongStream / AsDoubleStream conversions ─────────────
long sumAsLong = Arrays.stream(scores)
    .asLongStream()     // IntStream → LongStream (no overflow risk)
    .sum();

double sumAsDouble = Arrays.stream(scores)
    .asDoubleStream()   // IntStream → DoubleStream
    .sum();`
      },
      {
        n: "iterator & spliterator — pull-based traversal",
        tag: "TERMINAL",
        desc: "iterator() returns a standard Java Iterator for external, pull-based traversal. spliterator() returns a Spliterator, which also supports splitting for parallel processing. Rarely needed directly — prefer functional pipeline style.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol");

// ── iterator() — external iteration ──────────────────────
Iterator<String> it = names.stream()
    .filter(n -> n.length() > 3)
    .iterator();

while (it.hasNext()) {
    System.out.println(it.next());   // Alice, Carol
}

// ── Use case: interop with legacy code expecting Iterator ──
Iterator<String> legacyIt = names.stream()
    .map(String::toUpperCase)
    .iterator();

// pass to a legacy library
legacyLibrary.process(legacyIt);

// ── spliterator() — parallel-aware traversal ──────────────
Spliterator<String> split = names.stream().spliterator();

System.out.println("Size hint:    " + split.estimateSize());   // 3
System.out.println("Characteristics: " + split.characteristics());

// tryAdvance: process one element, returns false if none
split.tryAdvance(System.out::println);   // Alice

// forEachRemaining: process all remaining
split.forEachRemaining(System.out::println);  // Bob, Carol

// trySplit: split for parallel processing
Spliterator<String> prefix = split.trySplit();  // first half
// Now process prefix and split in parallel

// ── Custom Spliterator for lazy data source ───────────────
class RangeSpliterator implements Spliterator<Integer> {
    private int current, end;
    RangeSpliterator(int start, int end) { this.current = start; this.end = end; }

    public boolean tryAdvance(Consumer<? super Integer> action) {
        if (current < end) { action.accept(current++); return true; }
        return false;
    }

    public Spliterator<Integer> trySplit() {
        int mid = (current + end) >>> 1;
        if (mid <= current) return null;
        RangeSpliterator prefix = new RangeSpliterator(current, mid);
        current = mid;
        return prefix;
    }

    public long estimateSize() { return end - current; }
    public int characteristics() { return ORDERED | SIZED | SUBSIZED | IMMUTABLE; }
}`
      },
    ]
  },
  {
    cat: "Collectors — collect() sub-methods",
    icon: "◫",
    color: "#A855F7",
    desc: "All Collectors factory methods — the full API for grouping, partitioning, joining, and custom accumulation.",
    topics: [
      {
        n: "toList, toSet, toCollection, toUnmodifiableList/Set",
        tag: "COLLECTOR",
        desc: "Basic collection collectors. toList() and toSet() make no guarantees about mutability or ordering. toUnmodifiableList/Set (Java 10+) return immutable versions. stream.toList() (Java 16+) is the shortest form.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol", "Alice", "Dave");

// ── toList — modifiable, allows duplicates, preserves order ──
List<String> list = names.stream()
    .collect(Collectors.toList());
// [Alice, Bob, Carol, Alice, Dave]

// ── toList shorthand (Java 16+) — unmodifiable ───────────
List<String> immutableList = names.stream().toList();

// ── toUnmodifiableList (Java 10+) ────────────────────────
List<String> unmod = names.stream()
    .collect(Collectors.toUnmodifiableList());
// unmod.add("X"); // throws UnsupportedOperationException

// ── toSet — no duplicates, no guaranteed order ────────────
Set<String> set = names.stream()
    .collect(Collectors.toSet());
// {Alice, Bob, Carol, Dave}  (order varies)

// ── toUnmodifiableSet (Java 10+) ─────────────────────────
Set<String> unmodSet = names.stream()
    .collect(Collectors.toUnmodifiableSet());

// ── toCollection — specific collection type ───────────────
LinkedList<String> linked = names.stream()
    .collect(Collectors.toCollection(LinkedList::new));

TreeSet<String> sorted = names.stream()
    .collect(Collectors.toCollection(TreeSet::new));
// [Alice, Bob, Carol, Dave]  ← sorted, no duplicates (TreeSet)

ArrayDeque<String> deque = names.stream()
    .collect(Collectors.toCollection(ArrayDeque::new));

PriorityQueue<String> pq = names.stream()
    .collect(Collectors.toCollection(PriorityQueue::new));

// ── toList → filter first ─────────────────────────────────
List<String> longNames = names.stream()
    .filter(n -> n.length() > 3)
    .distinct()
    .sorted()
    .collect(Collectors.toList());
// [Alice, Carol, Dave]`
      },
      {
        n: "toMap & toUnmodifiableMap — stream to Map",
        tag: "COLLECTOR",
        desc: "toMap(keyMapper, valueMapper) builds a Map. With duplicate keys it throws IllegalStateException by default — provide a merge function to handle collisions. The 4-argument form lets you specify the Map implementation.",
        code: `record User(int id, String name, String email, String dept) {}
List<User> users = List.of(
    new User(1, "Alice", "alice@co.com", "Eng"),
    new User(2, "Bob",   "bob@co.com",   "Mkt"),
    new User(3, "Carol", "carol@co.com", "Eng"),
    new User(1, "Alice2","a2@co.com",    "HR")   // duplicate id!
);

// ── Basic toMap: keyMapper, valueMapper ──────────────────
Map<Integer, User> byId = users.stream()
    .distinct()
    .collect(Collectors.toMap(User::id, u -> u));

// ── Map to specific field value ───────────────────────────
Map<Integer, String> idToName = users.stream()
    .collect(Collectors.toMap(
        User::id,
        User::name,
        (existing, replacement) -> existing  // keep first on duplicate key
    ));
// {1=Alice, 2=Bob, 3=Carol}

// ── Merge function: keep all names (join on duplicate key) ──
Map<String, String> deptToNames = users.stream()
    .collect(Collectors.toMap(
        User::dept,
        User::name,
        (a, b) -> a + ", " + b   // merge: concat names
    ));
// {Eng=Alice, Alice2, Mkt=Bob, HR=Carol} ← wait, let's show a cleaner example:

// ── Map: dept → comma-joined names ───────────────────────
Map<String, String> deptNames = users.stream()
    .collect(Collectors.toMap(
        User::dept,
        User::name,
        (existing, newVal) -> existing + ", " + newVal
    ));
// {Eng="Alice, Carol", Mkt="Bob", HR="Alice2"}

// ── 4-arg toMap: specify Map implementation ───────────────
Map<String, User> sortedMap = users.stream()
    .collect(Collectors.toMap(
        User::name,
        u -> u,
        (a, b) -> a,
        TreeMap::new      // insertion order sorted alphabetically
    ));

LinkedHashMap<Integer, String> ordered = users.stream()
    .collect(Collectors.toMap(
        User::id,
        User::name,
        (a, b) -> a,
        LinkedHashMap::new  // preserves insertion order
    ));

// ── toUnmodifiableMap (Java 10+) ──────────────────────────
Map<Integer, String> immutable = users.stream()
    .collect(Collectors.toUnmodifiableMap(
        User::id, User::name, (a, b) -> a
    ));`
      },
      {
        n: "groupingBy — group elements by key",
        tag: "COLLECTOR",
        desc: "groupingBy(classifier) groups elements into a Map<K, List<V>>. The second argument (downstream collector) transforms the grouped values — use counting(), mapping(), toSet(), joining(), summingInt(), etc. groupingByConcurrent() is the thread-safe parallel version.",
        code: `record Employee(String name, String dept, double salary, String city) {}
List<Employee> employees = getEmployees();

// ── Basic groupingBy → Map<K, List<V>> ───────────────────
Map<String, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept));
// {Engineering=[Alice, Carol, ...], Marketing=[Bob, ...], HR=[Dave, ...]}

// ── With downstream: counting ─────────────────────────────
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));
// {Engineering=5, Marketing=3, HR=2}

// ── With downstream: mapping (extract field from grouped elements) ──
Map<String, List<String>> namesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::name, Collectors.toList())));
// {Engineering=[Alice, Carol], Marketing=[Bob], ...}

// ── With downstream: joining ──────────────────────────────
Map<String, String> nameStrByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::name, Collectors.joining(", "))));
// {Engineering="Alice, Carol", Marketing="Bob"}

// ── With downstream: averagingDouble ─────────────────────
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.averagingDouble(Employee::salary)));
// {Engineering=95000.0, Marketing=62000.0, HR=58000.0}

// ── With downstream: summingDouble ───────────────────────
Map<String, Double> totalSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.summingDouble(Employee::salary)));

// ── With downstream: toSet ────────────────────────────────
Map<String, Set<String>> citiesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::city, Collectors.toSet())));

// ── Nested groupingBy (multi-level grouping) ──────────────
Map<String, Map<String, List<Employee>>> byDeptAndCity = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.groupingBy(Employee::city)));

// ── With downstream: maxBy ────────────────────────────────
Map<String, Optional<Employee>> topEarnerByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.maxBy(Comparator.comparingDouble(Employee::salary))));

// ── With specific Map type (LinkedHashMap for insertion order) ──
Map<String, List<Employee>> ordered = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        LinkedHashMap::new, Collectors.toList()));

// ── groupingByConcurrent — for parallel streams ────────────
ConcurrentMap<String, List<Employee>> concurrent = employees.parallelStream()
    .collect(Collectors.groupingByConcurrent(Employee::dept));`
      },
      {
        n: "partitioningBy — split into true/false groups",
        tag: "COLLECTOR",
        desc: "partitioningBy(Predicate) always returns a Map<Boolean, List<T>> with exactly two entries — true and false. It is a specialized groupingBy for binary classification. Like groupingBy, it accepts a downstream collector.",
        code: `List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// ── Basic partition ───────────────────────────────────────
Map<Boolean, List<Integer>> evenOdd = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// {true=[2, 4, 6, 8, 10], false=[1, 3, 5, 7, 9]}

List<Integer> evens = evenOdd.get(true);   // [2, 4, 6, 8, 10]
List<Integer> odds  = evenOdd.get(false);  // [1, 3, 5, 7, 9]

// ── Partition with downstream: counting ──────────────────
Map<Boolean, Long> partitionCounts = numbers.stream()
    .collect(Collectors.partitioningBy(
        n -> n > 5,
        Collectors.counting()
    ));
// {true=5, false=5}

// ── Partition employees: active vs inactive ───────────────
Map<Boolean, List<String>> activeByName = employees.stream()
    .collect(Collectors.partitioningBy(
        Employee::isActive,
        Collectors.mapping(Employee::name, Collectors.toList())
    ));
// {true=[Alice, Bob, Dave], false=[Carol]}

// ── Partition with joining ────────────────────────────────
Map<Boolean, String> partitionJoined = numbers.stream()
    .collect(Collectors.partitioningBy(
        n -> n % 2 == 0,
        Collectors.mapping(Object::toString, Collectors.joining(", "))
    ));
// {true="2, 4, 6, 8, 10", false="1, 3, 5, 7, 9"}

// ── Partition with summingInt ─────────────────────────────
Map<Boolean, Integer> sumPartition = numbers.stream()
    .collect(Collectors.partitioningBy(
        n -> n % 2 == 0,
        Collectors.summingInt(Integer::intValue)
    ));
// {true=30, false=25}

// ── Real-world: pass/fail exam results ───────────────────
Map<Boolean, List<Student>> results = students.stream()
    .collect(Collectors.partitioningBy(s -> s.score() >= 60));
List<Student> passing = results.get(true);
List<Student> failing = results.get(false);`
      },
      {
        n: "joining — concatenate strings",
        tag: "COLLECTOR",
        desc: "joining() collects Stream<String> (or mapped strings) into a single String. Three overloads: no separator, separator only, or separator + prefix + suffix. Internally uses a StringBuilder — much more efficient than reduce with string concatenation.",
        code: `List<String> words = List.of("Java", "Streams", "Are", "Powerful");

// ── No separator ──────────────────────────────────────────
String concat = words.stream()
    .collect(Collectors.joining());
// "JavaStreamsArePowerful"

// ── Separator only ────────────────────────────────────────
String csv     = words.stream().collect(Collectors.joining(", "));    // "Java, Streams, Are, Powerful"
String spaced  = words.stream().collect(Collectors.joining(" "));     // "Java Streams Are Powerful"
String piped   = words.stream().collect(Collectors.joining(" | "));   // "Java | Streams | Are | Powerful"

// ── Separator + prefix + suffix ───────────────────────────
String array   = words.stream().collect(Collectors.joining(", ", "[", "]"));
// "[Java, Streams, Are, Powerful]"

String sql     = words.stream().collect(Collectors.joining("', '", "('", "')"));
// "('Java', 'Streams', 'Are', 'Powerful')"

String html    = words.stream().collect(Collectors.joining(
    "</li>\n  <li>", "<ul>\n  <li>", "</li>\n</ul>"));
// <ul>
//   <li>Java</li>
//   <li>Streams</li>
//   <li>Are</li>
//   <li>Powerful</li>
// </ul>

// ── Map fields to string then join ────────────────────────
List<Employee> employees = getEmployees();

String names = employees.stream()
    .map(Employee::name)
    .collect(Collectors.joining(", "));
// "Alice, Bob, Carol, Dave"

String namesCapped = employees.stream()
    .filter(Employee::isActive)
    .map(Employee::name)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.joining(", ", "Active: [", "]"));
// "Active: [ALICE, BOB, DAVE]"

// ── Build SQL IN clause ───────────────────────────────────
List<Long> ids = List.of(1L, 2L, 3L, 4L);
String inClause = ids.stream()
    .map(Object::toString)
    .collect(Collectors.joining(", ", "WHERE id IN (", ")"));
// "WHERE id IN (1, 2, 3, 4)"`
      },
      {
        n: "counting, summingInt/Long/Double, averagingInt/Long/Double",
        tag: "COLLECTOR",
        desc: "Numeric aggregate collectors. Typically used as downstream collectors inside groupingBy. They mirror the terminal operations but work as composable building blocks.",
        code: `List<Employee> employees = getEmployees();

// ── counting() — count elements in group ─────────────────
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));
// {Engineering=5, Marketing=3, HR=2}

// Standalone (same as stream.count())
long total = employees.stream().collect(Collectors.counting());

// ── summingInt / summingLong / summingDouble ──────────────
Map<String, Integer> totalExpByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.summingInt(Employee::yearsExperience)));

Map<String, Double> totalSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.summingDouble(Employee::salary)));

// Standalone
double totalSalary = employees.stream()
    .collect(Collectors.summingDouble(Employee::salary));

// ── averagingInt / averagingLong / averagingDouble ─────────
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.averagingDouble(Employee::salary)));
// {Engineering=92000.0, Marketing=65000.0, HR=57000.0}

double avgSalary = employees.stream()
    .collect(Collectors.averagingDouble(Employee::salary));

// ── summarizingInt / summarizingDouble ────────────────────
// Returns IntSummaryStatistics — min, max, sum, avg, count in one pass
Map<String, IntSummaryStatistics> statsByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.summarizingInt(Employee::yearsExperience)));

statsByDept.get("Engineering").getAverage();  // avg years in Engineering
statsByDept.get("Engineering").getMax();      // max years in Engineering

DoubleSummaryStatistics salaryStats = employees.stream()
    .collect(Collectors.summarizingDouble(Employee::salary));
System.out.println(salaryStats);
// DoubleSummaryStatistics{count=10, sum=750000.0, min=45000.0, avg=75000.0, max=120000.0}`
      },
      {
        n: "minBy & maxBy — find min/max in group",
        tag: "COLLECTOR",
        desc: "minBy(Comparator) and maxBy(Comparator) find the minimum or maximum element. They return Optional<T>. Used primarily as downstream collectors inside groupingBy to find the extreme element within each group.",
        code: `List<Employee> employees = getEmployees();

// ── maxBy as downstream — top earner per department ───────
Map<String, Optional<Employee>> topEarnerByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.maxBy(Comparator.comparingDouble(Employee::salary))));
// {Engineering=Optional[Alice(120k)], Marketing=Optional[Bob(80k)]}

// Unwrap Optional from each group
Map<String, Employee> topEarner = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.collectingAndThen(
            Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
            Optional::get   // safe only if each dept has at least one employee
        )));

// ── minBy — junior employee per department ────────────────
Map<String, Optional<Employee>> juniorByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.minBy(Comparator.comparingInt(Employee::yearsExperience))));

// ── Standalone usage (same as stream.max()) ───────────────
Optional<Employee> globalTop = employees.stream()
    .collect(Collectors.maxBy(Comparator.comparingDouble(Employee::salary)));

Optional<Employee> globalJunior = employees.stream()
    .collect(Collectors.minBy(Comparator.comparingInt(Employee::yearsExperience)));

// ── Min/max by multiple criteria ─────────────────────────
Map<String, Optional<Employee>> bestByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.maxBy(
            Comparator.comparingDouble(Employee::salary)
                      .thenComparingInt(Employee::yearsExperience)
        )));`
      },
      {
        n: "mapping & flatMapping — transform before collecting",
        tag: "COLLECTOR",
        desc: "mapping(mapper, downstream) applies a function to each element before passing to the downstream collector. flatMapping (Java 9+) applies a function that returns a Stream, flattening results before collecting. These are the downstream equivalents of map/flatMap.",
        code: `List<Employee> employees = getEmployees();

// ── mapping — transform each element before collecting ────
// Get names per department (instead of full Employee objects)
Map<String, List<String>> namesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::name, Collectors.toList())));
// {Engineering=[Alice, Carol], Marketing=[Bob], ...}

// mapping + joining
Map<String, String> nameCsvByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::name, Collectors.joining(", "))));
// {Engineering="Alice, Carol", Marketing="Bob"}

// mapping + toSet
Map<String, Set<String>> skillsByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.mapping(Employee::mainSkill, Collectors.toSet())));

// ── flatMapping — flatten collections inside elements ──────
record Department(String name, List<String> skills) {}
List<Department> depts = List.of(
    new Department("Eng",  List.of("Java", "Python", "SQL")),
    new Department("Mkt",  List.of("Excel", "SQL")),
    new Department("HR",   List.of("Excel"))
);

// All skills across all departments (flat)
List<String> allSkills = depts.stream()
    .collect(Collectors.flatMapping(
        d -> d.skills().stream(),
        Collectors.toList()
    ));
// [Java, Python, SQL, Excel, SQL, Excel]

// Unique skills per category using flatMapping in groupingBy
Map<String, Set<String>> skillSetByCategory = depts.stream()
    .collect(Collectors.groupingBy(
        d -> d.name().substring(0, 1),    // group by first letter
        Collectors.flatMapping(d -> d.skills().stream(), Collectors.toSet())
    ));

// ── mapping in partitioningBy ─────────────────────────────
Map<Boolean, List<String>> activeNames = employees.stream()
    .collect(Collectors.partitioningBy(
        Employee::isActive,
        Collectors.mapping(Employee::name, Collectors.toList())
    ));
// {true=[Alice, Bob], false=[Carol]}`
      },
      {
        n: "filtering — filter inside downstream collector (Java 9+)",
        tag: "COLLECTOR",
        desc: "Collectors.filtering(predicate, downstream) applies a filter as part of the downstream collector — not before grouping. The difference from stream.filter(): filtering keeps all groups (including empty ones) while stream.filter() may eliminate groups entirely.",
        code: `List<Employee> employees = getEmployees();
// employees has dept Engineering: [Alice(90k), Carol(60k), Frank(110k)]
//                  dept Marketing: [Bob(75k)]
//                  dept HR:        [Dave(50k)]

// ── stream.filter() — groups with no match disappear ─────
Map<String, List<Employee>> withStreamFilter = employees.stream()
    .filter(e -> e.salary() > 80000)
    .collect(Collectors.groupingBy(Employee::dept));
// {Engineering=[Alice, Frank]}   ← Marketing and HR MISSING (no entry for them)

// ── Collectors.filtering() — keeps all groups ─────────────
Map<String, List<Employee>> withCollectorFilter = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.filtering(e -> e.salary() > 80000, Collectors.toList())));
// {Engineering=[Alice, Frank], Marketing=[], HR=[]}  ← empty lists preserved

// ── Practical: report needs all departments listed ────────
Map<String, Long> seniorCountByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.filtering(
            e -> e.yearsExperience() >= 5,
            Collectors.counting()
        )));
// {Engineering=3, Marketing=0, HR=0}  ← 0 counts visible, not missing

// ── Combine filtering + mapping ───────────────────────────
Map<String, List<String>> seniorNamesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.filtering(
            e -> e.yearsExperience() >= 5,
            Collectors.mapping(Employee::name, Collectors.toList())
        )));
// {Engineering=[Alice, Frank], Marketing=[], HR=[]}`
      },
      {
        n: "collectingAndThen — post-process a collector result",
        tag: "COLLECTOR",
        desc: "collectingAndThen(downstream, finisher) applies a finisher function to the result of the downstream collector. Use it to make results unmodifiable, unwrap an Optional, transform the collected value, or convert types.",
        code: `List<String> names = List.of("Alice", "Bob", "Carol", "Dave");

// ── Make collected list unmodifiable ──────────────────────
List<String> unmodifiable = names.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));
// unmodifiable.add("X");  // throws UnsupportedOperationException

// ── Collect to List then get first element ────────────────
Optional<String> first = names.stream()
    .filter(n -> n.startsWith("C"))
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        list -> list.isEmpty() ? Optional.empty() : Optional.of(list.get(0))
    ));

// ── Unwrap Optional from maxBy/minBy ─────────────────────
Employee topEarner = employees.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
        opt -> opt.orElseThrow(() -> new RuntimeException("No employees"))
    ));

// ── Group then transform whole result map ─────────────────
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.groupingBy(Employee::dept, Collectors.counting()),
        Collections::unmodifiableMap   // finisher: make whole map unmodifiable
    ));

// ── Convert collected list to array ──────────────────────
String[] arr = names.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        list -> list.toArray(String[]::new)
    ));

// ── Top-N per group using collectingAndThen ───────────────
Map<String, List<Employee>> top2ByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.collectingAndThen(
            Collectors.toList(),
            list -> list.stream()
                        .sorted(Comparator.comparingDouble(Employee::salary).reversed())
                        .limit(2)
                        .collect(Collectors.toList())
        )));`
      },
      {
        n: "teeing — collect into two collectors simultaneously (Java 12+)",
        tag: "COLLECTOR",
        desc: "teeing(downstream1, downstream2, merger) applies two collectors simultaneously to the same stream and merges the results. The stream is consumed once but both collectors see all elements.",
        code: `List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// ── Sum and count in one pass ──────────────────────────────
record SumCount(int sum, long count) {
    double average() { return count == 0 ? 0 : (double) sum / count; }
}

SumCount result = numbers.stream()
    .collect(Collectors.teeing(
        Collectors.summingInt(Integer::intValue),  // collector 1: sum
        Collectors.counting(),                      // collector 2: count
        SumCount::new                              // merger: combine both results
    ));
System.out.println(result.sum());     // 55
System.out.println(result.count());   // 10
System.out.println(result.average()); // 5.5

// ── Min and max in one pass ───────────────────────────────
record MinMax(Optional<Integer> min, Optional<Integer> max) {}

MinMax minMax = numbers.stream()
    .collect(Collectors.teeing(
        Collectors.minBy(Integer::compareTo),
        Collectors.maxBy(Integer::compareTo),
        MinMax::new
    ));
System.out.println(minMax.min()); // Optional[1]
System.out.println(minMax.max()); // Optional[10]

// ── Partition and count in one pass ──────────────────────
record PartitionResult(List<Integer> evens, List<Integer> odds) {}

PartitionResult parts = numbers.stream()
    .collect(Collectors.teeing(
        Collectors.filtering(n -> n % 2 == 0, Collectors.toList()),
        Collectors.filtering(n -> n % 2 != 0, Collectors.toList()),
        PartitionResult::new
    ));
// parts.evens() = [2, 4, 6, 8, 10]
// parts.odds()  = [1, 3, 5, 7, 9]

// ── Real-world: salary stats in one stream pass ────────────
record SalaryReport(double total, Optional<Employee> topEarner) {}

SalaryReport report = employees.stream()
    .collect(Collectors.teeing(
        Collectors.summingDouble(Employee::salary),
        Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
        SalaryReport::new
    ));`
      },
      {
        n: "Collector.of — custom collector",
        tag: "COLLECTOR",
        desc: "Collector.of(supplier, accumulator, combiner, finisher, characteristics) builds a fully custom collector. The supplier creates the mutable result container; accumulator folds one element into it; combiner merges two containers (for parallel); finisher transforms the container to the final result.",
        code: `// ── Custom collector: collect to an immutable List ─────────
Collector<String, List<String>, List<String>> immutableListCollector = Collector.of(
    ArrayList::new,                          // supplier: creates mutable container
    List::add,                               // accumulator: adds element to container
    (list1, list2) -> {                      // combiner: for parallel streams
        list1.addAll(list2);
        return list1;
    },
    Collections::unmodifiableList,           // finisher: transform to final result
    Collector.Characteristics.UNORDERED      // characteristics (optional)
);

List<String> result = Stream.of("a", "b", "c").collect(immutableListCollector);

// ── Custom: collect to StringBuilder ────────────────────
Collector<String, StringBuilder, String> sbCollector = Collector.of(
    StringBuilder::new,
    StringBuilder::append,
    StringBuilder::append,
    StringBuilder::toString
);

String str = Stream.of("Hello", " ", "World").collect(sbCollector);
// "Hello World"

// ── Custom: running statistics collector ─────────────────
class MutableStats {
    int count = 0; double sum = 0;
    void add(double v)            { count++; sum += v; }
    MutableStats merge(MutableStats o) { count += o.count; sum += o.sum; return this; }
    double average()              { return count == 0 ? 0 : sum / count; }
}

Collector<Double, MutableStats, Double> avgCollector = Collector.of(
    MutableStats::new,
    MutableStats::add,
    MutableStats::merge,
    MutableStats::average
);

Double avg = Stream.of(1.0, 2.0, 3.0, 4.0, 5.0).collect(avgCollector); // 3.0

// ── Custom: top-N collector ────────────────────────────────
static <T> Collector<T, ?, List<T>> topN(int n, Comparator<T> comp) {
    return Collector.of(
        ArrayList::new,
        (list, item) -> {
            list.add(item);
            list.sort(comp.reversed());
            if (list.size() > n) list.remove(list.size() - 1);  // evict smallest
        },
        (a, b) -> { a.addAll(b); a.sort(comp.reversed()); return a.subList(0, Math.min(n, a.size())).stream().collect(Collectors.toList()); },
        list -> list
    );
}

// Usage: top 3 earners
List<Employee> top3 = employees.stream()
    .collect(topN(3, Comparator.comparingDouble(Employee::salary)));`
      },
    ]
  },
  {
    cat: "Parallel Streams",
    icon: "⇉",
    color: "#10B981",
    desc: "Running streams concurrently using the ForkJoinPool.",
    topics: [
      {
        n: "parallelStream, parallel(), sequential() — switching modes",
        tag: "PARALLEL",
        desc: "Parallel streams use ForkJoinPool.commonPool() to process elements concurrently. Use them for CPU-bound, independent, stateless operations on large datasets. They hurt performance for small datasets, I/O-bound work, or ordered operations.",
        code: `List<Integer> numbers = IntStream.rangeClosed(1, 1_000_000)
    .boxed().collect(Collectors.toList());

// ── Create parallel stream ────────────────────────────────
Stream<Integer> parallel1 = numbers.parallelStream();
Stream<Integer> parallel2 = numbers.stream().parallel();

// ── Switch back to sequential ─────────────────────────────
long count = numbers.parallelStream()
    .filter(n -> n % 2 == 0)
    .sequential()          // switch to sequential for ordered output
    .limit(10)
    .count();

// ── CPU-bound: GOOD use case ──────────────────────────────
long sumOfSquaresOfPrimes = numbers.parallelStream()
    .filter(n -> isPrime(n))         // stateless, CPU-intensive
    .mapToLong(n -> (long) n * n)
    .sum();

// ── Benchmark: sequential vs parallel ─────────────────────
long start = System.currentTimeMillis();
long seqSum = numbers.stream().mapToLong(i -> i).sum();
System.out.println("Sequential: " + (System.currentTimeMillis() - start) + "ms");

start = System.currentTimeMillis();
long parSum = numbers.parallelStream().mapToLong(i -> i).sum();
System.out.println("Parallel:   " + (System.currentTimeMillis() - start) + "ms");

// ── Custom ForkJoinPool to avoid hogging common pool ──────
ForkJoinPool customPool = new ForkJoinPool(4);
List<Integer> result = customPool.submit(() ->
    numbers.parallelStream()
           .filter(n -> n % 2 == 0)
           .collect(Collectors.toList())
).get();
customPool.shutdown();

// ── isParallel() — check stream mode ─────────────────────
System.out.println(numbers.stream().isParallel());          // false
System.out.println(numbers.parallelStream().isParallel());  // true

// ── AVOID parallel for: ───────────────────────────────────
// - Small lists (< ~10k elements) — overhead > gain
// - I/O operations (threads block, no CPU benefit)
// - Ordered operations (forEachOrdered, findFirst kill parallelism)
// - Non-thread-safe side effects

static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i <= Math.sqrt(n); i++) if (n % i == 0) return false;
    return true;
}`
      },
    ]
  },
  {
    cat: "Optional",
    icon: "◌",
    color: "#F97316",
    desc: "Wrapper for a value that may or may not be present — the Stream API's partner for null-safe pipelines.",
    topics: [
      {
        n: "Optional — creation, access, chaining",
        tag: "OPTIONAL",
        desc: "Optional<T> is a container that may or may not hold a value. It forces callers to explicitly handle the absent case. Stream terminal operations like findFirst, min, max, reduce return Optional. Never use Optional as a field type — use it only as a method return type.",
        code: `// ── Creating Optional ────────────────────────────────────
Optional<String> present = Optional.of("hello");          // value present
Optional<String> empty   = Optional.empty();              // no value
Optional<String> maybe   = Optional.ofNullable(getValue()); // null → empty

// ── Checking presence ─────────────────────────────────────
present.isPresent();   // true
empty.isPresent();     // false
empty.isEmpty();       // true (Java 11+)

// ── Retrieving the value ──────────────────────────────────
String val1 = present.get();                         // "hello" (throws if empty!)
String val2 = present.orElse("default");             // "hello"
String val3 = empty.orElse("default");               // "default"
String val4 = empty.orElseGet(() -> computeDefault()); // lazy default
String val5 = empty.orElseThrow();                    // throws NoSuchElementException
String val6 = empty.orElseThrow(() -> new UserNotFoundException("not found"));

// ── Conditional execution ─────────────────────────────────
present.ifPresent(v -> System.out.println("Got: " + v));
empty.ifPresent(v -> System.out.println("Won't print"));

// Java 9+: ifPresentOrElse
present.ifPresentOrElse(
    v  -> System.out.println("Present: " + v),
    () -> System.out.println("Absent")
);

// ── Transform: map ────────────────────────────────────────
Optional<Integer> length = present.map(String::length);  // Optional[5]
Optional<Integer> noLen  = empty.map(String::length);    // Optional.empty

Optional<String> upper = present.map(String::toUpperCase);  // Optional[HELLO]

// ── Transform: flatMap (when mapper returns Optional) ─────
Optional<String> result = Optional.of("42")
    .flatMap(s -> {
        try { return Optional.of(Integer.parseInt(s)); }
        catch (NumberFormatException e) { return Optional.empty(); }
    })
    .filter(n -> n > 10)
    .map(n -> "Value is " + n);
// Optional[Value is 42]

// ── filter on Optional ────────────────────────────────────
Optional<String> longStr = present.filter(s -> s.length() > 3);  // Optional[hello]
Optional<String> noStr   = present.filter(s -> s.length() > 10); // Optional.empty

// ── or() — fallback Optional (Java 9+) ───────────────────
Optional<String> withFallback = empty
    .or(() -> Optional.of("fallback"));  // Optional[fallback]

// ── stream() — convert to Stream (Java 9+) ────────────────
long count = Stream.of(
    Optional.of("a"), Optional.empty(), Optional.of("b")
).flatMap(Optional::stream).count();  // 2

// ── Chaining Optional from stream results ────────────────
String topEngineer = employees.stream()
    .filter(e -> e.dept().equals("Engineering"))
    .max(Comparator.comparingDouble(Employee::salary))
    .map(Employee::name)
    .orElse("No engineers");`
      },
    ]
  },
  {
    cat: "Stream Pipeline Patterns",
    icon: "≋",
    color: "#EC4899",
    desc: "Real-world recipes combining multiple stream operations.",
    topics: [
      {
        n: "Frequency map, top-N, inverting a map",
        tag: "PATTERN",
        desc: "Common data transformation patterns built with streams. These cover frequency counting, finding top-N elements, inverting map key-value pairs, and deduplication by a custom key.",
        code: `// ── Frequency map (word count) ───────────────────────────
String text = "the cat sat on the mat the cat";
Map<String, Long> freq = Arrays.stream(text.split(" "))
    .collect(Collectors.groupingBy(w -> w, Collectors.counting()));
// {the=3, cat=2, sat=1, on=1, mat=1}

// ── Top N most frequent ───────────────────────────────────
List<Map.Entry<String, Long>> top3 = freq.entrySet().stream()
    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
    .limit(3)
    .collect(Collectors.toList());
// [(the,3), (cat,2), (sat,1)]

// ── Invert a Map<K,V> → Map<V,K> ────────────────────────
Map<String, Integer> nameToId = Map.of("Alice", 1, "Bob", 2, "Carol", 3);

Map<Integer, String> idToName = nameToId.entrySet().stream()
    .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey));
// {1=Alice, 2=Bob, 3=Carol}

// ── Invert Map<K,V> → Map<V, List<K>> (V may not be unique) ──
Map<String, String> userToDept = Map.of("Alice","Eng","Bob","Mkt","Carol","Eng");

Map<String, List<String>> deptToUsers = userToDept.entrySet().stream()
    .collect(Collectors.groupingBy(
        Map.Entry::getValue,
        Collectors.mapping(Map.Entry::getKey, Collectors.toList())
    ));
// {Eng=[Alice, Carol], Mkt=[Bob]}

// ── Distinct by field (dedup by key) ─────────────────────
record Person(String name, String email) {}
List<Person> people = List.of(
    new Person("Alice", "alice@co.com"),
    new Person("Alice2","alice@co.com"),   // same email!
    new Person("Bob",   "bob@co.com")
);

// Keep first person per unique email
Map<String, Person> deduped = people.stream()
    .collect(Collectors.toMap(
        Person::email,
        p -> p,
        (existing, dup) -> existing    // keep first
    ));

List<Person> uniqueByEmail = new ArrayList<>(deduped.values());

// ── Transpose / pivot ─────────────────────────────────────
List<List<Integer>> matrix = List.of(
    List.of(1, 2, 3),
    List.of(4, 5, 6),
    List.of(7, 8, 9)
);

List<List<Integer>> transposed = IntStream.range(0, matrix.get(0).size())
    .mapToObj(col ->
        matrix.stream().map(row -> row.get(col)).collect(Collectors.toList())
    )
    .collect(Collectors.toList());
// [[1,4,7], [2,5,8], [3,6,9]]`
      },
      {
        n: "Sliding window, batch processing, zip",
        tag: "PATTERN",
        desc: "Advanced stream patterns: processing elements in sliding windows, batching a stream into fixed-size chunks, and zipping two streams together (Java has no built-in zip — see the idiom below).",
        code: `// ── Batch/chunk a list into pages ───────────────────────
public static <T> List<List<T>> chunk(List<T> list, int size) {
    return IntStream.range(0, (list.size() + size - 1) / size)
        .mapToObj(i -> list.subList(
            i * size,
            Math.min((i + 1) * size, list.size())
        ))
        .collect(Collectors.toList());
}

List<Integer> nums = IntStream.rangeClosed(1, 10).boxed().collect(Collectors.toList());
List<List<Integer>> batches = chunk(nums, 3);
// [[1,2,3], [4,5,6], [7,8,9], [10]]

// Process each batch
batches.stream().forEach(batch -> batchInsert(batch));

// ── Sliding window ────────────────────────────────────────
public static <T> Stream<List<T>> slidingWindow(List<T> list, int windowSize) {
    return IntStream.rangeClosed(0, list.size() - windowSize)
        .mapToObj(i -> list.subList(i, i + windowSize));
}

// Moving average (window=3)
List<Double> prices = List.of(10.0, 12.0, 11.0, 13.0, 15.0, 14.0);
List<Double> movingAvg = slidingWindow(prices, 3)
    .map(w -> w.stream().mapToDouble(Double::doubleValue).average().orElse(0))
    .collect(Collectors.toList());
// [11.0, 12.0, 13.0, 14.0]

// ── Zip two streams (no built-in) ─────────────────────────
public static <A, B, C> Stream<C> zip(
        Stream<A> streamA, Stream<B> streamB,
        BiFunction<A, B, C> zipper) {
    Iterator<A> itA = streamA.iterator();
    Iterator<B> itB = streamB.iterator();
    return StreamSupport.stream(Spliterators.spliteratorUnknownSize(
        new Iterator<C>() {
            public boolean hasNext() { return itA.hasNext() && itB.hasNext(); }
            public C next() { return zipper.apply(itA.next(), itB.next()); }
        }, 0), false);
}

List<String> names   = List.of("Alice", "Bob", "Carol");
List<Integer> scores = List.of(95, 82, 91);

List<String> zipped = zip(names.stream(), scores.stream(),
    (name, score) -> name + ": " + score)
    .collect(Collectors.toList());
// ["Alice: 95", "Bob: 82", "Carol: 91"]

// ── Running total (cumulative sum) ────────────────────────
int[] data = {1, 2, 3, 4, 5};
int[] cumulative = new int[data.length];
IntStream.range(0, data.length)
    .forEach(i -> cumulative[i] = (i == 0 ? 0 : cumulative[i - 1]) + data[i]);
// [1, 3, 6, 10, 15]`
      },
      {
        n: "Exception handling in streams",
        tag: "PATTERN",
        desc: "Streams don't play nicely with checked exceptions — lambdas can't throw them. The solutions: wrap in unchecked, use a Try wrapper, or use a result type. Pick the approach that fits your team's style.",
        code: `// ── Problem: checked exceptions in lambdas ───────────────
// This WON'T compile:
List<String> urls = List.of("https://a.com", "https://b.com");
urls.stream()
    .map(url -> new URL(url))   // ← MalformedURLException is checked — compile error!
    .forEach(System.out::println);

// ── Fix 1: Wrap in RuntimeException (quick and dirty) ─────
urls.stream()
    .map(url -> {
        try { return new URL(url); }
        catch (MalformedURLException e) { throw new RuntimeException(e); }
    })
    .forEach(System.out::println);

// ── Fix 2: Helper method — wrap any checked functional ─────
@FunctionalInterface
interface ThrowingFunction<T, R> {
    R apply(T t) throws Exception;
}

static <T, R> Function<T, R> wrap(ThrowingFunction<T, R> fn) {
    return t -> {
        try { return fn.apply(t); }
        catch (Exception e) { throw new RuntimeException(e); }
    };
}

// Usage — clean lambda, exception wrapped automatically
urls.stream()
    .map(wrap(url -> new URL(url)))   // or: wrap(URL::new)
    .forEach(System.out::println);

// ── Fix 3: Result type — capture success or failure ────────
record Try<T>(T value, Exception error) {
    static <T> Try<T> of(ThrowingSupplier<T> s) {
        try { return new Try<>(s.get(), null); }
        catch (Exception e) { return new Try<>(null, e); }
    }
    boolean isSuccess() { return error == null; }
}

List<Try<URL>> results = urls.stream()
    .map(url -> Try.of(() -> new URL(url)))
    .collect(Collectors.toList());

// Separate successes and failures
List<URL> successes = results.stream()
    .filter(Try::isSuccess).map(t -> t.value()).collect(Collectors.toList());

List<Exception> failures = results.stream()
    .filter(t -> !t.isSuccess()).map(Try::error).collect(Collectors.toList());

// ── Fix 4: Filter out failures with Optional ──────────────
List<URL> parsed = urls.stream()
    .map(url -> {
        try { return Optional.of(new URL(url)); }
        catch (MalformedURLException e) {
            System.err.println("Bad URL: " + url);
            return Optional.<URL>empty();
        }
    })
    .flatMap(Optional::stream)   // discard empty Optionals
    .collect(Collectors.toList());`
      },
    ]
  },
];

export { SECTIONS };

const TAG_COLORS = {
  CREATION:     { bg: "#0d3a3a", text: "#58a6ff", border: "#1c4a4a" },
  INTERMEDIATE: { bg: "#3a3a0d", text: "#58a6ff", border: "#4a4a1c" },
  TERMINAL:     { bg: "#3a0d0d", text: "#58a6ff", border: "#4a1c1c" },
  COLLECTOR:    { bg: "#2d0d3a", text: "#58a6ff", border: "#3a1c4a" },
  PARALLEL:     { bg: "#0d3a1c", text: "#58a6ff", border: "#1c4a2d" },
  OPTIONAL:     { bg: "#3a1c0d", text: "#58a6ff", border: "#4a2d1c" },
  PATTERN:      { bg: "#3a0d1c", text: "#58a6ff", border: "#4a1c2d" },
};

export default function JavaStreams() {
  const [search, setSearch]     = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied]     = useState(null);

  const categories  = ["All", ...SECTIONS.map(s => s.cat)];
  const totalTopics = SECTIONS.reduce((s, sec) => s + sec.topics.length, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SECTIONS.map(section => {
      if (activeCat !== "All" && section.cat !== activeCat) return null;
      const topics = section.topics.filter(t =>
        !q || t.n.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
      );
      if (!topics.length) return null;
      return { ...section, topics };
    }).filter(Boolean);
  }, [search, activeCat]);

  const toggle = (cat, n) => {
    const key = `${cat}|${n}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const isOpen = (cat, n) => !!expanded[`${cat}|${n}`];

  const copy = (code, key) => {
    navigator.clipboard?.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div style={{ 
      fontFamily: "'IBM Plex Sans', sans-serif", 
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)", 
      minHeight: "100vh", 
      padding: "40px 20px", 
      color: "#c9d1d9"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Hero ── */}
      <div style={{ borderBottom: "1px solid #21262d", background: "#0d1117", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1f6feb08 1px,transparent 1px),linear-gradient(90deg,#1f6feb08 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -120, right: -80, width: 420, height: 420, background: "radial-gradient(circle,#1f6feb18 0%,transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px 26px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {["#f85149","#d29922","#3fb950"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#58a6ff", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, marginLeft: 6 }}>java.util.stream</span>
          </div>

          <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 30, fontWeight: 800, color: "#f0f6fc", margin: "0 0 6px", letterSpacing: -1 }}>
            Java <span style={{ color: "#58a6ff" }}>Streams API</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#8b949e", margin: "0 0 18px" }}>
            {SECTIONS.length} categories · {totalTopics} operations — intermediate, terminal & collector methods
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search operations..."
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#161b22",
              border: "1px solid #21262d",
              borderRadius: 6,
              color: "#c9d1d9",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              outline: "none",
              transition: "border-color .15s"
            }}
            onFocus={e => e.target.style.borderColor = "#58a6ff"}
            onBlur={e => e.target.style.borderColor = "#21262d"}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {categories.map(cat => {
            const sec = SECTIONS.find(s => s.cat === cat);
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  border: active ? `1px solid ${sec?.color || "#58a6ff"}` : "1px solid #21262d",
                  background: active ? `${sec?.color || "#58a6ff"}20` : "transparent",
                  color: active ? (sec?.color || "#58a6ff") : "#8b949e",
                  transition: "all .15s"
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#8b949e", padding: "4rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            No operations match your search.
          </div>
        )}

        {/* Sections */}
        {filtered.map(section => (
          <div key={section.cat} style={{ marginBottom: 32 }}>

            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #21262d" }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{section.icon}</span>
              <div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 600, color: "#f0f6fc" }}>{section.cat}</span>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#8b949e", margin: "2px 0 0" }}>{section.desc}</p>
              </div>
              <div style={{ flex: 1, height: 1, background: "#21262d" }} />
              <span style={{ background: "#161b22", border: `1px solid ${section.color}40`, borderRadius: 12, padding: "2px 10px", fontSize: 11, color: section.color, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, flexShrink: 0 }}>
                {section.topics.length}
              </span>
            </div>

            {/* Topic cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.topics.map(topic => {
                const open = isOpen(section.cat, topic.n);
                const copyKey = `${section.cat}|${topic.n}`;
                const tagC = TAG_COLORS[topic.tag] || TAG_COLORS.CREATION;
                return (
                  <div key={topic.n}
                    style={{ background: "#161b22", border: `1px solid ${open ? section.color + "40" : "#21262d"}`, borderRadius: 8, overflow: "hidden", transition: "border-color .2s" }}>

                    {/* Header */}
                    <div onClick={() => toggle(section.cat, topic.n)}
                      style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, transition: "background .1s", userSelect: "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1c2128"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      {/* Tag badge */}
                      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: tagC.bg, color: tagC.text, border: `1px solid ${tagC.border}`, flexShrink: 0, marginTop: 2, letterSpacing: 0.5 }}>
                        {topic.tag}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: "#f0f6fc" }}>
                          {topic.n}
                        </div>
                        {!open && (
                          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#8b949e", marginTop: 3, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                            {topic.desc}
                          </div>
                        )}
                      </div>

                      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, fontWeight: 600, color: open ? section.color : "#8b949e", flexShrink: 0, letterSpacing: 0.5 }}>
                        {open ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Expanded */}
                    {open && (
                      <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #21262d" }}>

                        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#8b949e", lineHeight: 1.75, margin: "14px 0 14px" }}>
                          {topic.desc}
                        </p>

                        {/* Code block */}
                        <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, overflow: "auto" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #21262d", background: "#161b22" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ display: "flex", gap: 5 }}>
                                {["#EF4444","#F59E0B","#10B981"].map(c => (
                                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                                ))}
                              </div>
                              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "#8b949e", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
                                Java · {topic.tag}
                              </span>
                            </div>
                            <button onClick={() => copy(topic.code, copyKey)}
                              style={{ background: "none", border: `1px solid ${copied === copyKey ? section.color : "#21262d"}`, borderRadius: 5, padding: "3px 10px", color: copied === copyKey ? section.color : "#8b949e", cursor: "pointer", fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, transition: "all .15s" }}>
                              {copied === copyKey ? "✓ copied!" : "copy"}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: "16px", fontSize: 11.5, lineHeight: 1.75, color: "#c9d1d9", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre", overflowX: "auto" }}>
                            {topic.code}
                          </pre>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}