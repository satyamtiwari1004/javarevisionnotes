import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  {
    cat: "Thread Basics",
    icon: "◎",
    color: "#F97316",
    topics: [
      {
        n: "Creating Threads — Thread class & Runnable",
        desc: "Two fundamental ways to create a thread: extend Thread class or implement Runnable. Runnable is preferred because Java allows only single inheritance — implementing Runnable keeps your class free to extend something else.",
        code: `// ── Way 1: Extend Thread ──────────────────────────────────
class MyThread extends Thread {
    private final String taskName;

    MyThread(String name) { this.taskName = name; }

    @Override
    public void run() {
        System.out.println(taskName + " running on: " + Thread.currentThread().getName());
        try {
            Thread.sleep(1000);  // simulate work
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

// ── Way 2: Implement Runnable (preferred) ─────────────────
class MyTask implements Runnable {
    @Override
    public void run() {
        System.out.println("Task on: " + Thread.currentThread().getName());
    }
}

// ── Way 3: Lambda (Runnable is @FunctionalInterface) ─────
public class Main {
    public static void main(String[] args) throws InterruptedException {
        // Thread class
        MyThread t1 = new MyThread("Download");
        t1.setDaemon(false);        // user thread (default) — JVM waits for it
        t1.setPriority(Thread.MAX_PRIORITY);  // 1-10, default=5
        t1.start();                 // ← start(), NOT run()! run() executes on caller thread

        // Runnable
        Thread t2 = new Thread(new MyTask(), "worker-1");
        t2.start();

        // Lambda shorthand
        Thread t3 = new Thread(() -> System.out.println("Lambda thread!"), "lambda-worker");
        t3.start();

        t1.join();  // main thread waits for t1 to finish
        t2.join();
        t3.join();

        System.out.println("All threads done");
    }
}`
      },
      {
        n: "Runnable vs Callable — Key Differences",
        desc: "Runnable is the older interface for tasks that don't return a value. Callable (introduced in Java 5) is for tasks that return a result and can throw checked exceptions. Callable is used with ExecutorService's submit() which returns a Future for retrieving the result.",
        code: `// ── Runnable — no return value, no checked exceptions ───────
Runnable task = () -> {
    System.out.println("Running task");
    // Can only throw RuntimeException
};

// Used with Thread
new Thread(task).start();

// Used with ExecutorService
ExecutorService executor = Executors.newFixedThreadPool(2);
executor.execute(task);  // execute() takes Runnable, returns void

// ── Callable — returns a value, can throw checked exceptions ──
Callable<String> callableTask = () -> {
    Thread.sleep(1000);  // can throw InterruptedException (checked)
    return "Task completed successfully";
};

// Used with ExecutorService's submit() — returns Future
Future<String> future = executor.submit(callableTask);

try {
    String result = future.get();  // blocks until result is available
    System.out.println(result);
} catch (InterruptedException | ExecutionException e) {
    e.printStackTrace();
}

// ── Key differences summary ───────────────────────────────────────
// 1. Return type: Runnable returns void, Callable returns T
// 2. Exceptions: Runnable can't throw checked exceptions, Callable can
// 3. Method: Runnable.run(), Callable.call()
// 4. Usage: executor.execute(Runnable), executor.submit(Callable) returns Future
// 5. Future: Only Callable tasks give you a Future to get the result

// ── Practical example: parallel computation with Callable ───────
Callable<Integer> computeTask = () -> {
    int sum = 0;
    for (int i = 0; i < 1000; i++) sum += i;
    return sum;
};

Future<Integer> sumFuture = executor.submit(computeTask);
// Do other work while computation runs in background...

try {
    Integer result = sumFuture.get();  // get result when needed
    System.out.println("Sum: " + result);
} catch (Exception e) {
    e.printStackTrace();
}

executor.shutdown();`
      },
      {
        n: "wait() vs sleep() — Key Differences",
        desc: "wait() is an Object method used for inter-thread communication — releases the lock and puts thread in WAITING state until notify/notifyAll. sleep() is a Thread method that pauses execution but holds the lock — used for timing, not coordination.",
        code: `// ── wait() — releases lock, waits for notification ─────────────
class SharedResource {
    private boolean ready = false;

    public synchronized void waitForReady() throws InterruptedException {
        while (!ready) {
            wait();  // releases lock, thread goes to WAITING state
        }
        System.out.println("Resource is ready!");
    }

    public synchronized void setReady() {
        ready = true;
        notifyAll();  // wakes up waiting threads
    }
}

// ── sleep() — holds lock, just pauses execution ───────────────────
Thread sleeper = new Thread(() -> {
    synchronized (lock) {
        try {
            Thread.sleep(2000);  // still holds the lock!
            System.out.println("Done sleeping");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
});

// ── Key differences summary ───────────────────────────────────────
// 1. Class: wait() is in Object, sleep() is in Thread
// 2. Lock: wait() releases lock, sleep() holds lock
// 3. Context: wait() for inter-thread communication, sleep() for timing
// 4. State: wait() → WAITING, sleep() → TIMED_WAITING
// 5. Wake-up: wait() needs notify/notifyAll, sleep() wakes after timeout
// 6. Exception: wait() throws InterruptedException, sleep() throws InterruptedException
// 7. Usage: wait() must be in synchronized block, sleep() can be anywhere

// ── Practical example: producer-consumer pattern ───────────────
class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;

    public BoundedBuffer(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void put(T item) throws InterruptedException {
        while (queue.size() == capacity) {
            wait();  // wait until space available
        }
        queue.add(item);
        notifyAll();  // notify consumers
    }

    public synchronized T take() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();  // wait until item available
        }
        T item = queue.remove();
        notifyAll();  // notify producers
        return item;
    }
}`
      },
      {
        n: "synchronized Method vs Block — When to Use Which",
        desc: "synchronized method locks the entire object instance (or class for static methods). synchronized block locks only a specific object, allowing finer-grained control and better performance by minimizing lock contention.",
        code: `// ── synchronized method — locks entire object instance ───────
class Counter {
    private int count = 0;

    public synchronized void increment() {  // locks 'this' object
        count++;
    }

    public synchronized int getCount() {  // locks 'this' object
        return count;
    }
}

// ── synchronized block — locks only specified object ─────────────
class FineGrainedCounter {
    private int count = 0;
    private final Object lock = new Object();  // dedicated lock object

    public void increment() {
        synchronized (lock) {  // only this block is synchronized
            count++;
        }
        // Other code here runs without holding the lock
    }

    public int getCount() {
        synchronized (lock) {
            return count;
        }
    }
}

// ── When to use which ─────────────────────────────────────────────
// synchronized method:
// - Simple, readable for small methods
// - When you need to lock the entire object
// - When multiple fields need consistent access together

// synchronized block:
// - When you want to minimize lock scope (better performance)
// - When you need to lock on a different object (not 'this')
// - When you have long-running code that shouldn't hold the lock
// - When you need to lock on a class-level object for static context

// ── Performance comparison ───────────────────────────────────────
class PerformanceDemo {
    private int value;
    private final Object lock = new Object();

    // synchronized method — holds lock longer if method has other work
    public synchronized void incrementWithWork() {
        value++;
        doSomeUnrelatedWork();  // unnecessarily holds lock here
    }

    // synchronized block — minimal lock scope
    public void incrementOptimized() {
        synchronized (lock) {
            value++;  // only this needs synchronization
        }
        doSomeUnrelatedWork();  // runs without lock
    }

    private void doSomeUnrelatedWork() {
        // Simulate non-critical work
    }
}`
      },
      {
        n: "volatile Keyword — Visibility Guarantees",
        desc: "volatile ensures visibility of changes to variables across threads — reads always see the most recent write. It prevents CPU cache inconsistencies but doesn't provide atomicity for compound actions (like increment). Use for flags, status variables, not for counters.",
        code: `// ── Without volatile — thread may not see updated value ───────
class WithoutVolatile {
    private boolean running = true;  // cached per thread

    public void stop() {
        running = false;  // change may not be visible to worker thread
    }

    public void worker() {
        while (running) {  // might loop forever despite stop() call
            // do work
        }
    }
}

// ── With volatile — guaranteed visibility ───────────────────────
class WithVolatile {
    private volatile boolean running = true;  // always read from main memory

    public void stop() {
        running = false;  // immediately visible to all threads
    }

    public void worker() {
        while (running) {  // will see the update and exit
            // do work
        }
    }
}

// ── What volatile DOES NOT provide ─────────────────────────────
class VolatileCounter {
    private volatile int count = 0;  // NOT thread-safe for increment!

    public void increment() {
        count++;  // NOT atomic! read-modify-write race condition
        // Equivalent to: temp = count; temp = temp + 1; count = temp;
    }
}

// ── Correct thread-safe counter (use AtomicInteger) ─────────────
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // atomic operation
    }

    public int get() {
        return count.get();
    }
}

// ── When to use volatile ───────────────────────────────────────
// ✓ Boolean flags (running, shutdown, initialized)
// ✓ Status variables (state, phase)
// ✓ Double-checked locking singleton pattern
// ✗ Counters or accumulators (use AtomicInteger instead)
// ✗ Compound operations (need full synchronization)`
      },
      {
        n: "ThreadLocal — Thread-Specific Storage",
        desc: "ThreadLocal provides thread-local variables — each thread has its own independently initialized copy. Useful for per-thread context (user ID, database connection, transaction) without passing through method call chains.",
        code: `// ── Basic ThreadLocal usage ───────────────────────────────────
class ThreadLocalDemo {
    // Each thread gets its own copy of userContext
    private static final ThreadLocal<String> userContext = new ThreadLocal<>();

    public static void setUser(String user) {
        userContext.set(user);  // set value for current thread
    }

    public static String getUser() {
        return userContext.get();  // get value for current thread
    }

    public static void clearUser() {
        userContext.remove();  // clean up to prevent memory leaks
    }
}

// ── Practical example: per-thread database connection ───────────
class ConnectionManager {
    private static final ThreadLocal<Connection> connectionHolder =
        ThreadLocal.withInitial(() -> {
            try {
                return DriverManager.getConnection("jdbc:mysql://localhost/db");
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        });

    public static Connection getConnection() {
        return connectionHolder.get();  // each thread gets its own connection
    }

    public static void cleanup() {
        try {
            connectionHolder.get().close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        connectionHolder.remove();  // important: prevent memory leaks
    }
}

// ── Practical example: request-scoped user context ───────────────
class UserContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();

    public static void setUser(User user) {
        currentUser.set(user);
    }

    public static User getUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove();
    }
}

// In a web application filter:
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        User user = authenticate(request);
        UserContext.setUser(user);  // set for this request thread
        try {
            chain.doFilter(request, response);
        } finally {
            UserContext.clear();  // always clean up
        }
    }
}

// ── Important: always clean up ThreadLocal to prevent leaks ─────
// ThreadLocal values are stored in a map keyed by Thread.
// If you don't remove() values, they stay in memory as long as the thread lives.
// In thread pools (like web servers), threads are reused, causing memory leaks.`
      },
      {
        n: "Thread Lifecycle & State Transitions",
        desc: "A Java thread passes through 6 states: NEW → RUNNABLE → (BLOCKED | WAITING | TIMED_WAITING) → TERMINATED. Understanding these transitions is critical for debugging deadlocks and performance issues.",
        code: `// Thread states: NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED

public class ThreadLifecycleDemo {

    public static void main(String[] args) throws InterruptedException {

        Object lock = new Object();

        Thread t = new Thread(() -> {
            synchronized (lock) {          // acquires monitor
                try {
                    lock.wait(2000);       // TIMED_WAITING — releases lock, waits
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });

        System.out.println(t.getState());  // NEW

        t.start();
        Thread.sleep(100);
        System.out.println(t.getState());  // TIMED_WAITING

        synchronized (lock) {
            lock.notifyAll();              // wake up t
        }

        Thread.sleep(100);
        System.out.println(t.getState());  // TERMINATED

        // ── Checking state programmatically ──────────────────────
        Thread worker = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                // do work
            }
        });
        worker.start();

        System.out.println("Alive: "     + worker.isAlive());
        System.out.println("Daemon: "    + worker.isDaemon());
        System.out.println("Priority: "  + worker.getPriority());
        System.out.println("ID: "        + worker.getId());
        System.out.println("State: "     + worker.getState());  // RUNNABLE

        worker.interrupt();  // sets interrupt flag → loop exits
    }
}`
      },
      {
        n: "Thread Methods — sleep, join, interrupt, yield",
        desc: "Core instance and static methods for thread coordination. sleep() pauses without releasing locks; join() makes caller wait; interrupt() signals a thread to stop; yield() hints the scheduler to switch.",
        code: `public class ThreadMethods {

    // ── sleep(ms) — pauses current thread, keeps locks ────────
    static void sleepDemo() throws InterruptedException {
        System.out.println("Before sleep");
        Thread.sleep(500);   // current thread sleeps 500ms
        // With TimeUnit for readability:
        TimeUnit.SECONDS.sleep(1);
        System.out.println("After sleep");
    }

    // ── join() — wait for another thread to finish ────────────
    static void joinDemo() throws InterruptedException {
        Thread downloader = new Thread(() -> {
            try { Thread.sleep(2000); } catch (InterruptedException e) {}
            System.out.println("Download done");
        });

        downloader.start();
        downloader.join();          // main waits here until download finishes
        downloader.join(1000);      // wait at MOST 1000ms
        System.out.println("Processing downloaded file");
    }

    // ── interrupt() — cooperative cancellation ────────────────
    static void interruptDemo() {
        Thread task = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                System.out.println("Working...");
                try {
                    Thread.sleep(200);  // sleep clears interrupt flag & throws
                } catch (InterruptedException e) {
                    System.out.println("Interrupted during sleep — stopping");
                    Thread.currentThread().interrupt(); // re-set flag!
                    break;
                }
            }
        });

        task.start();
        try { Thread.sleep(600); } catch (InterruptedException e) {}
        task.interrupt();  // signals the thread to stop
    }

    // ── yield() — hint to give up CPU (rarely used directly) ──
    static void yieldDemo() {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("T1: " + i);
                Thread.yield();  // hint: let other threads run
            }
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("T2: " + i);
                Thread.yield();
            }
        });
        t1.start(); t2.start();
    }
}`
      },
      {
        n: "Daemon Threads",
        desc: "Daemon threads are background service threads (GC, JIT compiler). JVM exits when only daemon threads remain — they are abruptly killed. Never use daemon threads for I/O or database work.",
        code: `public class DaemonDemo {

    public static void main(String[] args) throws InterruptedException {

        // ── Daemon thread — JVM won't wait for it ──────────────
        Thread heartbeat = new Thread(() -> {
            while (true) {
                System.out.println("♥ heartbeat ping");
                try { Thread.sleep(500); } catch (InterruptedException e) { break; }
            }
        });
        heartbeat.setDaemon(true);  // must be set BEFORE start()
        heartbeat.start();

        // ── User thread — JVM waits ────────────────────────────
        Thread mainWork = new Thread(() -> {
            try {
                Thread.sleep(2000);
                System.out.println("Main work done");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        mainWork.setDaemon(false);  // default
        mainWork.start();
        mainWork.join();
        // JVM exits here; heartbeat daemon is killed automatically
    }
}`
      },
    ]
  },
  {
    cat: "Synchronization",
    icon: "⟳",
    color: "#A855F7",
    topics: [
      {
        n: "synchronized — keyword, methods, blocks",
        desc: "The synchronized keyword acquires a monitor lock before entering a block or method, ensuring only one thread executes it at a time. Method-level locks the instance; block-level gives finer granularity.",
        code: `public class SynchronizationDemo {

    private int count = 0;
    private final Object counterLock = new Object();  // dedicated lock object

    // ── Synchronized instance method — locks 'this' ───────────
    public synchronized void increment() {
        count++;   // atomic under the lock
    }

    // ── Synchronized static method — locks the Class object ───
    private static int sharedCounter = 0;
    public static synchronized void incrementShared() {
        sharedCounter++;
    }

    // ── Synchronized block — finer granularity ─────────────────
    public void addAmount(int amount) {
        // non-critical work (no lock needed)
        int validated = validate(amount);

        synchronized (counterLock) {    // lock only where needed
            count += validated;
        }

        // more non-critical work
        logUpdate(count);
    }

    // ── Why synchronized? Race condition without it ────────────
    static class Counter {
        private int value = 0;

        // NOT thread-safe — multiple threads can read stale value
        public void unsafeIncrement() { value++; }          // read-modify-write is 3 ops!

        // Thread-safe
        public synchronized void safeIncrement() { value++; }

        public synchronized int get() { return value; }
    }

    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Thread[] threads = new Thread[100];

        for (int i = 0; i < 100; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) counter.safeIncrement();
            });
            threads[i].start();
        }

        for (Thread t : threads) t.join();
        System.out.println("Expected 100000, got: " + counter.get()); // always 100000
    }

    private int validate(int v) { return v > 0 ? v : 0; }
    private void logUpdate(int v) { /* log */ }
}`
      },
      {
        n: "volatile keyword",
        desc: "volatile guarantees visibility — all writes to a volatile field are immediately visible to other threads. It does NOT guarantee atomicity (i++ is still not thread-safe). Use for flags and single-variable state.",
        code: `public class VolatileDemo {

    // ── Without volatile — other threads may see stale cached value ──
    private static boolean runningNonVolatile = true;  // may be CPU-cached!

    // ── With volatile — write goes directly to main memory ──────────
    private static volatile boolean running = true;
    private static volatile int      workerStatus = 0;   // visibility only

    public static void main(String[] args) throws InterruptedException {

        Thread worker = new Thread(() -> {
            System.out.println("Worker started");
            while (running) {                  // reads fresh value every iteration
                doWork();
            }
            System.out.println("Worker stopped cleanly");
        });

        worker.start();
        Thread.sleep(100);

        running = false;   // write visible to worker thread immediately

        worker.join();

        // ── volatile does NOT make compound ops atomic ──────────────
        // This is STILL a race condition:
        //   private static volatile int counter = 0;
        //   counter++;   // read-modify-write — 3 separate ops, not atomic!
        //
        // For atomic compound ops, use AtomicInteger or synchronized

        // ── Double-checked locking needs volatile ───────────────────
        System.out.println("Done");
    }

    static void doWork() {
        try { Thread.sleep(10); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

// ── Correct Singleton with volatile + double-checked locking ──────
class Singleton {
    private static volatile Singleton instance;  // volatile is mandatory here!

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                         // first check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {                 // second check (with lock)
                    instance = new Singleton();         // volatile ensures full init visible
                }
            }
        }
        return instance;
    }
}`
      },
      {
        n: "wait() / notify() / notifyAll()",
        desc: "Object methods for thread communication. A thread calls wait() inside a synchronized block to release the lock and sleep until another thread calls notify()/notifyAll() on the same object. Always call in a while loop to handle spurious wakeups.",
        code: `// Classic Producer-Consumer with wait/notify
public class WaitNotifyDemo {

    private final Queue<Integer> buffer = new LinkedList<>();
    private final int CAPACITY = 5;
    private final Object lock = new Object();

    // ── Producer ───────────────────────────────────────────────
    class Producer implements Runnable {
        @Override
        public void run() {
            int item = 0;
            while (true) {
                synchronized (lock) {
                    // ALWAYS use while (not if) for spurious wakeups
                    while (buffer.size() == CAPACITY) {
                        try {
                            System.out.println("Buffer full — producer waiting");
                            lock.wait();   // releases lock; sleeps until notified
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt(); return;
                        }
                    }
                    buffer.add(item);
                    System.out.println("Produced: " + item++);
                    lock.notifyAll();  // wake ALL waiting threads (safer than notify)
                }
            }
        }
    }

    // ── Consumer ───────────────────────────────────────────────
    class Consumer implements Runnable {
        @Override
        public void run() {
            while (true) {
                synchronized (lock) {
                    while (buffer.isEmpty()) {
                        try {
                            System.out.println("Buffer empty — consumer waiting");
                            lock.wait();
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt(); return;
                        }
                    }
                    int item = buffer.poll();
                    System.out.println("Consumed: " + item);
                    lock.notifyAll();
                }
            }
        }
    }

    public static void main(String[] args) {
        WaitNotifyDemo demo = new WaitNotifyDemo();
        new Thread(demo.new Producer()).start();
        new Thread(demo.new Consumer()).start();
        new Thread(demo.new Consumer()).start();
    }
}`
      },
      {
        n: "Deadlock, Livelock & Starvation",
        desc: "Deadlock: two threads each hold a lock and wait for the other's lock — circular wait. Livelock: threads keep reacting to each other but make no progress. Starvation: a thread never gets CPU time because others keep getting priority.",
        code: `// ── DEADLOCK example ───────────────────────────────────────
public class DeadlockDemo {

    static final Object lockA = new Object();
    static final Object lockB = new Object();

    static void deadlock() {
        Thread t1 = new Thread(() -> {
            synchronized (lockA) {           // t1 holds lockA
                sleep(50);
                synchronized (lockB) {       // t1 wants lockB — BLOCKED (t2 has it)
                    System.out.println("T1 acquired both locks");
                }
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            synchronized (lockB) {           // t2 holds lockB
                sleep(50);
                synchronized (lockA) {       // t2 wants lockA — BLOCKED (t1 has it)
                    System.out.println("T2 acquired both locks");
                }
            }
        }, "t2");

        t1.start(); t2.start();
        // → DEADLOCK: neither t1 nor t2 can proceed
    }

    // ── DEADLOCK PREVENTION — always lock in the same order ────
    static void safeTransfer(Account from, Account to, int amount) {
        // Order by identity hashCode to ensure consistent lock ordering
        Object first  = System.identityHashCode(from) < System.identityHashCode(to) ? from : to;
        Object second = first == from ? to : from;

        synchronized (first) {
            synchronized (second) {
                from.debit(amount);
                to.credit(amount);
            }
        }
    }

    // ── DETECT deadlock at runtime with ThreadMXBean ────────────
    static void detectDeadlock() {
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        long[] deadlocked = bean.findDeadlockedThreads();
        if (deadlocked != null) {
            System.out.println("Deadlocked threads found: " + deadlocked.length);
            for (ThreadInfo info : bean.getThreadInfo(deadlocked)) {
                System.out.println(info.getThreadName() + " waiting on " + info.getLockName());
            }
        }
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
}`
      },
    ]
  },
  {
    cat: "Locks & Concurrent Utils",
    icon: "🔒",
    color: "#06B6D4",
    topics: [
      {
        n: "ReentrantLock — explicit locking",
        desc: "ReentrantLock is a more flexible alternative to synchronized. It supports try-lock (non-blocking attempt), timed lock, interruptible lock, and fairness policy. Always unlock in a finally block.",
        code: `import java.util.concurrent.locks.*;

public class ReentrantLockDemo {

    private final ReentrantLock lock = new ReentrantLock(true); // true = fair (FIFO)
    private int balance = 1000;

    // ── Basic usage — always unlock in finally ──────────────────
    public void withdraw(int amount) {
        lock.lock();
        try {
            if (balance >= amount) {
                Thread.sleep(50);   // simulate processing
                balance -= amount;
                System.out.println(Thread.currentThread().getName() +
                                   " withdrew " + amount + ", balance: " + balance);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();          // MUST be in finally!
        }
    }

    // ── tryLock — non-blocking, avoid deadlock ──────────────────
    public boolean tryWithdraw(int amount) {
        if (lock.tryLock()) {       // returns immediately
            try {
                balance -= amount;
                return true;
            } finally {
                lock.unlock();
            }
        }
        System.out.println("Could not get lock, skipping");
        return false;
    }

    // ── tryLock with timeout ────────────────────────────────────
    public boolean timedWithdraw(int amount) throws InterruptedException {
        if (lock.tryLock(500, TimeUnit.MILLISECONDS)) {
            try {
                balance -= amount;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }

    // ── lockInterruptibly — can be cancelled ────────────────────
    public void interruptibleWithdraw(int amount) throws InterruptedException {
        lock.lockInterruptibly();   // throws InterruptedException if interrupted while waiting
        try {
            balance -= amount;
        } finally {
            lock.unlock();
        }
    }

    // ── Condition variables (replacement for wait/notify) ───────
    private final Condition notEmpty  = lock.newCondition();
    private final Queue<String> queue = new LinkedList<>();

    public void produce(String item) throws InterruptedException {
        lock.lock();
        try {
            queue.add(item);
            notEmpty.signalAll();   // wake waiting consumers
        } finally { lock.unlock(); }
    }

    public String consume() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) notEmpty.await();  // releases lock, waits
            return queue.poll();
        } finally { lock.unlock(); }
    }
}`
      },
      {
        n: "ReadWriteLock — concurrent reads, exclusive writes",
        desc: "ReadWriteLock allows multiple threads to read simultaneously, but only one thread to write (and no reads during write). Perfect for read-heavy caches — massive throughput improvement over synchronized.",
        code: `import java.util.concurrent.locks.*;

public class ReadWriteLockDemo {

    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock  = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<String, String> cache = new HashMap<>();

    // Multiple threads can call this simultaneously
    public String get(String key) {
        readLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " reading");
            Thread.sleep(10);   // simulate read
            return cache.get(key);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); return null;
        } finally {
            readLock.unlock();
        }
    }

    // Only one thread at a time; blocks all readers too
    public void put(String key, String value) {
        writeLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " writing");
            Thread.sleep(50);   // simulate expensive write
            cache.put(key, value);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            writeLock.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        ReadWriteLockDemo demo = new ReadWriteLockDemo();
        demo.put("config", "production");

        // 10 readers — all run concurrently
        ExecutorService exec = Executors.newFixedThreadPool(11);
        for (int i = 0; i < 10; i++) {
            exec.submit(() -> System.out.println("Read: " + demo.get("config")));
        }
        exec.submit(() -> demo.put("config", "staging"));  // 1 writer — blocks all

        exec.shutdown();
        exec.awaitTermination(5, TimeUnit.SECONDS);
    }
}

// StampedLock — Java 8, even faster with optimistic reads
class StampedLockDemo {
    private final StampedLock sl = new StampedLock();
    private double x = 0, y = 0;

    public void move(double dx, double dy) {
        long stamp = sl.writeLock();
        try { x += dx; y += dy; }
        finally { sl.unlockWrite(stamp); }
    }

    public double distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead();  // no lock — just a stamp
        double cx = x, cy = y;
        if (!sl.validate(stamp)) {           // was there a write while we read?
            stamp = sl.readLock();           // fall back to read lock
            try { cx = x; cy = y; }
            finally { sl.unlockRead(stamp); }
        }
        return Math.sqrt(cx * cx + cy * cy);
    }
}`
      },
      {
        n: "Semaphore, CountDownLatch, CyclicBarrier, Phaser",
        desc: "High-level coordination utilities. Semaphore limits concurrent access. CountDownLatch waits for N events. CyclicBarrier waits for N threads. Phaser is a flexible, reusable multi-phase barrier.",
        code: `// ── Semaphore — limit concurrent access (e.g. DB connection pool) ──
public class SemaphoreDemo {

    private final Semaphore dbPool = new Semaphore(5, true); // 5 permits, fair

    public void queryDatabase(int taskId) throws InterruptedException {
        dbPool.acquire();       // wait for a permit (blocks if 0 available)
        System.out.println("Task " + taskId + " acquired DB connection. Remaining: " + dbPool.availablePermits());
        try {
            Thread.sleep(200);  // simulate DB query
        } finally {
            dbPool.release();   // always release in finally
            System.out.println("Task " + taskId + " released connection");
        }
    }
}

// ── CountDownLatch — wait for N events before proceeding ──
public class LatchDemo {

    public static void main(String[] args) throws InterruptedException {
        int WORKERS = 5;
        CountDownLatch startGun    = new CountDownLatch(1);  // all wait for start
        CountDownLatch allDone     = new CountDownLatch(WORKERS);

        for (int i = 0; i < WORKERS; i++) {
            final int id = i;
            new Thread(() -> {
                try {
                    startGun.await();           // all workers wait here
                    System.out.println("Worker " + id + " started");
                    Thread.sleep(100 * id);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    allDone.countDown();         // decrement counter
                }
            }).start();
        }

        System.out.println("Ready... Set...");
        startGun.countDown();                   // releases all workers simultaneously

        allDone.await();                        // main waits until all workers finish
        System.out.println("All workers done!");
        // Note: CountDownLatch CANNOT be reset
    }
}

// ── CyclicBarrier — all threads rendezvous at a point ────
public class BarrierDemo {

    static void phaseComputation(int phase, int threadId) throws InterruptedException {
        Thread.sleep(100 * (threadId + 1));
        System.out.println("Thread " + threadId + " done with phase " + phase);
    }

    public static void main(String[] args) {
        int THREADS = 3;
        // barrier action runs when all threads arrive
        CyclicBarrier barrier = new CyclicBarrier(THREADS,
            () -> System.out.println("=== All threads reached barrier — next phase ==="));

        for (int i = 0; i < THREADS; i++) {
            final int id = i;
            new Thread(() -> {
                try {
                    for (int phase = 1; phase <= 3; phase++) {
                        phaseComputation(phase, id);
                        barrier.await();         // wait for all threads
                        // All threads start next phase together
                        // barrier is REUSABLE (cyclic)
                    }
                } catch (Exception e) { e.printStackTrace(); }
            }).start();
        }
    }
}

// ── Phaser — flexible, dynamic multi-phase barrier ───────
public class PhaserDemo {

    public static void main(String[] args) {
        Phaser phaser = new Phaser(1); // register main thread

        for (int i = 0; i < 3; i++) {
            phaser.register();         // register each worker
            final int id = i;
            new Thread(() -> {
                System.out.println("Worker " + id + " phase 0");
                phaser.arriveAndAwaitAdvance();   // barrier at phase 0

                System.out.println("Worker " + id + " phase 1");
                phaser.arriveAndDeregister();     // done — deregister from phaser
            }).start();
        }

        phaser.arriveAndAwaitAdvance();   // main waits at phase 0
        System.out.println("All done phase 0");
        phaser.arriveAndDeregister();     // main deregisters
    }
}`
      },
      {
        n: "Atomic Classes — lock-free thread safety",
        desc: "java.util.concurrent.atomic classes use CPU-level Compare-And-Swap (CAS) instructions — no locking, no blocking, faster than synchronized for single-variable updates.",
        code: `import java.util.concurrent.atomic.*;

public class AtomicDemo {

    // ── AtomicInteger ──────────────────────────────────────────
    private final AtomicInteger counter = new AtomicInteger(0);

    public void incrementDemo() {
        counter.incrementAndGet();          // atomic i++, returns new value
        counter.getAndIncrement();          // atomic i++, returns old value
        counter.addAndGet(5);               // atomic += 5
        counter.compareAndSet(10, 20);      // CAS: if value==10, set to 20
        counter.updateAndGet(x -> x * 2);  // atomic lambda update
        counter.accumulateAndGet(10, Integer::sum); // atomic accumulate
    }

    // ── AtomicLong for counters ────────────────────────────────
    private final AtomicLong requestCount  = new AtomicLong(0);
    private final AtomicLong errorCount    = new AtomicLong(0);

    // ── AtomicBoolean for flags ───────────────────────────────
    private final AtomicBoolean started = new AtomicBoolean(false);

    public void startOnce() {
        if (started.compareAndSet(false, true)) {  // atomic check-then-set
            System.out.println("Service started!");
        } else {
            System.out.println("Already started");
        }
    }

    // ── AtomicReference — lock-free object references ─────────
    private final AtomicReference<String> config = new AtomicReference<>("default");

    public void updateConfig(String expected, String newVal) {
        boolean updated = config.compareAndSet(expected, newVal);
        System.out.println("Config update " + (updated ? "succeeded" : "failed"));
    }

    // ── LongAdder — better than AtomicLong under HIGH contention ─
    private final LongAdder hitCount = new LongAdder();

    public void recordHit() {
        hitCount.increment();   // each thread updates its own cell → no contention
    }
    public long getHitCount() { return hitCount.sum(); }

    // ── AtomicIntegerArray ────────────────────────────────────
    private final AtomicIntegerArray buckets = new AtomicIntegerArray(10);

    public void incrementBucket(int index) {
        buckets.incrementAndGet(index);  // lock-free per-bucket increment
    }
}`
      },
    ]
  },
  {
    cat: "Executor Framework",
    icon: "⚙",
    color: "#10B981",
    topics: [
      {
        n: "Executors & ThreadPoolExecutor — the full picture",
        desc: "ExecutorService decouples task submission from thread management. ThreadPoolExecutor is the full-featured implementation with corePoolSize, maximumPoolSize, keepAliveTime, and a work queue. Factory methods like Executors.newFixedThreadPool() create common configurations.",
        code: `import java.util.concurrent.*;

public class ExecutorDemo {

    // ── Factory methods (convenience) ─────────────────────────
    ExecutorService fixed   = Executors.newFixedThreadPool(4);        // 4 threads, unbounded queue
    ExecutorService cached  = Executors.newCachedThreadPool();         // grows/shrinks, 60s idle
    ExecutorService single  = Executors.newSingleThreadExecutor();     // 1 thread, ordered
    ScheduledExecutorService sched = Executors.newScheduledThreadPool(2);

    // ── ThreadPoolExecutor — full control ─────────────────────
    ThreadPoolExecutor pool = new ThreadPoolExecutor(
        4,                              // corePoolSize: always-alive threads
        8,                              // maximumPoolSize: max under load
        60L, TimeUnit.SECONDS,          // keepAliveTime: idle thread timeout
        new LinkedBlockingQueue<>(100), // workQueue: bounded — prevents OOM
        new ThreadFactory() {
            private int count = 0;
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "worker-" + count++);
                t.setDaemon(false);
                return t;
            }
        },
        new ThreadPoolExecutor.CallerRunsPolicy()  // rejection policy (see below)
    );

    // ── Rejection Policies (when queue is full AND pool is at max) ─
    // AbortPolicy      (default): throws RejectedExecutionException
    // CallerRunsPolicy:           caller thread runs the task (back-pressure)
    // DiscardPolicy:              silently drops the task
    // DiscardOldestPolicy:        drops oldest queued task, then retries

    // ── Submit tasks ────────────────────────────────────────────
    public void submitDemo() throws Exception {
        // Runnable — no return value
        pool.execute(() -> System.out.println("Fire and forget"));

        // Callable — returns a value via Future
        Future<Integer> future = pool.submit(() -> {
            Thread.sleep(100);
            return 42;
        });

        // future.get() BLOCKS until done (or timeout)
        Integer result = future.get(2, TimeUnit.SECONDS);
        System.out.println("Result: " + result);

        boolean cancelled = future.cancel(true);   // interrupt if running
        future.isCancelled();
        future.isDone();
    }

    // ── Shutdown gracefully ─────────────────────────────────────
    public void shutdownDemo() throws InterruptedException {
        pool.shutdown();                       // no new tasks; finish queued ones
        if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
            pool.shutdownNow();                // interrupt running tasks
        }
    }

    // ── Monitor pool state ─────────────────────────────────────
    public void monitorDemo() {
        System.out.println("Pool size:    " + pool.getPoolSize());
        System.out.println("Active:       " + pool.getActiveCount());
        System.out.println("Queue size:   " + pool.getQueue().size());
        System.out.println("Completed:    " + pool.getCompletedTaskCount());
    }
}`
      },
      {
        n: "invokeAll & invokeAny — bulk task execution",
        desc: "invokeAll() submits all tasks, waits for ALL to complete, returns futures. invokeAny() submits all tasks, returns the FIRST successful result, cancels the rest. Both block the caller.",
        code: `public class InvokeDemo {

    ExecutorService exec = Executors.newFixedThreadPool(4);

    // ── invokeAll — run all, get all results ────────────────────
    public void invokeAllDemo() throws Exception {
        List<Callable<String>> tasks = List.of(
            () -> { Thread.sleep(100); return "Task A done"; },
            () -> { Thread.sleep(200); return "Task B done"; },
            () -> { Thread.sleep(50);  return "Task C done"; }
        );

        // Blocks until ALL tasks finish (or timeout)
        List<Future<String>> futures = exec.invokeAll(tasks, 5, TimeUnit.SECONDS);

        for (Future<String> f : futures) {
            if (!f.isCancelled()) {
                System.out.println(f.get());  // get() won't block — already done
            }
        }
    }

    // ── invokeAny — fastest wins ───────────────────────────────
    public void invokeAnyDemo() throws Exception {
        List<Callable<String>> searchTasks = List.of(
            () -> { Thread.sleep(500); return "Result from DB";    },
            () -> { Thread.sleep(100); return "Result from Cache"; },  // wins!
            () -> { Thread.sleep(300); return "Result from API";   }
        );

        // Returns the FIRST successful result; others are cancelled
        String fastest = exec.invokeAny(searchTasks);
        System.out.println("Got: " + fastest);  // "Result from Cache"
    }
}`
      },
      {
        n: "CompletableFuture — async pipelines",
        desc: "CompletableFuture enables non-blocking async composition. Chain operations with thenApply (transform), thenCompose (flatMap), thenCombine (merge two futures), exceptionally (error handling), and allOf/anyOf (fan-out).",
        code: `import java.util.concurrent.*;

public class CompletableFutureDemo {

    ExecutorService exec = Executors.newFixedThreadPool(4);

    // ── Basic async task ────────────────────────────────────────
    public void basicDemo() throws Exception {
        CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
            sleep(200);
            return "Hello";
        }, exec);  // runs on exec; without arg, uses ForkJoinPool.commonPool()

        // Non-blocking — registers callback
        cf.thenAccept(result -> System.out.println("Got: " + result));

        cf.get();  // block if you must
    }

    // ── Chaining pipeline ──────────────────────────────────────
    public CompletableFuture<String> pipelineDemo(Long userId) {
        return CompletableFuture
            .supplyAsync(() -> fetchUser(userId), exec)           // User
            .thenApply(user -> enrichUser(user))                  // EnrichedUser
            .thenApply(eu -> formatResponse(eu))                  // String
            .thenCompose(str -> sendNotification(str))            // flatMap
            .exceptionally(ex -> {                                // error handler
                System.out.println("Error: " + ex.getMessage());
                return "fallback-response";
            });
    }

    // ── Combine two independent futures ───────────────────────
    public void combineDemo() throws Exception {
        CompletableFuture<String> userFuture  = CompletableFuture.supplyAsync(() -> fetchUserName(1L));
        CompletableFuture<Double> scoreFuture = CompletableFuture.supplyAsync(() -> fetchScore(1L));

        // Both run in parallel; combined when both finish
        CompletableFuture<String> combined = userFuture.thenCombine(scoreFuture,
            (name, score) -> name + " has score " + score);

        System.out.println(combined.get());
    }

    // ── Fan-out: wait for ALL ─────────────────────────────────
    public void allOfDemo() throws Exception {
        List<CompletableFuture<String>> futures = List.of(
            CompletableFuture.supplyAsync(() -> { sleep(100); return "A"; }),
            CompletableFuture.supplyAsync(() -> { sleep(200); return "B"; }),
            CompletableFuture.supplyAsync(() -> { sleep(50);  return "C"; })
        );

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenRun(() -> {
                List<String> results = futures.stream()
                    .map(CompletableFuture::join)  // join() = get() without checked exception
                    .collect(Collectors.toList());
                System.out.println("All results: " + results);
            }).get();
    }

    // ── anyOf: first wins ─────────────────────────────────────
    public void anyOfDemo() throws Exception {
        CompletableFuture<Object> first = CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(() -> { sleep(300); return "slow"; }),
            CompletableFuture.supplyAsync(() -> { sleep(50);  return "fast"; }),
            CompletableFuture.supplyAsync(() -> { sleep(500); return "slowest"; })
        );
        System.out.println("Fastest: " + first.get());  // "fast"
    }

    // ── timeout & fallback (Java 9+) ─────────────────────────
    public void timeoutDemo() throws Exception {
        CompletableFuture<String> result = CompletableFuture
            .supplyAsync(() -> { sleep(2000); return "slow result"; })
            .orTimeout(500, TimeUnit.MILLISECONDS)          // throws TimeoutException after 500ms
            .exceptionally(ex -> "timeout fallback");

        System.out.println(result.get());
    }

    // ── handle() — process both success and error ────────────
    public void handleDemo() throws Exception {
        CompletableFuture<String> result = CompletableFuture
            .supplyAsync(() -> {
                if (Math.random() < 0.5) throw new RuntimeException("oops");
                return "success";
            })
            .handle((value, ex) -> {         // called regardless of success/failure
                if (ex != null) return "handled error: " + ex.getMessage();
                return "value: " + value;
            });
        System.out.println(result.get());
    }

    static void sleep(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) {} }
    String fetchUser(Long id)    { return "User#" + id; }
    String enrichUser(String u)  { return u + "+enriched"; }
    String formatResponse(String s) { return "Response[" + s + "]"; }
    CompletableFuture<String> sendNotification(String s) { return CompletableFuture.completedFuture(s); }
    String fetchUserName(Long id) { return "Alice"; }
    double fetchScore(Long id)   { return 98.5; }
}`
      },
      {
        n: "ScheduledExecutorService — delayed & periodic tasks",
        desc: "Replaces Timer and TimerTask (which have issues with exceptions killing the entire timer). Supports one-shot delayed execution and periodic scheduling with fixed-rate or fixed-delay semantics.",
        code: `public class ScheduledExecDemo {

    ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);

    public void demo() throws Exception {

        // ── One-shot delay ─────────────────────────────────────
        ScheduledFuture<?> delayed = scheduler.schedule(
            () -> System.out.println("Runs once after 2s"),
            2, TimeUnit.SECONDS
        );

        // ── Fixed rate — runs every N ms from START time ────────
        // Period = 1s; if task takes 200ms, next starts 800ms after
        // If task takes 1500ms, next runs IMMEDIATELY (no accumulation)
        ScheduledFuture<?> fixedRate = scheduler.scheduleAtFixedRate(
            () -> System.out.println("Fixed rate tick: " + Instant.now()),
            0,       // initialDelay
            1000,    // period
            TimeUnit.MILLISECONDS
        );

        // ── Fixed delay — waits N ms after COMPLETION ──────────
        // Period = 1s; if task takes 200ms, next starts 1200ms after start
        ScheduledFuture<?> fixedDelay = scheduler.scheduleWithFixedDelay(
            () -> {
                System.out.println("Fixed delay tick");
                processData(); // duration varies — fixed delay absorbs it
            },
            500,     // initialDelay
            1000,    // delay after completion
            TimeUnit.MILLISECONDS
        );

        // ── Cancel a periodic task ─────────────────────────────
        scheduler.schedule(() -> {
            fixedRate.cancel(false);   // false = don't interrupt if running
            System.out.println("Fixed rate task cancelled");
        }, 5, TimeUnit.SECONDS);

        // ── Shutdown ───────────────────────────────────────────
        scheduler.schedule(() -> {
            scheduler.shutdown();
        }, 10, TimeUnit.SECONDS);
    }

    void processData() {
        try { Thread.sleep((long)(Math.random() * 200)); } catch (InterruptedException e) {}
    }
}`
      },
    ]
  },
  {
    cat: "Fork/Join Pool",
    icon: "⑂",
    color: "#F59E0B",
    topics: [
      {
        n: "ForkJoinPool — divide and conquer",
        desc: "ForkJoinPool is designed for divide-and-conquer recursive tasks. It uses work-stealing — idle threads steal tasks from busy threads' queues, maximizing CPU utilization. RecursiveTask returns a value; RecursiveAction has no return value.",
        code: `import java.util.concurrent.*;

// ── RecursiveTask<V> — returns a value ────────────────────
public class ParallelSumTask extends RecursiveTask<Long> {

    private static final int THRESHOLD = 10_000;  // sequential below this size
    private final long[] array;
    private final int start, end;

    public ParallelSumTask(long[] array, int start, int end) {
        this.array = array; this.start = start; this.end = end;
    }

    @Override
    protected Long compute() {
        int length = end - start;

        if (length <= THRESHOLD) {
            // ── Base case: compute sequentially ───────────────
            long sum = 0;
            for (int i = start; i < end; i++) sum += array[i];
            return sum;
        }

        // ── Recursive case: fork into subtasks ────────────────
        int mid = start + length / 2;
        ParallelSumTask leftTask  = new ParallelSumTask(array, start, mid);
        ParallelSumTask rightTask = new ParallelSumTask(array, mid, end);

        leftTask.fork();                        // submit left to pool asynchronously
        long rightResult = rightTask.compute(); // compute right on current thread
        long leftResult  = leftTask.join();     // wait for left result

        return leftResult + rightResult;
    }
}

// ── RecursiveAction — no return value ─────────────────────
public class ParallelSortAction extends RecursiveAction {

    private final int[] array;
    private final int start, end;
    private static final int THRESHOLD = 5_000;

    public ParallelSortAction(int[] array, int start, int end) {
        this.array = array; this.start = start; this.end = end;
    }

    @Override
    protected void compute() {
        if (end - start <= THRESHOLD) {
            Arrays.sort(array, start, end);  // sequential sort
            return;
        }
        int mid = (start + end) / 2;
        ParallelSortAction left  = new ParallelSortAction(array, start, mid);
        ParallelSortAction right = new ParallelSortAction(array, mid, end);

        invokeAll(left, right);              // fork both, wait for both
        merge(array, start, mid, end);       // merge sorted halves
    }

    private void merge(int[] arr, int start, int mid, int end) {
        int[] temp = Arrays.copyOfRange(arr, start, mid);
        int i = 0, j = mid, k = start;
        while (i < temp.length && j < end)
            arr[k++] = temp[i] <= arr[j] ? temp[i++] : arr[j++];
        while (i < temp.length) arr[k++] = temp[i++];
    }
}

// ── Running with ForkJoinPool ──────────────────────────────
public class ForkJoinDemo {

    public static void main(String[] args) throws Exception {
        long[] data = new long[1_000_000];
        Arrays.fill(data, 1L);

        // Common pool (shared, uses all CPUs - 1)
        ForkJoinPool commonPool = ForkJoinPool.commonPool();
        System.out.println("Parallelism: " + commonPool.getParallelism());

        long sum = commonPool.invoke(new ParallelSumTask(data, 0, data.length));
        System.out.println("Sum: " + sum);  // 1_000_000

        // Custom pool with specific parallelism
        ForkJoinPool customPool = new ForkJoinPool(
            4,                                    // parallelism
            ForkJoinPool.defaultForkJoinWorkerThreadFactory,
            null,                                 // UncaughtExceptionHandler
            false                                 // asyncMode
        );

        long customSum = customPool.submit(new ParallelSumTask(data, 0, data.length)).get();
        customPool.shutdown();

        // ── Monitoring ─────────────────────────────────────────
        System.out.println("Pool size:     " + commonPool.getPoolSize());
        System.out.println("Active count:  " + commonPool.getActiveThreadCount());
        System.out.println("Steal count:   " + commonPool.getStealCount());
        System.out.println("Queue sum:     " + commonPool.getQueuedSubmissionCount());
    }
}`
      },
      {
        n: "Parallel Streams — ForkJoinPool under the hood",
        desc: "Parallel streams use ForkJoinPool.commonPool() internally. They are great for CPU-bound tasks on large collections but can hurt performance for I/O-bound work or small datasets.",
        code: `public class ParallelStreamDemo {

    // ── Basic parallel stream ──────────────────────────────────
    public long parallelSum(List<Long> numbers) {
        return numbers.parallelStream()
                      .mapToLong(Long::longValue)
                      .sum();                     // split, compute, merge in FJP
    }

    // ── Parallel with custom pool (avoid hogging common pool) ──
    public long parallelSumCustomPool(List<Long> numbers) throws Exception {
        ForkJoinPool pool = new ForkJoinPool(4);
        try {
            return pool.submit(() ->
                numbers.parallelStream()
                       .mapToLong(Long::longValue)
                       .sum()
            ).get();
        } finally {
            pool.shutdown();
        }
    }

    // ── When NOT to use parallel streams ────────────────────────
    // 1. Small collections (overhead > gain)
    List<Integer> small = List.of(1, 2, 3, 4);
    long result = small.parallelStream().mapToLong(i -> i).sum(); // slower than sequential!

    // 2. Ordered operations with side effects (race conditions)
    // 3. I/O bound work (threads block — no CPU parallelism benefit)

    // ── CPU-bound: good use case ───────────────────────────────
    public List<Double> computeRoots(List<Integer> numbers) {
        return numbers.parallelStream()
                      .map(n -> Math.sqrt(n))      // CPU-intensive
                      .collect(Collectors.toList());
    }

    // ── Parallel collect into concurrent map ───────────────────
    public Map<Boolean, List<Integer>> partitionParallel(List<Integer> nums) {
        return nums.parallelStream()
                   .collect(Collectors.partitioningBy(n -> n % 2 == 0));
    }
}`
      },
    ]
  },
  {
    cat: "Concurrent Collections",
    icon: "◫",
    color: "#EC4899",
    topics: [
      {
        n: "ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue",
        desc: "Thread-safe collections purpose-built for concurrency. ConcurrentHashMap uses segment-level locking. CopyOnWriteArrayList copies the array on every write — fast reads, slow writes. BlockingQueue blocks producers when full and consumers when empty.",
        code: `import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class ConcurrentCollectionsDemo {

    // ── ConcurrentHashMap — thread-safe Map ───────────────────
    ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

    public void concurrentMapDemo() {
        // All operations thread-safe
        map.put("key", 1);
        map.putIfAbsent("key", 2);             // atomic: only if key absent
        map.computeIfAbsent("hits", k -> 0);   // atomic: create if absent
        map.compute("hits", (k, v) -> v + 1);  // atomic compute
        map.merge("hits", 1, Integer::sum);     // atomic merge

        // Bulk operations (Java 8)
        map.forEach(4, (k, v) ->               // parallelism threshold = 4
            System.out.println(k + "=" + v));

        map.search(4, (k, v) -> v > 100 ? k : null);  // parallel search

        long sum = map.reduceValues(4, Long::sum);     // parallel reduce

        // Atomic replace
        map.replace("hits", 5, 6);  // CAS: replace 5 with 6 only if current==5
    }

    // ── CopyOnWriteArrayList — for read-heavy lists ───────────
    CopyOnWriteArrayList<String> listeners = new CopyOnWriteArrayList<>();

    public void cowListDemo() {
        listeners.add("ListenerA");   // creates new copy of array
        listeners.add("ListenerB");

        // Safe to iterate even if another thread adds/removes
        for (String listener : listeners) {
            notify(listener);         // no ConcurrentModificationException
        }
        // Iterator snapshot — won't see new additions during iteration
    }

    // ── LinkedBlockingQueue — bounded producer-consumer ───────
    BlockingQueue<String> queue = new LinkedBlockingQueue<>(100);

    public void blockingQueueDemo() throws InterruptedException {
        // Producer
        queue.put("task1");            // BLOCKS if full
        queue.offer("task2");          // returns false if full (no block)
        queue.offer("task3", 100, TimeUnit.MILLISECONDS); // timeout

        // Consumer
        String task = queue.take();    // BLOCKS if empty
        String poll = queue.poll();    // returns null if empty (no block)
        String poll2 = queue.poll(100, TimeUnit.MILLISECONDS); // timeout

        System.out.println("Queue size: " + queue.size());
        System.out.println("Remaining:  " + queue.remainingCapacity());
    }

    // ── PriorityBlockingQueue — priority-ordered tasks ────────
    PriorityBlockingQueue<Task> priorityQueue = new PriorityBlockingQueue<>();

    // ── ArrayBlockingQueue — bounded, array-backed ───────────
    ArrayBlockingQueue<String> arrayQueue = new ArrayBlockingQueue<>(10, true); // fair

    // ── SynchronousQueue — zero capacity hand-off queue ───────
    SynchronousQueue<String> handOff = new SynchronousQueue<>();
    // put() blocks until another thread takes(); no buffering at all

    // ── ConcurrentLinkedQueue — non-blocking FIFO ─────────────
    ConcurrentLinkedQueue<String> nonBlocking = new ConcurrentLinkedQueue<>();
    // Uses CAS internally; never blocks; poll() returns null if empty

    // ── ConcurrentSkipListMap — sorted concurrent Map ─────────
    ConcurrentSkipListMap<Integer, String> sortedMap = new ConcurrentSkipListMap<>();
    // Thread-safe TreeMap alternative; O(log n) for get/put/remove

    void notify(String s) {}
    static class Task implements Comparable<Task> {
        int priority;
        public int compareTo(Task o) { return Integer.compare(o.priority, this.priority); }
    }
}`
      },
    ]
  },
  {
    cat: "ThreadLocal & InheritableThreadLocal",
    icon: "⊞",
    color: "#8B5CF6",
    topics: [
      {
        n: "ThreadLocal — per-thread data storage",
        desc: "ThreadLocal provides thread-scoped variables — each thread has its own independent copy. Perfect for user context, transaction IDs, SimpleDateFormat instances. ALWAYS remove in a finally block when using with thread pools (threads are reused).",
        code: `public class ThreadLocalDemo {

    // ── Basic ThreadLocal ──────────────────────────────────────
    private static final ThreadLocal<String> currentUser = ThreadLocal.withInitial(() -> "anonymous");

    public static void setCurrentUser(String user) { currentUser.set(user); }
    public static String getCurrentUser()          { return currentUser.get(); }
    public static void clearCurrentUser()          { currentUser.remove(); }  // critical in pools!

    // ── Real-world: Request context propagation ───────────────
    public static final ThreadLocal<RequestContext> requestContext = new ThreadLocal<>();

    public void handleRequest(HttpRequest req) {
        RequestContext ctx = new RequestContext(req.getUserId(), req.getCorrelationId());
        requestContext.set(ctx);
        try {
            processRequest();  // nested calls can access context without passing it
        } finally {
            requestContext.remove();  // MUST remove to prevent memory leak in pools
        }
    }

    public void processRequest() {
        // Deep in the call stack — no need to pass context as parameter
        RequestContext ctx = requestContext.get();
        log.info("Processing for user {} correlation {}", ctx.userId, ctx.correlationId);
    }

    // ── Thread-safe SimpleDateFormat ──────────────────────────
    private static final ThreadLocal<SimpleDateFormat> dateFormat =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
        // SimpleDateFormat is NOT thread-safe; ThreadLocal gives each thread its own instance

    public String formatDate(Date date) {
        return dateFormat.get().format(date);  // thread-safe!
    }

    // ── InheritableThreadLocal — passes to child threads ──────
    private static final InheritableThreadLocal<String> tenantId = new InheritableThreadLocal<>();

    public static void main(String[] args) throws InterruptedException {
        tenantId.set("tenant-ACME");

        Thread child = new Thread(() -> {
            // Child thread inherits parent's value
            System.out.println("Child sees tenant: " + tenantId.get()); // "tenant-ACME"
        });
        child.start();
        child.join();

        // ── WARNING: ThreadLocal memory leak in pools ──────────
        // Thread pool reuses threads → if you don't remove(), next task inherits old value!
        ExecutorService pool = Executors.newFixedThreadPool(2);
        pool.submit(() -> {
            currentUser.set("user-123");
            try {
                doWork();
            } finally {
                currentUser.remove();  // clean up — otherwise next task on this thread sees it!
            }
        });
    }

    static void doWork() { System.out.println("Working as: " + currentUser.get()); }
    static class RequestContext { String userId, correlationId;
        RequestContext(String u, String c) { userId = u; correlationId = c; } }
    interface HttpRequest { String getUserId(); String getCorrelationId(); }
}`
      },
    ]
  },
  {
    cat: "Virtual Threads (Java 21+)",
    icon: "✦",
    color: "#14B8A6",
    topics: [
      {
        n: "Virtual Threads — Project Loom",
        desc: "Virtual threads (Java 21) are lightweight, JVM-managed threads — millions can run concurrently. They are ideal for I/O-bound workloads. They use platform (OS) threads only when actually running (mounted), not while waiting.",
        code: `// Java 21+ — Project Loom virtual threads
public class VirtualThreadDemo {

    // ── Create virtual threads ────────────────────────────────
    public void basicDemo() throws InterruptedException {
        // Method 1: Thread.ofVirtual()
        Thread vt = Thread.ofVirtual()
                          .name("my-virtual-thread")
                          .start(() -> System.out.println("Virtual: " + Thread.currentThread().isVirtual()));

        vt.join();

        // Method 2: factory
        ThreadFactory factory = Thread.ofVirtual().factory();
        Thread vt2 = factory.newThread(() -> System.out.println("From factory"));
        vt2.start();

        // Method 3: Executor (most common for server workloads)
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // Creates a NEW virtual thread per task — scales to millions
            List<Future<String>> futures = new ArrayList<>();
            for (int i = 0; i < 100_000; i++) {
                final int id = i;
                futures.add(executor.submit(() -> {
                    Thread.sleep(1000);   // blocks virtual thread, not platform thread!
                    return "Task " + id;
                }));
            }
            // All 100,000 tasks run "concurrently" using only a handful of OS threads
        }
    }

    // ── Spring Boot 3.2+ — enable virtual threads ─────────────
    // application.properties:
    // spring.threads.virtual.enabled=true
    // That's it — Tomcat & @Async use virtual threads automatically

    // ── Virtual vs Platform thread comparison ─────────────────
    public void comparison() throws Exception {
        int TASKS = 10_000;
        long start;

        // Platform threads — limited by OS, huge memory per thread
        start = System.currentTimeMillis();
        try (ExecutorService platform = Executors.newFixedThreadPool(200)) {
            for (int i = 0; i < TASKS; i++) {
                platform.submit(() -> { Thread.sleep(100); return null; });
            }
        }
        System.out.println("Platform: " + (System.currentTimeMillis() - start) + "ms");

        // Virtual threads — millions possible, tiny memory footprint
        start = System.currentTimeMillis();
        try (ExecutorService virtual = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASKS; i++) {
                virtual.submit(() -> { Thread.sleep(100); return null; });
            }
        }
        System.out.println("Virtual:  " + (System.currentTimeMillis() - start) + "ms");
        // Virtual is ~50x faster for I/O-bound workloads

        // ── Pinning — avoid synchronized with virtual threads ──
        // synchronized blocks unmount; use ReentrantLock instead
        // BAD for virtual threads:
        //   synchronized(this) { Thread.sleep(1000); }  // pins platform thread!
        // GOOD:
        //   lock.lock(); try { Thread.sleep(1000); } finally { lock.unlock(); }
    }
}`
      },
    ]
  },
  {
    cat: "Java Memory Model",
    icon: "⬡",
    color: "#3B82F6",
    topics: [
      {
        n: "happens-before, memory visibility & reordering",
        desc: "The Java Memory Model (JMM) defines when writes by one thread are guaranteed visible to another. 'happens-before' is the formal rule: if A happens-before B, all writes by A are visible to B. Without it, CPUs and JIT can freely reorder instructions. Key happens-before rules: Thread.start(), Thread.join(), synchronized block exit → entry, volatile write → read, CompletableFuture completion.",
        code: `// ── Without happens-before — BROKEN ────────────────────────
class BrokenVisibility {
    int x = 0;
    boolean ready = false;     // NOT volatile!

    void writer() {
        x = 42;                // write x
        ready = true;          // write ready — MAY be reordered BEFORE x=42 by JIT/CPU!
    }

    void reader() {
        while (!ready) {}      // may spin forever (stale cache)
        System.out.println(x); // may print 0 — x write not visible!
    }
}

// ── Fixed with volatile — establishes happens-before ────
class FixedVisibility {
    int x = 0;
    volatile boolean ready = false;

    void writer() {
        x = 42;
        ready = true;   // volatile write — flushes ALL pending writes to main memory
    }

    void reader() {
        while (!ready) {}  // volatile read — sees fresh value
        System.out.println(x); // guaranteed to see 42 — happens-before chain
    }
}

// ── happens-before rules summary ──────────────────────────
// 1. Program order:       within one thread, each action hb next action
// 2. Monitor lock:        unlock(m) hb lock(m) by any thread
// 3. Volatile:            write(v) hb read(v) by any thread
// 4. Thread start:        thread.start() hb any action in that thread
// 5. Thread join:         all actions in T hb thread.join() returning
// 6. Transitivity:        if A hb B and B hb C, then A hb C

// ── Safe publication patterns ─────────────────────────────
class SafePublication {
    // 1. Static initializer — guaranteed by class loader
    static final Map<String,String> CONFIG = Map.of("key","value"); // safe

    // 2. final field — safe after constructor completes
    final int value;
    SafePublication(int v) { this.value = v; }

    // 3. volatile reference
    static volatile SafePublication instance;

    // 4. Synchronized block
    private static SafePublication locked;
    static synchronized SafePublication getLocked() { return locked; }
    static synchronized void setLocked(SafePublication o) { locked = o; }

    // 5. AtomicReference
    static AtomicReference<SafePublication> atomicRef = new AtomicReference<>();
}`
      },
      {
        n: "false sharing & @Contended",
        desc: "False sharing occurs when two threads modify different variables that happen to live on the same CPU cache line (typically 64 bytes). Each write invalidates the other CPU's cache line — massive performance hit. Fix with padding or @Contended (JDK internal, requires JVM flag).",
        code: `// ── False sharing — performance killer ───────────────────
class FalseSharing {
    // counter1 and counter2 likely share a 64-byte cache line!
    volatile long counter1 = 0;   // bytes 0-7
    volatile long counter2 = 0;   // bytes 8-15  ← same cache line as counter1

    // Thread A writes counter1 → invalidates Thread B's cache line containing counter2
    // Thread B writes counter2 → invalidates Thread A's cache line containing counter1
    // Threads constantly fight over the same cache line even though they access DIFFERENT vars
}

// ── Fix 1: Padding — separate variables onto different cache lines ──
class PaddedCounters {
    volatile long counter1 = 0;
    long p1, p2, p3, p4, p5, p6, p7;   // 7 longs = 56 bytes padding

    volatile long counter2 = 0;          // now on a different cache line
    long p8, p9, p10, p11, p12, p13, p14;
}

// ── Fix 2: @Contended (Java 8+ with -XX:-RestrictContended) ──────
class ContendedCounters {
    @jdk.internal.vm.annotation.Contended
    volatile long counter1 = 0;    // JVM adds padding automatically

    @jdk.internal.vm.annotation.Contended
    volatile long counter2 = 0;
}

// ── Fix 3: LongAdder — designed to avoid false sharing ───
class BestApproach {
    LongAdder counter1 = new LongAdder();  // uses per-thread cells internally
    LongAdder counter2 = new LongAdder();  // no cross-thread contention

    void increment1() { counter1.increment(); }
    void increment2() { counter2.increment(); }
    long get1() { return counter1.sum(); }
    long get2() { return counter2.sum(); }
}

// ── Benchmark shows 10-40x speedup after fixing false sharing ─
// JMH benchmark:
// Benchmark                    Mode  Cnt    Score    Error   Units
// FalseSharing.increment       avgt   10  120.456 ±  3.221   ns/op
// PaddedCounters.increment     avgt   10    3.812 ±  0.198   ns/op  ← 30x faster`
      },
    ]
  },
  {
    cat: "Exception Handling in Threads",
    icon: "⚡",
    color: "#F43F5E",
    topics: [
      {
        n: "UncaughtExceptionHandler & thread exception propagation",
        desc: "Unchecked exceptions thrown in a thread's run() kill only that thread silently by default. You must register an UncaughtExceptionHandler to catch and log them. Checked exceptions cannot propagate out of run() — use Callable + Future instead.",
        code: `// ── Default behavior: uncaught exception kills thread silently ──
Thread bad = new Thread(() -> {
    throw new RuntimeException("Oops!");  // silently kills this thread
});
bad.start();
// main thread has NO idea this happened — exception is swallowed!

// ── Fix: UncaughtExceptionHandler ────────────────────────
Thread.UncaughtExceptionHandler handler = (thread, ex) -> {
    System.err.println("Thread " + thread.getName() + " died: " + ex.getMessage());
    // alert monitoring system, restart logic, etc.
};

// Per-thread handler
Thread t = new Thread(() -> { throw new RuntimeException("crash!"); });
t.setUncaughtExceptionHandler(handler);
t.start();

// Global default handler (catches all unhandled thread exceptions)
Thread.setDefaultUncaughtExceptionHandler(handler);

// ── With ExecutorService — exceptions in Runnable are swallowed! ──
ExecutorService exec = Executors.newFixedThreadPool(2);

// BAD — exception is silently swallowed
exec.submit((Runnable) () -> { throw new RuntimeException("lost!"); });

// GOOD — use Callable, exception surfaces via Future.get()
Future<?> future = exec.submit((Callable<Void>) () -> {
    throw new RuntimeException("surfaced!");
});
try {
    future.get();   // throws ExecutionException wrapping the original
} catch (ExecutionException ex) {
    System.err.println("Task failed: " + ex.getCause().getMessage());
} catch (InterruptedException ex) {
    Thread.currentThread().interrupt();
}

// ── Custom ThreadPoolExecutor with afterExecute hook ──────
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2, 4, 60L, TimeUnit.SECONDS, new LinkedBlockingQueue<>()
) {
    @Override
    protected void afterExecute(Runnable r, Throwable t) {
        super.afterExecute(r, t);
        if (t == null && r instanceof Future<?> f) {
            try { f.get(0, TimeUnit.NANOSECONDS); }
            catch (ExecutionException ee)    { t = ee.getCause(); }
            catch (TimeoutException | InterruptedException ignored) {}
        }
        if (t != null) {
            System.err.println("Task threw: " + t);
            // log, alert, restart, etc.
        }
    }
};`
      },
    ]
  },
  {
    cat: "Advanced Sync Utilities",
    icon: "⇆",
    color: "#06B6D4",
    topics: [
      {
        n: "Exchanger — two-thread data handoff",
        desc: "Exchanger allows exactly two threads to exchange data at a synchronization point. Each thread calls exchange() and blocks until the other calls exchange() too. Both get the other's data. Useful for pipeline stages passing buffers.",
        code: `import java.util.concurrent.Exchanger;

public class ExchangerDemo {

    public static void main(String[] args) {
        Exchanger<List<Integer>> exchanger = new Exchanger<>();

        // ── Producer: fills buffer and exchanges for empty one ──
        Thread producer = new Thread(() -> {
            List<Integer> buffer = new ArrayList<>();
            try {
                for (int cycle = 0; cycle < 3; cycle++) {
                    // Fill the buffer
                    for (int i = 0; i < 5; i++) buffer.add(cycle * 10 + i);
                    System.out.println("Producer filled: " + buffer);

                    // Exchange filled buffer for empty one from consumer
                    buffer = exchanger.exchange(buffer);   // BLOCKS until consumer calls exchange
                    System.out.println("Producer got empty buffer back");
                    buffer.clear();
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }, "producer");

        // ── Consumer: drains buffer and exchanges for filled one ──
        Thread consumer = new Thread(() -> {
            List<Integer> buffer = new ArrayList<>();  // starts with empty buffer
            try {
                for (int cycle = 0; cycle < 3; cycle++) {
                    // Exchange empty buffer for producer's filled buffer
                    buffer = exchanger.exchange(buffer);   // BLOCKS until producer calls exchange
                    System.out.println("Consumer processing: " + buffer);
                    Thread.sleep(100);   // simulate processing
                    buffer = new ArrayList<>();  // create new empty buffer
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }, "consumer");

        producer.start();
        consumer.start();
    }
}`
      },
      {
        n: "ThreadGroup, Thread priority & stack size",
        desc: "ThreadGroup organizes threads into a tree. Rarely used in modern code — ExecutorService is preferred — but useful for bulk operations (enumerate, interrupt all). Priority is a hint to the OS scheduler, not a guarantee.",
        code: `// ── ThreadGroup ────────────────────────────────────────────
public class ThreadGroupDemo {

    public static void main(String[] args) throws InterruptedException {

        ThreadGroup workerGroup = new ThreadGroup("workers");

        for (int i = 0; i < 5; i++) {
            final int id = i;
            Thread t = new Thread(workerGroup, () -> {
                try {
                    Thread.sleep(2000);
                    System.out.println("Worker " + id + " done");
                } catch (InterruptedException e) {
                    System.out.println("Worker " + id + " interrupted");
                }
            }, "worker-" + i);
            t.start();
        }

        System.out.println("Active threads in group: " + workerGroup.activeCount());

        // Enumerate all threads in group
        Thread[] threads = new Thread[workerGroup.activeCount()];
        workerGroup.enumerate(threads);
        for (Thread t : threads) {
            if (t != null) System.out.println(t.getName() + " state: " + t.getState());
        }

        Thread.sleep(500);
        workerGroup.interrupt();   // interrupt ALL threads in group
    }
}

// ── Thread Priority ────────────────────────────────────────
Thread highPriority = new Thread(() -> { /* critical work */ });
highPriority.setPriority(Thread.MAX_PRIORITY);  // 10

Thread lowPriority = new Thread(() -> { /* background work */ });
lowPriority.setPriority(Thread.MIN_PRIORITY);   // 1
// Note: actual scheduling depends on OS; priorities are hints only

// ── Custom stack size (for deep recursion) ─────────────────
Thread deepRecursion = new Thread(
    null,                // ThreadGroup
    () -> recursiveMethod(10_000),
    "deep-thread",
    4 * 1024 * 1024     // 4MB stack (default ~512KB on most JVMs)
);
deepRecursion.start();

static void recursiveMethod(int depth) {
    if (depth == 0) return;
    recursiveMethod(depth - 1);  // needs large stack
}`
      },
      {
        n: "Future vs CompletableFuture — comparison",
        desc: "Future (Java 5) is blocking and limited. CompletableFuture (Java 8) supports non-blocking callbacks, chaining, combining, error handling, and timeouts. Always prefer CompletableFuture for new code.",
        code: `// ── Future — old, blocking, limited ──────────────────────
ExecutorService exec = Executors.newFixedThreadPool(4);

Future<String> future = exec.submit(() -> {
    Thread.sleep(1000);
    return "result";
});

// Problems with Future:
// 1. get() BLOCKS — ties up a thread
String result = future.get();           // blocks caller until done
String result2 = future.get(2, TimeUnit.SECONDS); // or throws TimeoutException

// 2. Cannot chain — must manually get() and pass to next
Future<String> step2 = exec.submit(() -> transform(result));

// 3. No built-in error recovery
// 4. No way to combine multiple futures without blocking
// 5. Cannot trigger callback on completion

// ── CompletableFuture — modern, non-blocking ──────────────
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchData(), exec)         // async, non-blocking
    .thenApply(data -> transform(data))            // chain: runs when fetchData completes
    .thenCompose(s -> CompletableFuture            // flatMap: async chain
        .supplyAsync(() -> enrich(s), exec))
    .exceptionally(ex -> "fallback")              // inline error recovery
    .orTimeout(3, TimeUnit.SECONDS);              // built-in timeout (Java 9+)

// Non-blocking callback — caller thread is free
cf.thenAccept(r -> System.out.println("Got: " + r));

// ── Side-by-side comparison ───────────────────────────────
// Feature               Future          CompletableFuture
// ----------------------------------------------------------
// Non-blocking get      ✗ (blocks)      ✓ (callbacks)
// Chaining              ✗               ✓ thenApply/thenCompose
// Error handling        ✗ (catch only)  ✓ exceptionally/handle
// Combine futures       ✗               ✓ thenCombine/allOf/anyOf
// Timeout               ✗               ✓ orTimeout (Java 9+)
// Manual complete       ✗               ✓ complete(value)
// Cancel propagation    Partial         ✓
// Created by caller     ✗               ✓ new CompletableFuture<>()

// ── CompletableFuture as a Promise ───────────────────────
CompletableFuture<String> promise = new CompletableFuture<>();

// Somewhere else, complete it manually
new Thread(() -> {
    String value = fetchFromExternalSystem();
    promise.complete(value);               // or promise.completeExceptionally(ex)
}).start();

// Consumer registers callback — non-blocking
promise.thenAccept(v -> System.out.println("Received: " + v));

static String fetchData() { return "data"; }
static String transform(String s) { return s.toUpperCase(); }
static String enrich(String s) { return s + "+enriched"; }
static String fetchFromExternalSystem() { return "external"; }`
      },
    ]
  },
  {
    cat: "Best Practices & Pitfalls",
    icon: "★",
    color: "#84CC16",
    topics: [
      {
        n: "Thread safety checklist & common pitfalls",
        desc: "A practical guide to writing correct concurrent code. These rules catch 90% of concurrency bugs before they happen.",
        code: `// ── PITFALL 1: Non-atomic compound operations ─────────────
class Counter {
    private int count = 0;

    // BUG: check-then-act is NOT atomic
    void incrementIfZero() {
        if (count == 0) {   // thread A checks: count==0 ✓
            // ← thread B increments here!
            count++;        // thread A now sets count=1 when it was already 1
        }
    }

    // FIX: synchronized or AtomicInteger.compareAndSet
    synchronized void safeIncrementIfZero() {
        if (count == 0) count++;
    }
}

// ── PITFALL 2: Publishing partially constructed objects ────
class UnsafePublication {
    public static UnsafePublication instance;
    private final int value;

    UnsafePublication() {
        instance = this;   // BUG: published before constructor finishes!
        value = computeExpensiveValue();
    }
}

// FIX: don't publish 'this' during construction
// Use factory method or static initializer

// ── PITFALL 3: Holding locks too long ──────────────────────
class HoldsLockTooLong {
    synchronized void badMethod() {
        doHeavyComputation();  // holds lock for entire duration — kills throughput
        doNetworkCall();       // still locked! other threads starve
        updateSharedState();
    }

    void goodMethod() {
        String computed = doHeavyComputation();  // outside lock — no sharing needed
        String fetched  = doNetworkCall();       // outside lock

        synchronized (this) {
            updateSharedState(computed, fetched); // lock only for shared state
        }
    }
}

// ── PITFALL 4: Calling alien methods while holding lock ────
class CallsAlienMethodUnderLock {
    private final List<Listener> listeners = new ArrayList<>();

    synchronized void badNotify(Event e) {
        for (Listener l : listeners) {
            l.onEvent(e);  // BUG: alien method under lock — can deadlock or be slow
        }
    }

    void goodNotify(Event e) {
        List<Listener> snapshot;
        synchronized (this) {
            snapshot = new ArrayList<>(listeners);  // copy under lock — fast
        }
        for (Listener l : snapshot) {
            l.onEvent(e);   // call outside lock — safe
        }
    }
}

// ── CHECKLIST ─────────────────────────────────────────────
// □ Is every shared mutable field either synchronized, volatile, or atomic?
// □ Are compound check-then-act operations atomic?
// □ Are locks always released in finally blocks?
// □ Do you lock in a consistent order to prevent deadlock?
// □ Are ThreadLocals removed after use in thread pools?
// □ Do Runnable tasks handle InterruptedException correctly (re-set flag)?
// □ Are blocking operations (I/O, DB) done outside lock scope?
// □ Is the object safely published before sharing with other threads?
// □ Is the thread pool sized appropriately for the workload type?
//     CPU-bound: Runtime.getRuntime().availableProcessors()
//     I/O-bound: much larger — threads spend most time waiting`
      },
      {
        n: "Sizing thread pools — CPU-bound vs I/O-bound",
        desc: "Wrong thread pool size is one of the most common performance mistakes. Too few → threads starve. Too many → context-switching overhead dominates. Use Little's Law and workload type to size correctly.",
        code: `// ── Thread pool sizing formulas ──────────────────────────

int cpuCores = Runtime.getRuntime().availableProcessors();

// CPU-bound tasks (computation, no blocking I/O)
// Optimal = number of CPU cores (+ 1 for spare)
int cpuBoundPoolSize = cpuCores + 1;
ExecutorService cpuPool = Executors.newFixedThreadPool(cpuBoundPoolSize);

// I/O-bound tasks (network, DB, file I/O)
// Formula: threads = cores * (1 + wait_time / compute_time)
// e.g., if task spends 90% waiting, 10% computing:
// threads = 8 * (1 + 0.9/0.1) = 8 * 10 = 80
double waitRatio = 9.0;   // wait_time / compute_time
int ioBoundPoolSize = (int)(cpuCores * (1 + waitRatio));
ExecutorService ioPool = Executors.newFixedThreadPool(ioBoundPoolSize);

// Mixed workloads — use separate pools!
ExecutorService computePool = Executors.newFixedThreadPool(cpuCores);
ExecutorService ioPool2     = Executors.newFixedThreadPool(50);

// ── Little's Law for sizing ───────────────────────────────
// L = λ × W
// L = avg number of requests in system
// λ = arrival rate (requests/sec)
// W = avg response time (seconds)
//
// Example: 500 req/s, avg response 200ms
// L = 500 * 0.2 = 100 concurrent requests → need ~100 threads

// ── Virtual threads (Java 21) — sidestep the sizing problem ──
// Just use one virtual thread per task — JVM handles scheduling
ExecutorService virtualPool = Executors.newVirtualThreadPerTaskExecutor();
// No need to size! Virtual threads are cheap — millions can exist.
// Best for I/O-bound; CPU-bound still benefits from sizing to core count.

// ── Monitor and tune ──────────────────────────────────────
ThreadPoolExecutor pool = (ThreadPoolExecutor) Executors.newFixedThreadPool(20);

// Metrics to watch:
System.out.println("Queue depth:       " + pool.getQueue().size());      // growing? add threads
System.out.println("Active threads:    " + pool.getActiveCount());        // saturated?
System.out.println("Completed tasks:   " + pool.getCompletedTaskCount()); // throughput
System.out.println("Rejected tasks:    ...");  // track via RejectedExecutionHandler`
      },
    ]
  },
  {
    cat: "Common Patterns",
    icon: "⬡",
    color: "#EF4444",
    topics: [
      {
        n: "Producer-Consumer with BlockingQueue",
        desc: "The canonical multithreading pattern. Producers and consumers are decoupled via a shared BlockingQueue. Blocking semantics handle back-pressure automatically — no manual wait/notify needed.",
        code: `public class ProducerConsumerPattern {

    private final BlockingQueue<Task> queue = new LinkedBlockingQueue<>(50);
    private final AtomicBoolean running = new AtomicBoolean(true);

    class Producer implements Runnable {
        private final String name;
        Producer(String name) { this.name = name; }

        @Override public void run() {
            int seq = 0;
            while (running.get()) {
                try {
                    Task task = new Task(name + "-task-" + seq++);
                    queue.put(task);                    // blocks if queue full
                    System.out.println("[+] Produced: " + task.id);
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt(); break;
                }
            }
        }
    }

    class Consumer implements Runnable {
        private final String name;
        Consumer(String name) { this.name = name; }

        @Override public void run() {
            while (running.get() || !queue.isEmpty()) {
                try {
                    Task task = queue.poll(100, TimeUnit.MILLISECONDS);  // timeout to check running flag
                    if (task != null) {
                        processTask(task);
                        System.out.println("[-] Consumed: " + task.id + " by " + name);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt(); break;
                }
            }
        }
    }

    public void run() throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(5);
        pool.submit(new Producer("P1"));
        pool.submit(new Producer("P2"));
        pool.submit(new Consumer("C1"));
        pool.submit(new Consumer("C2"));
        pool.submit(new Consumer("C3"));

        Thread.sleep(3000);
        running.set(false);
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }

    void processTask(Task t) { try { Thread.sleep(80); } catch (Exception e) {} }
    record Task(String id) {}
}`
      },
      {
        n: "Thread-safe Singleton, Object Pool & Rate Limiter",
        desc: "Common patterns built on multithreading primitives. These appear constantly in production systems.",
        code: `// ── Thread-safe Object Pool ────────────────────────────────
public class ConnectionPool {

    private final BlockingQueue<Connection> pool;

    public ConnectionPool(int size) throws Exception {
        pool = new ArrayBlockingQueue<>(size);
        for (int i = 0; i < size; i++) pool.put(createConnection(i));
    }

    public Connection borrow() throws InterruptedException {
        return pool.take();   // blocks if none available
    }

    public Connection borrow(long timeout, TimeUnit unit) throws InterruptedException {
        Connection c = pool.poll(timeout, unit);
        if (c == null) throw new RuntimeException("Pool timeout");
        return c;
    }

    public void release(Connection c) {
        if (c != null) pool.offer(c);  // return to pool
    }

    // Usage
    public <T> T execute(Function<Connection, T> work) throws InterruptedException {
        Connection c = borrow(2, TimeUnit.SECONDS);
        try {
            return work.apply(c);
        } finally {
            release(c);
        }
    }

    Connection createConnection(int id) { return new Connection(id); }
    record Connection(int id) {}
}

// ── Simple Token Bucket Rate Limiter ──────────────────────
public class RateLimiter {

    private final int maxTokens;
    private int tokens;
    private long lastRefill;
    private final int tokensPerSecond;

    public RateLimiter(int maxTokens, int tokensPerSecond) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.tokensPerSecond = tokensPerSecond;
        this.lastRefill = System.currentTimeMillis();
    }

    public synchronized boolean tryAcquire() {
        refill();
        if (tokens > 0) { tokens--; return true; }
        return false;
    }

    public synchronized void acquire() throws InterruptedException {
        while (!tryAcquire()) wait(50);
    }

    private void refill() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRefill;
        int newTokens = (int)(elapsed * tokensPerSecond / 1000);
        if (newTokens > 0) {
            tokens = Math.min(maxTokens, tokens + newTokens);
            lastRefill = now;
        }
    }
}`
      },
    ]
  },
];

export { SECTIONS };

const COLORS = {
  "#F97316": { pill: "#FFF1E6", border: "#FDBA74" },
  "#A855F7": { pill: "#FAF5FF", border: "#C084FC" },
  "#06B6D4": { pill: "#ECFEFF", border: "#67E8F9" },
  "#10B981": { pill: "#ECFDF5", border: "#6EE7B7" },
  "#F59E0B": { pill: "#FFFBEB", border: "#FCD34D" },
  "#EC4899": { pill: "#FDF2F8", border: "#F9A8D4" },
  "#8B5CF6": { pill: "#F5F3FF", border: "#C4B5FD" },
  "#14B8A6": { pill: "#F0FDFA", border: "#5EEAD4" },
  "#EF4444": { pill: "#FEF2F2", border: "#FCA5A5" },
};

export default function JavaMultithreading() {
  return (
    <RevisionNotesLayout
      pageKey="multithreading"
      title="Java Multithreading & Concurrency"
      subtitle="Concurrency primitives, thread pools, locks, executors, and atomic operations with working Java examples."
      categoryIcon="🧵"
      categoryColor="#8b5cf6"
      sections={SECTIONS}
    />
  );
}