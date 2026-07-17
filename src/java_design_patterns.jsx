import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  {
    cat: "Creational Patterns",
    icon: "✦",
    color: "#F59E0B",
    desc: "Deal with object creation — control how objects are instantiated.",
    topics: [
      {
        n: "Singleton",
        intent: "Ensure only one instance of a class exists throughout the application.",
        theory: "Classified as Creational because it governs *how many* instances of a class exist, not how one is built. It centralizes the single instance and its access point, so any code anywhere in the app reaches the exact same object — the defining trait of a Creational pattern that controls the object-creation lifecycle rather than internal structure or behavior.",
        antipattern: "Ironically Singleton is the pattern most often called out as an anti-pattern in practice: it introduces global mutable state, hides a class's dependencies (any method can silently reach `getInstance()` instead of declaring what it needs), and makes unit testing hard because you can't easily swap in a mock. It isn't wrong by GoF definition, but overusing it for things that aren't truly 'one-of-a-kind' (e.g. using it for a data object) is considered poor design.",
        related: "Related: Multiton (same idea but keyed map of instances instead of one), Monostate (all instances share state via static fields instead of enforcing one instance), Dependency Injection (the usual 'fix' — a container manages the single instance and hands it to whoever declares they need it, keeping the dependency visible).",
        star: true,
        use: "DB connection pool, Logger, Config manager, Thread pool",
        code: `// ── Thread-safe Singleton (Best: Enum) ──────────────────
public enum AppConfig {
    INSTANCE;

    private final Properties props = loadProperties();

    public String get(String key) { return props.getProperty(key); }

    private Properties loadProperties() {
        Properties p = new Properties();
        p.setProperty("env", "production");
        return p;
    }
}
// Usage: AppConfig.INSTANCE.get("env")
// Enum singleton: thread-safe, serialization-safe, reflection-safe

// ── Double-checked locking (when Enum isn't suitable) ────
public class DatabasePool {
    private static volatile DatabasePool instance; // volatile is REQUIRED

    private final List<Connection> pool = new ArrayList<>();

    private DatabasePool() {
        for (int i = 0; i < 10; i++) pool.add(createConnection());
    }

    public static DatabasePool getInstance() {
        if (instance == null) {                    // first check (no lock)
            synchronized (DatabasePool.class) {
                if (instance == null) {            // second check (with lock)
                    instance = new DatabasePool();
                }
            }
        }
        return instance;
    }

    public Connection borrow() { return pool.remove(0); }
    public void release(Connection c) { pool.add(c); }
    private Connection createConnection() { return new Connection(); }
    record Connection() {}
}

// ── Bill Pugh (Initialization-on-demand holder) ───────────
public class Logger {
    private Logger() {}

    private static class Holder {
        static final Logger INSTANCE = new Logger(); // loaded lazily, thread-safe
    }

    public static Logger getInstance() { return Holder.INSTANCE; }

    public void log(String msg) { System.out.println("[LOG] " + msg); }
}`
      },
      {
        n: "Factory Method",
        intent: "Define an interface for creating an object, but let subclasses decide which class to instantiate.",
        theory: "Classified as Creational because its whole job is object creation — but instead of the client calling `new` directly, the decision of *which concrete class* to instantiate is deferred to a subclass via an overridable factory method. The 'Method' in the name reflects that the creation logic lives in a single overridable method, not a whole separate class hierarchy (that's Abstract Factory).",
        antipattern: "Not typically labeled an anti-pattern, but a common misuse is creating a deep, parallel class hierarchy of creators just to avoid a simple `switch`/`if` — adding indirection with no real benefit. If there's no genuine variation in *how* an object is created across subclasses, a Simple Factory (a static method with a switch, shown in the code) is often more pragmatic than the full GoF version.",
        related: "Related: Abstract Factory (families of factory methods), Simple Factory (a non-GoF shortcut using one static method instead of subclassing), Template Method (Factory Method is often described as a specialization of Template Method where the varying step happens to be object creation).",
        star: true,
        use: "Creating different notification types, parsers, DB drivers based on config",
        code: `// ── Product interface ────────────────────────────────────
public interface Notification {
    void send(String recipient, String message);
    String getType();
}

// ── Concrete products ─────────────────────────────────────
public class EmailNotification implements Notification {
    public void send(String to, String msg) {
        System.out.println("📧 Email → " + to + ": " + msg);
    }
    public String getType() { return "EMAIL"; }
}

public class SmsNotification implements Notification {
    public void send(String to, String msg) {
        System.out.println("📱 SMS → " + to + ": " + msg);
    }
    public String getType() { return "SMS"; }
}

public class PushNotification implements Notification {
    public void send(String to, String msg) {
        System.out.println("🔔 Push → " + to + ": " + msg);
    }
    public String getType() { return "PUSH"; }
}

// ── Creator (abstract) with factory method ────────────────
public abstract class NotificationService {
    // Factory method — subclasses override this
    protected abstract Notification createNotification();

    // Template method uses the factory method
    public void notifyUser(String userId, String msg) {
        Notification n = createNotification();
        String contact = resolveContact(userId, n.getType());
        n.send(contact, msg);
        logNotification(userId, n.getType(), msg);
    }

    private String resolveContact(String userId, String type) { return "user@example.com"; }
    private void logNotification(String u, String t, String m) {}
}

// ── Concrete creators ─────────────────────────────────────
public class EmailNotificationService extends NotificationService {
    protected Notification createNotification() { return new EmailNotification(); }
}

public class SmsNotificationService extends NotificationService {
    protected Notification createNotification() { return new SmsNotification(); }
}

// ── Simple Factory (not GoF but very common) ─────────────
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel.toUpperCase()) {
            case "EMAIL" -> new EmailNotification();
            case "SMS"   -> new SmsNotification();
            case "PUSH"  -> new PushNotification();
            default      -> throw new IllegalArgumentException("Unknown channel: " + channel);
        };
    }
}

// Usage
Notification n = NotificationFactory.create("EMAIL");
n.send("alice@example.com", "Welcome!");`
      },
      {
        n: "Abstract Factory",
        intent: "Provide an interface for creating families of related objects without specifying concrete classes.",
        theory: "Still Creational, but one level above Factory Method: instead of one factory method producing one product, an Abstract Factory produces a *family* of related products (e.g. matching Button + TextBox + Dialog for one theme) so the products are guaranteed to be compatible with each other.",
        antipattern: "Can become an anti-pattern when a new product family requires adding a method to every factory interface and every concrete factory — this violates the Open/Closed Principle in the 'family' direction, even though adding a whole new family is easy. Overusing it for only one product family (when a plain Factory Method would do) adds unnecessary layers.",
        related: "Related: Factory Method (Abstract Factory is usually implemented using several Factory Methods internally), Builder (both are creational, but Builder assembles one complex object step-by-step rather than picking between families of simple objects).",
        use: "UI themes (Light/Dark), cross-platform UI widgets, cloud provider abstraction",
        code: `// ── Abstract products ────────────────────────────────────
public interface Button  { void render(); void onClick(); }
public interface TextBox { void render(); String getValue(); }
public interface Dialog  { void show(); }

// ── Abstract factory ──────────────────────────────────────
public interface UIFactory {
    Button  createButton(String label);
    TextBox createTextBox(String placeholder);
    Dialog  createDialog(String title);
}

// ── Light theme family ────────────────────────────────────
public class LightButton implements Button {
    private final String label;
    LightButton(String label) { this.label = label; }
    public void render()   { System.out.println("[ " + label + " ] (Light)"); }
    public void onClick()  { System.out.println("Light button clicked"); }
}

public class LightTextBox implements TextBox {
    private final String placeholder;
    private String value = "";
    LightTextBox(String ph) { this.placeholder = ph; }
    public void render()      { System.out.println("[_" + placeholder + "_] (Light)"); }
    public String getValue()  { return value; }
}

public class LightUIFactory implements UIFactory {
    public Button  createButton(String label)       { return new LightButton(label); }
    public TextBox createTextBox(String placeholder){ return new LightTextBox(placeholder); }
    public Dialog  createDialog(String title)       { return new LightDialog(title); }
}

// ── Dark theme family ─────────────────────────────────────
public class DarkButton implements Button {
    private final String label;
    DarkButton(String label) { this.label = label; }
    public void render()  { System.out.println("▐ " + label + " ▌ (Dark)"); }
    public void onClick() { System.out.println("Dark button clicked"); }
}

public class DarkUIFactory implements UIFactory {
    public Button  createButton(String label)       { return new DarkButton(label); }
    public TextBox createTextBox(String placeholder){ return new DarkTextBox(placeholder); }
    public Dialog  createDialog(String title)       { return new DarkDialog(title); }
}

// ── Client — works with any factory ───────────────────────
public class LoginScreen {
    private final Button  loginBtn;
    private final TextBox emailBox;
    private final TextBox passBox;

    public LoginScreen(UIFactory factory) {
        loginBtn = factory.createButton("Login");
        emailBox = factory.createTextBox("Email");
        passBox  = factory.createTextBox("Password");
    }

    public void render() {
        emailBox.render();
        passBox.render();
        loginBtn.render();
    }
}

// Usage — switch theme by swapping factory
String theme = System.getProperty("ui.theme", "light");
UIFactory factory = theme.equals("dark") ? new DarkUIFactory() : new LightUIFactory();
LoginScreen screen = new LoginScreen(factory);
screen.render();`
      },
      {
        n: "Builder",
        intent: "Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.",
        theory: "Classified as Creational because it controls object construction — but unlike Factory patterns (which pick a class), Builder controls the *construction process itself*, assembling a complex object step-by-step and allowing the exact same steps to yield different final representations.",
        antipattern: "Not an anti-pattern itself, but the 'telescoping constructor' it's meant to replace *is* a well-known anti-pattern (a constructor with many optional parameters, forcing callers to pass nulls/defaults for the ones they don't need). A common Builder misuse is making it mutable and shared across threads without care, or building objects that aren't actually 'complex' — adding ceremony for a 2-field POJO is overkill.",
        related: "Related: Telescoping Constructor anti-pattern (the problem Builder solves), Fluent Interface (the chained `.with...()` calling style Builder commonly uses), Abstract Factory (both are creational, but Builder focuses on the construction sequence, not choosing between product families).",
        star: true,
        use: "HTTP requests, SQL queries, complex domain objects, test data builders",
        code: `// ── Product ───────────────────────────────────────────────
public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final Map<String, String> queryParams;
    private final String body;
    private final int timeoutMs;
    private final boolean followRedirects;

    private HttpRequest(Builder b) {
        this.method          = b.method;
        this.url             = b.url;
        this.headers         = Collections.unmodifiableMap(b.headers);
        this.queryParams     = Collections.unmodifiableMap(b.queryParams);
        this.body            = b.body;
        this.timeoutMs       = b.timeoutMs;
        this.followRedirects = b.followRedirects;
    }

    // ── Inner Builder ─────────────────────────────────────
    public static class Builder {
        // Required
        private final String method;
        private final String url;
        // Optional with defaults
        private Map<String, String> headers       = new HashMap<>();
        private Map<String, String> queryParams   = new HashMap<>();
        private String body             = "";
        private int    timeoutMs        = 5000;
        private boolean followRedirects = true;

        public Builder(String method, String url) {
            if (method == null || url == null) throw new IllegalArgumentException("method/url required");
            this.method = method;
            this.url    = url;
        }

        public Builder header(String key, String value) {
            this.headers.put(key, value); return this;
        }

        public Builder param(String key, String value) {
            this.queryParams.put(key, value); return this;
        }

        public Builder body(String body)                { this.body = body; return this; }
        public Builder timeout(int ms)                  { this.timeoutMs = ms; return this; }
        public Builder followRedirects(boolean follow)  { this.followRedirects = follow; return this; }

        public HttpRequest build() {
            // Validation
            if (body != null && !body.isEmpty() && method.equals("GET"))
                throw new IllegalStateException("GET requests cannot have a body");
            return new HttpRequest(this);
        }
    }

    @Override public String toString() {
        return method + " " + url + " headers=" + headers + " timeout=" + timeoutMs + "ms";
    }
}

// ── Usage ─────────────────────────────────────────────────
HttpRequest request = new HttpRequest.Builder("POST", "https://api.example.com/users")
    .header("Authorization", "Bearer eyJhbGci...")
    .header("Content-Type", "application/json")
    .param("version", "v2")
    .body("{\\"name\\": \\"Alice\\"}")
    .timeout(10_000)
    .followRedirects(false)
    .build();

// ── Test data builder pattern ────────────────────────────
public class UserTestBuilder {
    private Long   id    = 1L;
    private String name  = "Test User";
    private String email = "test@example.com";
    private String role  = "USER";

    public UserTestBuilder withId(Long id)       { this.id = id; return this; }
    public UserTestBuilder withName(String name) { this.name = name; return this; }
    public UserTestBuilder asAdmin()             { this.role = "ADMIN"; return this; }

    public User build() { return new User(id, name, email, role); }
}
// In tests: User admin = new UserTestBuilder().withName("Alice").asAdmin().build();`
      },
      {
        n: "Prototype",
        intent: "Create new objects by copying (cloning) an existing object — the prototype.",
        theory: "Classified as Creational because it's yet another way to obtain new objects — but instead of instantiating via constructor or factory, it clones an existing 'prototype' instance. This is useful when creating an object from scratch is expensive but copying an existing one is cheap.",
        antipattern: "Becomes risky/anti-pattern-ish when clone() is implemented as a shallow copy but the object graph actually needs deep copying — this silently shares mutable nested state between the 'original' and the 'clone', causing subtle bugs. Java's built-in `Cloneable`/`clone()` mechanism itself is widely criticized (Joshua Bloch calls it 'fundamentally broken') because it bypasses constructors and has confusing checked-exception semantics — that's why the code sample favors a manual copy constructor over `Cloneable`.",
        related: "Related: Copy Constructor (the safer alternative to Java's Cloneable), Memento (also stores/restores object state, but for undo history rather than producing an independent new object), Deep vs Shallow Copy (the core pitfall to get right when implementing this pattern).",
        use: "Expensive object creation, configuration templates, game entities",
        code: `// ── Cloneable approach (classic) ─────────────────────────
public class QueryTemplate implements Cloneable {
    private String baseQuery;
    private Map<String, Object> params;
    private List<String> joins;
    private int limit;

    public QueryTemplate(String baseQuery) {
        this.baseQuery = baseQuery;
        this.params = new HashMap<>();
        this.joins  = new ArrayList<>();
        this.limit  = 100;
    }

    // Deep clone
    @Override
    public QueryTemplate clone() {
        try {
            QueryTemplate copy = (QueryTemplate) super.clone();
            copy.params = new HashMap<>(this.params);  // deep copy
            copy.joins  = new ArrayList<>(this.joins);
            return copy;
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }
    }

    public QueryTemplate withParam(String key, Object val) {
        QueryTemplate copy = this.clone();
        copy.params.put(key, val);
        return copy;
    }

    public QueryTemplate withLimit(int limit) {
        QueryTemplate copy = this.clone();
        copy.limit = limit;
        return copy;
    }

    @Override public String toString() {
        return baseQuery + " WHERE " + params + " LIMIT " + limit;
    }
}

// ── Prototype registry ────────────────────────────────────
public class QueryRegistry {
    private final Map<String, QueryTemplate> prototypes = new HashMap<>();

    public void register(String name, QueryTemplate template) {
        prototypes.put(name, template);
    }

    public QueryTemplate get(String name) {
        QueryTemplate proto = prototypes.get(name);
        if (proto == null) throw new IllegalArgumentException("Unknown template: " + name);
        return proto.clone();  // always return a COPY
    }
}

// Usage
QueryRegistry registry = new QueryRegistry();
QueryTemplate baseUserQuery = new QueryTemplate("SELECT * FROM users");
registry.register("user-query", baseUserQuery);

// Each call gets a clone — safe to modify independently
QueryTemplate activeUsers = registry.get("user-query")
    .withParam("status", "ACTIVE")
    .withLimit(50);

QueryTemplate adminUsers = registry.get("user-query")
    .withParam("role", "ADMIN")
    .withLimit(10);

System.out.println(activeUsers);  // SELECT * FROM users WHERE {status=ACTIVE} LIMIT 50
System.out.println(adminUsers);   // SELECT * FROM users WHERE {role=ADMIN}   LIMIT 10`
      },
    ]
  },
  {
    cat: "Structural Patterns",
    icon: "⬡",
    color: "#06B6D4",
    desc: "Deal with object composition — organize classes and objects into larger structures.",
    topics: [
      {
        n: "Adapter",
        intent: "Convert the interface of a class into another interface that clients expect. Lets incompatible interfaces work together.",
        theory: "Classified as Structural because it deals with how classes/objects are composed into larger structures — specifically, it restructures one interface to look like another so two otherwise-incompatible types can work together without either one changing.",
        antipattern: "Not an anti-pattern, but overusing Adapter to paper over a poorly designed interface instead of fixing the interface at the source is a code smell — if you control both sides, redesigning the interface is usually better than permanently adapting around it. Chaining many adapters ('adapter of an adapter') is a sign the abstraction boundary needs rethinking.",
        related: "Related: Facade (also simplifies interaction with something, but Facade defines a *new, simpler* interface to a subsystem, while Adapter conforms to an *existing, expected* interface), Bridge (structurally similar code, but Bridge is designed upfront to let two hierarchies vary independently, whereas Adapter is retrofitted after the fact to reconcile two already-existing incompatible interfaces), Wrapper (informal name Adapter is often called).",
        star: true,
        use: "Wrapping legacy APIs, third-party library integration, data format conversion",
        code: `// ── Target interface (what our code expects) ─────────────
public interface PaymentGateway {
    PaymentResult charge(String customerId, double amount, String currency);
    boolean refund(String transactionId);
}

// ── Adaptee (third-party library — can't change it) ───────
public class StripeClient {
    public StripeCharge createCharge(Map<String, Object> params) {
        System.out.println("Stripe: charging " + params.get("amount") +
                           " " + params.get("currency") + " to " + params.get("customer"));
        return new StripeCharge("ch_" + System.currentTimeMillis(), true);
    }

    public boolean createRefund(String chargeId) {
        System.out.println("Stripe: refunding charge " + chargeId);
        return true;
    }

    public record StripeCharge(String id, boolean paid) {}
}

// ── Adapter — bridges the gap ─────────────────────────────
public class StripeAdapter implements PaymentGateway {
    private final StripeClient stripe;

    public StripeAdapter(StripeClient stripe) {
        this.stripe = stripe;
    }

    @Override
    public PaymentResult charge(String customerId, double amount, String currency) {
        // Translate: PaymentGateway → Stripe API call
        Map<String, Object> params = new HashMap<>();
        params.put("customer", customerId);
        params.put("amount",   (long)(amount * 100));  // Stripe uses cents
        params.put("currency", currency.toLowerCase());

        StripeClient.StripeCharge charge = stripe.createCharge(params);
        return new PaymentResult(charge.id(), charge.paid(), amount);
    }

    @Override
    public boolean refund(String transactionId) {
        return stripe.createRefund(transactionId);
    }
}

// Adapter for a different gateway — same interface
public class PayPalAdapter implements PaymentGateway {
    private final PayPalSDK paypal;

    public PayPalAdapter(PayPalSDK paypal) { this.paypal = paypal; }

    @Override
    public PaymentResult charge(String customerId, double amount, String currency) {
        PayPalSDK.Order order = paypal.createOrder(amount, currency, customerId);
        paypal.captureOrder(order.orderId());
        return new PaymentResult(order.orderId(), true, amount);
    }

    @Override public boolean refund(String transactionId) {
        return paypal.issueRefund(transactionId);
    }
}

// ── Client uses PaymentGateway — doesn't know which provider ──
public class CheckoutService {
    private final PaymentGateway gateway;

    public CheckoutService(PaymentGateway gateway) { this.gateway = gateway; }

    public void checkout(String customerId, double amount) {
        PaymentResult result = gateway.charge(customerId, amount, "USD");
        System.out.println("Payment: " + (result.success() ? "✓" : "✗") + " " + result.transactionId());
    }
}

record PaymentResult(String transactionId, boolean success, double amount) {}`
      },
      {
        n: "Decorator",
        intent: "Attach additional responsibilities to an object dynamically. Wraps the original object and extends its behavior without subclassing.",
        theory: "Classified as Structural because it changes the *composition* around an object — wrapping it in another object that implements the same interface — to layer on new behavior at runtime. It's the structural (composition-based) alternative to subclassing for extending behavior.",
        antipattern: "Can tip into an anti-pattern when decorators are stacked many layers deep — debugging becomes hard because behavior is spread across many thin wrapper classes and the call stack gets deep for simple operations. It's also frequently confused with (and sometimes wrongly used instead of) simple inheritance when inheritance would actually be clearer for a fixed, small set of variations.",
        related: "Related: Proxy (structurally almost identical — both wrap an object behind the same interface — but Proxy controls *access* to the object while Decorator *adds behavior* to it), Chain of Responsibility (also chains objects, but each link decides whether to handle/stop a request rather than every layer always contributing behavior), Composite (Decorator is sometimes viewed as a 'Composite with one child').",
        star: true,
        use: "Adding logging/auth/caching to services, Java I/O streams, HTTP middleware",
        code: `// ── Component interface ───────────────────────────────────
public interface UserRepository {
    User findById(Long id);
    User save(User user);
    void delete(Long id);
}

// ── Concrete component ────────────────────────────────────
public class JpaUserRepository implements UserRepository {
    public User findById(Long id) {
        System.out.println("DB: findById(" + id + ")");
        return new User(id, "Alice");   // simulate DB fetch
    }
    public User save(User user) {
        System.out.println("DB: save(" + user + ")");
        return user;
    }
    public void delete(Long id) { System.out.println("DB: delete(" + id + ")"); }
}

// ── Abstract decorator ────────────────────────────────────
public abstract class UserRepositoryDecorator implements UserRepository {
    protected final UserRepository wrapped;
    public UserRepositoryDecorator(UserRepository wrapped) { this.wrapped = wrapped; }
}

// ── Concrete decorators — can be stacked in any order ─────
public class CachingUserRepository extends UserRepositoryDecorator {
    private final Map<Long, User> cache = new ConcurrentHashMap<>();

    public CachingUserRepository(UserRepository wrapped) { super(wrapped); }

    @Override
    public User findById(Long id) {
        return cache.computeIfAbsent(id, key -> {
            System.out.println("CACHE MISS — fetching from DB");
            return wrapped.findById(key);
        });
    }

    @Override
    public User save(User user) {
        User saved = wrapped.save(user);
        cache.put(saved.id(), saved);   // update cache
        return saved;
    }

    @Override
    public void delete(Long id) {
        wrapped.delete(id);
        cache.remove(id);               // evict from cache
    }
}

public class LoggingUserRepository extends UserRepositoryDecorator {
    public LoggingUserRepository(UserRepository wrapped) { super(wrapped); }

    @Override
    public User findById(Long id) {
        long start = System.currentTimeMillis();
        System.out.println("→ findById(" + id + ")");
        User user = wrapped.findById(id);
        System.out.println("← findById took " + (System.currentTimeMillis() - start) + "ms");
        return user;
    }

    @Override public User save(User user) {
        System.out.println("→ save(" + user + ")");
        return wrapped.save(user);
    }

    @Override public void delete(Long id) {
        System.out.println("→ delete(" + id + ")");
        wrapped.delete(id);
    }
}

// ── Stack decorators ──────────────────────────────────────
// Logging → Caching → DB (inner to outer order)
UserRepository repo = new LoggingUserRepository(
                          new CachingUserRepository(
                              new JpaUserRepository()));

User user = repo.findById(1L);
// Output:
// → findById(1)
// CACHE MISS — fetching from DB
// DB: findById(1)
// ← findById took 3ms
User user2 = repo.findById(1L);
// → findById(1)
// (no CACHE MISS — served from cache)
// ← findById took 0ms`
      },
      {
        n: "Proxy",
        intent: "Provide a surrogate or placeholder for another object to control access to it.",
        theory: "Classified as Structural because it introduces a stand-in object with the same interface as the real subject, sitting structurally between the client and the real object to control access (lazy loading, security checks, remote calls) without the client knowing the difference.",
        antipattern: "Not inherently an anti-pattern, but a Proxy that silently changes behavior the client doesn't expect (e.g. a 'transparent' caching proxy that returns stale data) violates the principle that a proxy should be behaviorally substitutable for the real object — that expectation mismatch is the main pitfall to watch for.",
        related: "Related: Decorator (same wrapping structure, different intent — Decorator adds behavior, Proxy controls access), Facade (Facade simplifies a whole subsystem's interface; Proxy stands in for one specific object with the *same* interface), common variants: Virtual Proxy (lazy loading), Protection Proxy (access control), Remote Proxy (network calls, e.g. Java RMI stubs).",
        star: true,
        use: "Lazy loading, access control, remote objects, logging, virtual proxies (Hibernate lazy entities)",
        code: `// ── Subject interface ────────────────────────────────────
public interface ImageLoader {
    byte[] load(String imagePath);
    long getSizeBytes(String imagePath);
}

// ── Real subject — expensive to create ────────────────────
public class S3ImageLoader implements ImageLoader {
    public S3ImageLoader() {
        System.out.println("S3ImageLoader: connecting to S3...");  // expensive!
    }

    public byte[] load(String path) {
        System.out.println("S3: loading " + path);
        return new byte[1024 * 100];   // 100KB image
    }

    public long getSizeBytes(String path) {
        System.out.println("S3: getting size of " + path);
        return 102400L;
    }
}

// ── Virtual Proxy — lazy initialization ───────────────────
public class LazyImageLoaderProxy implements ImageLoader {
    private S3ImageLoader realLoader;   // null until actually needed

    private S3ImageLoader getRealLoader() {
        if (realLoader == null) {
            realLoader = new S3ImageLoader();  // created only on first use
        }
        return realLoader;
    }

    public byte[] load(String path) {
        return getRealLoader().load(path);  // delegates to real loader
    }

    public long getSizeBytes(String path) {
        return getRealLoader().getSizeBytes(path);
    }
}

// ── Protection Proxy — access control ─────────────────────
public class SecureImageLoaderProxy implements ImageLoader {
    private final ImageLoader realLoader;
    private final Set<String> allowedFolders;
    private final String currentUser;

    public SecureImageLoaderProxy(ImageLoader loader, String user, Set<String> folders) {
        this.realLoader     = loader;
        this.currentUser    = user;
        this.allowedFolders = folders;
    }

    private void checkAccess(String path) {
        boolean allowed = allowedFolders.stream().anyMatch(path::startsWith);
        if (!allowed) throw new SecurityException(
            "User " + currentUser + " cannot access " + path);
    }

    public byte[] load(String path) {
        checkAccess(path);
        return realLoader.load(path);
    }

    public long getSizeBytes(String path) {
        checkAccess(path);
        return realLoader.getSizeBytes(path);
    }
}

// ── Dynamic Proxy (java.lang.reflect.Proxy) ───────────────
ImageLoader dynamicProxy = (ImageLoader) Proxy.newProxyInstance(
    ImageLoader.class.getClassLoader(),
    new Class[]{ ImageLoader.class },
    (proxy, method, args) -> {
        System.out.println("Before: " + method.getName());
        Object result = method.invoke(new S3ImageLoader(), args);
        System.out.println("After:  " + method.getName());
        return result;
    }
);`
      },
      {
        n: "Facade",
        intent: "Provide a simplified interface to a complex subsystem.",
        theory: "Classified as Structural because it's purely about restructuring how clients see a subsystem — layering one simplified interface over many complex classes so the internal structure stays hidden from callers.",
        antipattern: "Becomes an anti-pattern when the facade grows into a 'God Object' — accumulating so much logic and so many responsibilities that it becomes a dumping ground and a single point of coupling for the entire subsystem, defeating the purpose of simplifying access.",
        related: "Related: Adapter (Facade defines a brand-new simplified interface; Adapter conforms to an interface clients already expect), Mediator (both reduce direct coupling between many objects, but Mediator also manages ongoing *communication/coordination* between them, while Facade is usually a one-way simplified entry point).",
        star: true,
        use: "Simplifying library APIs, HomeController in Spring, Service layer hiding multiple repos",
        code: `// ── Complex subsystems ───────────────────────────────────
class InventoryService {
    boolean isAvailable(String productId, int qty) {
        System.out.println("Inventory: checking " + productId + " qty=" + qty);
        return true;
    }
    void reserve(String productId, int qty) {
        System.out.println("Inventory: reserved " + qty + " of " + productId);
    }
}

class PaymentService {
    String charge(String customerId, double amount) {
        System.out.println("Payment: charged $" + amount + " to " + customerId);
        return "txn_" + System.currentTimeMillis();
    }
}

class ShippingService {
    String createShipment(String orderId, String address) {
        System.out.println("Shipping: created shipment for " + orderId + " → " + address);
        return "ship_" + orderId;
    }
}

class EmailService {
    void sendOrderConfirmation(String email, String orderId, String trackingId) {
        System.out.println("Email: sent confirmation to " + email);
    }
}

class LoyaltyService {
    void addPoints(String customerId, int points) {
        System.out.println("Loyalty: added " + points + " pts to " + customerId);
    }
}

// ── Facade — one simple interface ─────────────────────────
public class OrderFacade {
    private final InventoryService inventory = new InventoryService();
    private final PaymentService   payment   = new PaymentService();
    private final ShippingService  shipping  = new ShippingService();
    private final EmailService     email     = new EmailService();
    private final LoyaltyService   loyalty   = new LoyaltyService();

    public OrderResult placeOrder(OrderRequest req) {
        // Client only calls ONE method — facade handles 5 subsystems
        if (!inventory.isAvailable(req.productId(), req.quantity()))
            return OrderResult.failure("Out of stock");

        inventory.reserve(req.productId(), req.quantity());

        String txnId   = payment.charge(req.customerId(), req.totalAmount());
        String orderId = "ORD-" + System.currentTimeMillis();
        String shipId  = shipping.createShipment(orderId, req.shippingAddress());

        email.sendOrderConfirmation(req.email(), orderId, shipId);
        loyalty.addPoints(req.customerId(), (int)(req.totalAmount() * 10));

        return OrderResult.success(orderId, shipId, txnId);
    }
}

// Usage — clean and simple
OrderFacade facade = new OrderFacade();
OrderResult result = facade.placeOrder(new OrderRequest(
    "PROD-123", 2, "CUST-456", 99.99, "123 Main St", "alice@example.com"
));
System.out.println(result);`
      },
      {
        n: "Composite",
        intent: "Compose objects into tree structures to represent part-whole hierarchies. Clients treat individual objects and compositions uniformly.",
        theory: "Classified as Structural because it defines how objects are composed into tree-shaped structures (part-whole hierarchies), and ensures individual leaf objects and composite branches share the same interface so client code can treat both uniformly.",
        antipattern: "A common misuse is forcing Composite onto a fixed two-level hierarchy that will never actually be recursive/tree-shaped — adding the uniform Component interface (with meaningless methods on leaf nodes, e.g. `add()` throwing `UnsupportedOperationException`) adds ceremony without real benefit if there's no genuine part-whole recursion.",
        related: "Related: Decorator (structurally similar recursive wrapping, but Composite models a whole/part tree of many children while Decorator wraps a single component to add behavior), Iterator (frequently paired with Composite to traverse the tree uniformly), Visitor (frequently paired with Composite to apply operations across the whole tree without changing node classes).",
        use: "File system, UI component trees, org charts, expression trees",
        code: `// ── Component interface ───────────────────────────────────
public interface FileSystemItem {
    String getName();
    long getSize();
    void print(String indent);
    void add(FileSystemItem item);    // only meaningful for directories
    void remove(FileSystemItem item);
}

// ── Leaf — no children ────────────────────────────────────
public class File implements FileSystemItem {
    private final String name;
    private final long   sizeBytes;

    public File(String name, long sizeBytes) {
        this.name = name; this.sizeBytes = sizeBytes;
    }

    public String getName()  { return name; }
    public long   getSize()  { return sizeBytes; }

    public void print(String indent) {
        System.out.printf("%s📄 %-30s %,d bytes%n", indent, name, sizeBytes);
    }

    public void add(FileSystemItem i)    { throw new UnsupportedOperationException("File has no children"); }
    public void remove(FileSystemItem i) { throw new UnsupportedOperationException("File has no children"); }
}

// ── Composite — has children ──────────────────────────────
public class Directory implements FileSystemItem {
    private final String name;
    private final List<FileSystemItem> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public String getName() { return name; }

    public long getSize() {
        return children.stream().mapToLong(FileSystemItem::getSize).sum(); // recursive!
    }

    public void print(String indent) {
        System.out.printf("%s📁 %s/  (%,d bytes total)%n", indent, name, getSize());
        children.forEach(child -> child.print(indent + "  "));  // recursive!
    }

    public void add(FileSystemItem item)    { children.add(item); }
    public void remove(FileSystemItem item) { children.remove(item); }
}

// ── Build the tree ────────────────────────────────────────
Directory root = new Directory("project");
  Directory src  = new Directory("src");
    Directory main = new Directory("main");
      main.add(new File("App.java",     2048));
      main.add(new File("Config.java",  1024));
    Directory test = new Directory("test");
      test.add(new File("AppTest.java", 3072));
    src.add(main); src.add(test);
  Directory resources = new Directory("resources");
    resources.add(new File("application.yml", 512));
  root.add(src); root.add(resources);
  root.add(new File("pom.xml", 4096));

root.print(""); // prints entire tree recursively
System.out.println("Total size: " + root.getSize() + " bytes");`
      },
      {
        n: "Bridge",
        intent: "Decouple an abstraction from its implementation so that the two can vary independently.",
        theory: "Classified as Structural because it deliberately splits one inheritance hierarchy into two — an abstraction hierarchy and an implementation hierarchy — connected by composition ('bridged') instead of inheritance, so each side can evolve independently.",
        antipattern: "Often confused with Adapter, and misapplying Bridge where Adapter would suffice (or vice versa) is the most common mistake — the tell is intent: Bridge is designed *up front* to let abstraction and implementation vary independently long-term, whereas Adapter is a retrofit to reconcile two things that already exist and weren't designed together.",
        related: "Related: Adapter (similar structure, different intent/timing — see above), Abstract Factory (Bridge's implementation hierarchy is often supplied via an Abstract Factory), Strategy (structurally similar — composition over inheritance — but Strategy swaps an algorithm at the object level, while Bridge splits an entire class hierarchy in two).",
        use: "Rendering engines, database drivers, UI rendering across platforms",
        code: `// ── Implementation interface ──────────────────────────────
public interface MessageSender {
    void sendText(String to, String message);
    void sendRich(String to, String subject, String htmlContent);
    boolean isAvailable();
}

// ── Concrete implementations ──────────────────────────────
public class SmtpSender implements MessageSender {
    private final String host;
    SmtpSender(String host) { this.host = host; }

    public void sendText(String to, String msg) {
        System.out.println("SMTP[" + host + "]: text → " + to + ": " + msg);
    }
    public void sendRich(String to, String sub, String html) {
        System.out.println("SMTP[" + host + "]: rich → " + to + " subject=" + sub);
    }
    public boolean isAvailable() { return true; }
}

public class SendGridSender implements MessageSender {
    private final String apiKey;
    SendGridSender(String apiKey) { this.apiKey = apiKey; }

    public void sendText(String to, String msg) {
        System.out.println("SendGrid: text → " + to + ": " + msg);
    }
    public void sendRich(String to, String sub, String html) {
        System.out.println("SendGrid: rich → " + to + " subject=" + sub);
    }
    public boolean isAvailable() { return true; }
}

// ── Abstraction hierarchy ─────────────────────────────────
public abstract class Notification {
    protected MessageSender sender;   // bridge to implementation

    public Notification(MessageSender sender) { this.sender = sender; }

    public abstract void send(String to);

    // Can swap implementation at runtime!
    public void setSender(MessageSender sender) { this.sender = sender; }
}

public class WelcomeNotification extends Notification {
    private final String userName;

    public WelcomeNotification(MessageSender sender, String userName) {
        super(sender);
        this.userName = userName;
    }

    public void send(String to) {
        sender.sendRich(to, "Welcome, " + userName + "!",
            "<h1>Welcome " + userName + "!</h1><p>Your account is ready.</p>");
    }
}

public class AlertNotification extends Notification {
    private final String alertText;
    private final String severity;

    public AlertNotification(MessageSender sender, String alertText, String severity) {
        super(sender);
        this.alertText = alertText;
        this.severity  = severity;
    }

    public void send(String to) {
        if (severity.equals("CRITICAL")) {
            sender.sendRich(to, "🚨 CRITICAL ALERT", "<b>" + alertText + "</b>");
        } else {
            sender.sendText(to, "[" + severity + "] " + alertText);
        }
    }
}

// Usage — mix and match abstraction + implementation freely
MessageSender smtp      = new SmtpSender("mail.company.com");
MessageSender sendGrid  = new SendGridSender("SG.xxx");

Notification welcome = new WelcomeNotification(smtp, "Alice");
welcome.send("alice@example.com");

// Swap sender without changing notification logic
welcome.setSender(sendGrid);
welcome.send("alice@example.com");

Notification alert = new AlertNotification(sendGrid, "DB CPU 95%", "CRITICAL");
alert.send("ops@company.com");`
      },
      {
        n: "Flyweight",
        intent: "Use sharing to efficiently support a large number of fine-grained objects. Separate intrinsic (shared) state from extrinsic (unique per object) state.",
        theory: "Classified as Structural because it changes how a large number of objects are structured in memory: intrinsic (shared, reusable) state is factored out into shared flyweight objects, while extrinsic (context-specific) state is passed in externally, reducing the structural memory footprint.",
        antipattern: "Misusing Flyweight where object counts are actually small, or where 'shared' intrinsic state is mutable, defeats the pattern and introduces hard-to-trace bugs (one flyweight instance's shared state changing under objects that thought they had independent state). It also adds real complexity (a factory/cache managing flyweight lookups) that isn't worth it unless memory pressure from *many* similar objects is a proven, measured problem.",
        related: "Related: Object Pool (also reuses objects, but pools instances for reuse over time/reduced allocation cost, while Flyweight shares immutable intrinsic state across many logical objects simultaneously), Singleton (Flyweight factories are often implemented as a Singleton registry of shared instances).",
        use: "Character rendering in text editors, particle systems, icons in UI, game entities",
        code: `// ── Flyweight — intrinsic (shared) state ──────────────────
public class CharacterGlyph {
    // Intrinsic: shared across all instances of this character
    private final char   character;
    private final String fontFamily;
    private final int    fontSize;

    public CharacterGlyph(char ch, String font, int size) {
        this.character  = ch;
        this.fontFamily = font;
        this.fontSize   = size;
        System.out.println("Creating glyph for '" + ch + "' " + font + " " + size);
    }

    // Extrinsic state (x, y, color) passed in at render time — not stored here
    public void render(int x, int y, String color) {
        System.out.printf("Render '%c' at (%d,%d) color=%s font=%s size=%d%n",
            character, x, y, color, fontFamily, fontSize);
    }
}

// ── Flyweight factory — pool of shared instances ───────────
public class GlyphFactory {
    private static final Map<String, CharacterGlyph> pool = new HashMap<>();

    public static CharacterGlyph getGlyph(char ch, String font, int size) {
        String key = ch + "-" + font + "-" + size;
        return pool.computeIfAbsent(key, k -> new CharacterGlyph(ch, font, size));
    }

    public static int poolSize() { return pool.size(); }
}

// ── Context — stores extrinsic state ──────────────────────
public class TextCharacter {
    private final CharacterGlyph glyph;  // shared flyweight
    private final int    x, y;           // extrinsic — unique per character
    private final String color;          // extrinsic

    public TextCharacter(char ch, String font, int size, int x, int y, String color) {
        this.glyph = GlyphFactory.getGlyph(ch, font, size);   // get or create shared
        this.x = x; this.y = y; this.color = color;
    }

    public void render() { glyph.render(x, y, color); }
}

// ── Usage ─────────────────────────────────────────────────
String text = "Hello World Hello";
List<TextCharacter> chars = new ArrayList<>();
int x = 0;
for (char c : text.toCharArray()) {
    chars.add(new TextCharacter(c, "Arial", 12, x, 0, "black"));
    x += 8;
}

System.out.println("Characters rendered: " + chars.size());        // 18
System.out.println("Glyph objects created: " + GlyphFactory.poolSize()); // ~7 (unique chars)
// Without flyweight: 18 glyph objects
// With flyweight: 7 shared glyph objects — 61% memory saving (scales to millions)`
      },
    ]
  },
  {
    cat: "Behavioral Patterns",
    icon: "↔",
    color: "#A855F7",
    desc: "Deal with algorithms and communication between objects.",
    topics: [
      {
        n: "Strategy",
        intent: "Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from the clients that use it.",
        theory: "Classified as Behavioral because it governs how an object's *behavior/algorithm* varies at runtime — a family of interchangeable algorithms is encapsulated behind a common interface, and the context object delegates to whichever strategy is plugged in.",
        antipattern: "Not an anti-pattern, but a very 'thin' Strategy (an interface with one trivial implementation, or strategies that never actually change at runtime) is over-engineering — if there's truly only one algorithm and no plan to add more, a plain method is simpler and clearer.",
        related: "Related: State (near-identical structure — an interface implemented by interchangeable classes injected into a context — but State transitions are driven by the object itself based on internal conditions, while Strategy is chosen explicitly by the client/caller), Template Method (Template Method varies steps via inheritance/overriding; Strategy varies the whole algorithm via composition/injection — 'favor composition over inheritance' is the usual reason to prefer Strategy).",
        star: true,
        use: "Sorting strategies, payment processing, compression algorithms, routing",
        code: `// ── Strategy interface ───────────────────────────────────
@FunctionalInterface
public interface SortStrategy<T extends Comparable<T>> {
    void sort(List<T> data);
}

// ── Concrete strategies ───────────────────────────────────
public class BubbleSortStrategy<T extends Comparable<T>> implements SortStrategy<T> {
    public void sort(List<T> data) {
        int n = data.size();
        for (int i = 0; i < n - 1; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (data.get(j).compareTo(data.get(j + 1)) > 0) {
                    T tmp = data.get(j);
                    data.set(j, data.get(j + 1));
                    data.set(j + 1, tmp);
                }
        System.out.println("Bubble sorted: " + data);
    }
}

public class QuickSortStrategy<T extends Comparable<T>> implements SortStrategy<T> {
    public void sort(List<T> data) {
        Collections.sort(data);   // simplified for example
        System.out.println("Quick sorted:  " + data);
    }
}

// ── Context ───────────────────────────────────────────────
public class DataProcessor<T extends Comparable<T>> {
    private SortStrategy<T> strategy;

    public DataProcessor(SortStrategy<T> strategy) {
        this.strategy = strategy;
    }

    // Swap strategy at runtime — open/closed principle
    public void setStrategy(SortStrategy<T> strategy) {
        this.strategy = strategy;
    }

    public void process(List<T> data) {
        strategy.sort(data);
    }
}

// ── Real-world: payment strategy ─────────────────────────
public interface DiscountStrategy {
    double apply(double originalPrice, Customer customer);
}

public class NoDiscount       implements DiscountStrategy {
    public double apply(double price, Customer c) { return price; }
}
public class MemberDiscount   implements DiscountStrategy {
    public double apply(double price, Customer c) { return price * 0.90; }  // 10% off
}
public class PremiumDiscount  implements DiscountStrategy {
    public double apply(double price, Customer c) { return price * 0.75; }  // 25% off
}
public class SeasonalDiscount implements DiscountStrategy {
    public double apply(double price, Customer c) { return price - 5.0; }   // flat $5 off
}

// Since DiscountStrategy is @FunctionalInterface, lambdas work:
DiscountStrategy vipDiscount = (price, customer) -> price * 0.50;

public class PricingEngine {
    private DiscountStrategy strategy = new NoDiscount();

    public void setStrategy(DiscountStrategy s) { this.strategy = s; }

    public double calculatePrice(double base, Customer customer) {
        return strategy.apply(base, customer);
    }
}`
      },
      {
        n: "Observer",
        intent: "Define a one-to-many dependency so that when one object changes state, all its dependents are notified automatically.",
        theory: "Classified as Behavioral because it defines a communication protocol between objects: a one-to-many dependency where 'observers' are notified automatically whenever the 'subject' they watch changes state — the essence of behavioral patterns is coordinating interaction, not creation or structure.",
        antipattern: "The main real-world pitfall (sometimes called the 'observer leak' anti-pattern) is forgetting to unsubscribe/detach observers, which keeps them reachable and prevents garbage collection — a classic memory-leak source in long-lived Java apps and Android/Swing UI code. Cascading/looping notifications between observers that also act as subjects for each other is another common bug.",
        related: "Related: Publish-Subscribe (a more decoupled variant, usually via a message broker/event bus, where subject and observers don't even know about each other directly, unlike classic Observer where the subject holds direct references), Mediator (Mediator centralizes and controls interactions; Observer is a broadcast with no central coordinator), MVC (the View 'observes' the Model in most implementations).",
        star: true,
        use: "Event systems, MVC (View observes Model), reactive streams, Spring ApplicationEvent",
        code: `// ── Observer interface ───────────────────────────────────
@FunctionalInterface
public interface EventListener<T> {
    void onEvent(T event);
}

// ── Subject (Observable) ─────────────────────────────────
public class EventBus<T> {
    private final Map<String, List<EventListener<T>>> listeners = new ConcurrentHashMap<>();

    public void subscribe(String eventType, EventListener<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>()).add(listener);
        System.out.println("Subscribed to " + eventType);
    }

    public void unsubscribe(String eventType, EventListener<T> listener) {
        listeners.getOrDefault(eventType, List.of()).remove(listener);
    }

    public void publish(String eventType, T event) {
        List<EventListener<T>> subs = listeners.getOrDefault(eventType, List.of());
        System.out.println("Publishing " + eventType + " to " + subs.size() + " listeners");
        subs.forEach(l -> l.onEvent(event));  // notify all
    }
}

// ── Domain events ─────────────────────────────────────────
public record OrderPlacedEvent(String orderId, String customerId, double amount) {}
public record OrderShippedEvent(String orderId, String trackingId) {}

// ── Concrete observers ────────────────────────────────────
public class EmailNotifier {
    public void onOrderPlaced(OrderPlacedEvent e) {
        System.out.println("📧 Email: Order " + e.orderId() + " placed, sending confirmation");
    }
}

public class InventoryUpdater {
    public void onOrderPlaced(OrderPlacedEvent e) {
        System.out.println("📦 Inventory: Reserving items for order " + e.orderId());
    }
}

public class AnalyticsService {
    public void trackOrder(OrderPlacedEvent e) {
        System.out.println("📊 Analytics: Tracked $" + e.amount() + " sale");
    }
}

// ── Usage ─────────────────────────────────────────────────
EventBus<OrderPlacedEvent> bus = new EventBus<>();

EmailNotifier    emailer   = new EmailNotifier();
InventoryUpdater inventory = new InventoryUpdater();
AnalyticsService analytics = new AnalyticsService();

// Subscribe — lambdas since EventListener is @FunctionalInterface
bus.subscribe("order.placed", emailer::onOrderPlaced);
bus.subscribe("order.placed", inventory::onOrderPlaced);
bus.subscribe("order.placed", analytics::trackOrder);

// Publish — all 3 listeners notified
bus.publish("order.placed", new OrderPlacedEvent("ORD-001", "CUST-123", 99.99));

// Spring equivalent:
// @EventListener public void handle(OrderPlacedEvent e) { ... }
// applicationEventPublisher.publishEvent(new OrderPlacedEvent(...));`
      },
      {
        n: "Command",
        intent: "Encapsulate a request as an object, allowing you to parameterize clients with different requests, queue them, log them, and support undo.",
        theory: "Classified as Behavioral because it changes how a request/action *flows* through the system: encapsulating a request as a standalone object lets you parameterize, queue, log, or undo it, rather than executing it immediately and directly.",
        antipattern: "Not typically an anti-pattern, but building a Command class for every trivial action in a system where undo/queuing/logging is never actually needed is unnecessary indirection — it's easy to over-apply this pattern 'because it's a known pattern' rather than because the use case calls for deferred/undoable/queueable execution.",
        related: "Related: Strategy (structurally similar — an interface with an execute-like method — but Strategy represents interchangeable *algorithms*, while Command represents a *request/action* to be invoked later, undone, or logged), Memento (often paired with Command to implement undo — Command knows *what* to undo, Memento stores the *state* to undo to).",
        star: true,
        use: "Undo/redo, transaction rollback, task queues, macro recording",
        code: `// ── Command interface ─────────────────────────────────────
public interface Command {
    void execute();
    void undo();
}

// ── Receiver ─────────────────────────────────────────────
public class TextEditor {
    private StringBuilder text = new StringBuilder();

    public void insertText(int pos, String chars) {
        text.insert(pos, chars);
        System.out.println("Text: '" + text + "'");
    }

    public void deleteText(int pos, int length) {
        text.delete(pos, pos + length);
        System.out.println("Text: '" + text + "'");
    }

    public String getText() { return text.toString(); }
}

// ── Concrete commands ─────────────────────────────────────
public class InsertCommand implements Command {
    private final TextEditor editor;
    private final int        position;
    private final String     text;

    public InsertCommand(TextEditor editor, int pos, String text) {
        this.editor = editor; this.position = pos; this.text = text;
    }

    public void execute() { editor.insertText(position, text); }
    public void undo()    { editor.deleteText(position, text.length()); }  // reverse!
}

public class DeleteCommand implements Command {
    private final TextEditor editor;
    private final int        position;
    private final int        length;
    private String deletedText;           // saved for undo

    public DeleteCommand(TextEditor editor, int pos, int len) {
        this.editor = editor; this.position = pos; this.length = len;
    }

    public void execute() {
        deletedText = editor.getText().substring(position, position + length);
        editor.deleteText(position, length);
    }

    public void undo() { editor.insertText(position, deletedText); }  // restore!
}

// ── Invoker — command history, undo/redo ─────────────────
public class CommandHistory {
    private final Deque<Command> history = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void execute(Command cmd) {
        cmd.execute();
        history.push(cmd);
        redoStack.clear();   // redo stack invalidated after new command
    }

    public void undo() {
        if (history.isEmpty()) { System.out.println("Nothing to undo"); return; }
        Command cmd = history.pop();
        cmd.undo();
        redoStack.push(cmd);
    }

    public void redo() {
        if (redoStack.isEmpty()) { System.out.println("Nothing to redo"); return; }
        Command cmd = redoStack.pop();
        cmd.execute();
        history.push(cmd);
    }
}

// Usage
TextEditor    editor  = new TextEditor();
CommandHistory history = new CommandHistory();

history.execute(new InsertCommand(editor, 0, "Hello"));   // Text: 'Hello'
history.execute(new InsertCommand(editor, 5, " World"));  // Text: 'Hello World'
history.execute(new DeleteCommand(editor, 0, 5));          // Text: ' World'
history.undo();    // Text: 'Hello World'
history.undo();    // Text: 'Hello'
history.redo();    // Text: 'Hello World'`
      },
      {
        n: "Chain of Responsibility",
        intent: "Pass a request along a chain of handlers. Each handler decides whether to handle it or pass it to the next.",
        theory: "Classified as Behavioral because it defines how a request travels through a chain of potential handlers, with each handler independently deciding to process it or forward it — the behavior of 'who handles what' is decoupled from the sender.",
        antipattern: "Can turn into an anti-pattern if the chain becomes so long or dynamically reconfigured that it's unclear which handler will actually process a given request, or if a request silently falls through the entire chain unhandled with no visibility into why — debuggability suffers as chain length grows.",
        related: "Related: Decorator (structurally similar linked wrapping, but every Decorator layer contributes; in Chain of Responsibility only one handler typically 'wins'), Composite (a chain can be seen as a degenerate linear tree), Middleware pattern in web frameworks (a very common real-world instance of Chain of Responsibility, e.g. servlet filters).",
        use: "HTTP middleware/filters, logging levels, request validation pipeline, exception handling",
        code: `// ── Handler interface ────────────────────────────────────
public abstract class RequestHandler {
    protected RequestHandler next;

    public RequestHandler setNext(RequestHandler next) {
        this.next = next;
        return next;   // returns next for fluent chaining
    }

    public abstract Response handle(Request request);

    protected Response passToNext(Request request) {
        if (next != null) return next.handle(request);
        return Response.error(404, "No handler could process the request");
    }
}

// ── Concrete handlers ─────────────────────────────────────
public class AuthenticationHandler extends RequestHandler {
    @Override
    public Response handle(Request request) {
        System.out.println("AUTH: checking authentication...");
        if (request.getHeader("Authorization") == null) {
            return Response.error(401, "Missing Authorization header");
        }
        if (!validateToken(request.getHeader("Authorization"))) {
            return Response.error(403, "Invalid token");
        }
        System.out.println("AUTH: ✓ authenticated");
        return passToNext(request);
    }
    private boolean validateToken(String token) { return token.startsWith("Bearer "); }
}

public class RateLimitHandler extends RequestHandler {
    private final Map<String, Integer> counts = new ConcurrentHashMap<>();
    private final int maxPerMinute;

    public RateLimitHandler(int maxPerMinute) { this.maxPerMinute = maxPerMinute; }

    @Override
    public Response handle(Request request) {
        String ip = request.getClientIp();
        int count = counts.merge(ip, 1, Integer::sum);
        System.out.println("RATE LIMIT: " + ip + " → " + count + "/" + maxPerMinute);

        if (count > maxPerMinute)
            return Response.error(429, "Rate limit exceeded");

        return passToNext(request);
    }
}

public class ValidationHandler extends RequestHandler {
    @Override
    public Response handle(Request request) {
        System.out.println("VALIDATION: checking request body...");
        if (request.getBody() == null || request.getBody().isEmpty())
            return Response.error(400, "Request body is required");
        return passToNext(request);
    }
}

public class BusinessLogicHandler extends RequestHandler {
    @Override
    public Response handle(Request request) {
        System.out.println("BUSINESS: processing request...");
        return Response.ok("Processed: " + request.getBody());
    }
}

// ── Build chain ───────────────────────────────────────────
RequestHandler auth       = new AuthenticationHandler();
RequestHandler rateLimit  = new RateLimitHandler(100);
RequestHandler validation = new ValidationHandler();
RequestHandler business   = new BusinessLogicHandler();

// auth → rateLimit → validation → business
auth.setNext(rateLimit).setNext(validation).setNext(business);

// Only the first handler is called; chain handles the rest
Response response = auth.handle(new Request("Bearer token123", "127.0.0.1", "{\\"data\\": 42}"));
System.out.println(response);`
      },
      {
        n: "Template Method",
        intent: "Define the skeleton of an algorithm in a base class, deferring some steps to subclasses. Subclasses can override steps without changing the algorithm's structure.",
        theory: "Classified as Behavioral because it defines the invariant sequence of steps of an algorithm in a base class, while individual steps' *behavior* is deferred to subclasses via overriding — governing how base and derived classes collaborate.",
        antipattern: "The main criticism is that it relies on inheritance to vary behavior, which is more rigid than composition — subclasses are locked into overriding specific hook methods of one base class, and it becomes harder to combine behaviors from multiple sources (Java's single inheritance limits flexibility here, unlike Strategy where multiple strategy objects can be composed freely).",
        related: "Related: Strategy (the composition-based alternative — 'favor composition over inheritance' is exactly the trade-off between these two), Factory Method (often described as a special case of Template Method where the varying hook step is object creation).",
        use: "Data processing pipelines, report generation, game turn sequences",
        code: `// ── Abstract class with template method ───────────────────
public abstract class DataMigration {

    // TEMPLATE METHOD — defines the algorithm skeleton
    public final void migrate() {           // final prevents overriding the skeleton
        System.out.println("=== Starting migration ===");
        connect();
        List<Record> data = extractData();
        List<Record> transformed = transformData(data);
        validate(transformed);
        loadData(transformed);
        if (shouldSendReport()) sendReport();
        disconnect();
        System.out.println("=== Migration complete ===");
    }

    // ── Mandatory hooks — subclasses MUST implement ────────
    protected abstract void connect();
    protected abstract List<Record> extractData();
    protected abstract void loadData(List<Record> data);
    protected abstract void disconnect();

    // ── Optional hooks — subclasses MAY override ───────────
    protected List<Record> transformData(List<Record> data) {
        System.out.println("Default transform: no-op");
        return data;                  // default: pass through
    }

    protected void validate(List<Record> data) {
        System.out.println("Default validation: " + data.size() + " records");
    }

    protected boolean shouldSendReport() { return true; }   // hook method

    protected void sendReport() {
        System.out.println("Report: migration completed successfully");
    }
}

// ── Concrete migration: CSV → PostgreSQL ─────────────────
public class CsvToPostgresMigration extends DataMigration {
    private Connection dbConn;

    @Override
    protected void connect() {
        System.out.println("Connecting to CSV source and PostgreSQL target...");
        dbConn = DriverManager.getConnection("jdbc:postgresql://localhost/db");
    }

    @Override
    protected List<Record> extractData() {
        System.out.println("Reading CSV file...");
        return parseCsv("data.csv");
    }

    @Override
    protected List<Record> transformData(List<Record> data) {
        System.out.println("Normalizing dates and encoding...");
        return data.stream()
            .map(r -> r.withNormalizedDates())
            .collect(Collectors.toList());
    }

    @Override
    protected void loadData(List<Record> data) {
        System.out.println("Bulk inserting " + data.size() + " rows into PostgreSQL...");
        bulkInsert(dbConn, data);
    }

    @Override
    protected void disconnect() {
        dbConn.close();
        System.out.println("Connections closed");
    }

    @Override
    protected boolean shouldSendReport() { return data.size() > 0; }
}

// Usage
DataMigration migration = new CsvToPostgresMigration();
migration.migrate();`
      },
      {
        n: "Iterator",
        intent: "Provide a way to access elements of a collection sequentially without exposing its underlying representation.",
        theory: "Classified as Behavioral because it standardizes *how* a collection's elements are traversed, decoupling the traversal behavior from the collection's internal structure — the client always interacts through the same next()/hasNext() protocol regardless of the underlying data structure.",
        antipattern: "Rarely an anti-pattern on its own since it's built into Java's `Iterable`/`Iterator` interfaces, but a fail-fast iterator that isn't handled correctly (mutating a collection while iterating without using `Iterator.remove()`) throws `ConcurrentModificationException` — a very common real-world bug caused by not respecting this pattern's contract.",
        related: "Related: Composite (Iterator is frequently used to traverse Composite trees uniformly), Visitor (an alternative way to process every element of a structure — Iterator pulls elements to the client one at a time, Visitor pushes an operation into the structure).",
        use: "Custom data structures, lazy sequences, range iteration, tree traversal",
        code: `// ── Custom Iterator for a paginated data source ──────────
public class PagedApiIterator<T> implements Iterator<T> {
    private final ApiClient<T> apiClient;
    private final int    pageSize;
    private int          currentPage = 0;
    private Queue<T>     buffer      = new LinkedList<>();
    private boolean      exhausted   = false;

    public PagedApiIterator(ApiClient<T> client, int pageSize) {
        this.apiClient = client;
        this.pageSize  = pageSize;
    }

    @Override
    public boolean hasNext() {
        if (!buffer.isEmpty()) return true;
        if (exhausted)         return false;
        loadNextPage();
        return !buffer.isEmpty();
    }

    @Override
    public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        return buffer.poll();
    }

    private void loadNextPage() {
        List<T> page = apiClient.getPage(currentPage++, pageSize);
        if (page.isEmpty() || page.size() < pageSize) exhausted = true;
        buffer.addAll(page);
        System.out.println("Loaded page " + (currentPage - 1) + ": " + page.size() + " items");
    }
}

// ── Iterable wrapper — makes it usable in for-each ────────
public class PagedApiCollection<T> implements Iterable<T> {
    private final ApiClient<T> apiClient;
    private final int pageSize;

    public PagedApiCollection(ApiClient<T> client, int pageSize) {
        this.apiClient = client;
        this.pageSize  = pageSize;
    }

    @Override
    public Iterator<T> iterator() {
        return new PagedApiIterator<>(apiClient, pageSize);
    }
}

// ── Java built-in Iterator implementation ─────────────────
public class NumberRange implements Iterable<Integer> {
    private final int start, end, step;

    public NumberRange(int start, int end, int step) {
        this.start = start; this.end = end; this.step = step;
    }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int current = start;

            @Override public boolean hasNext() { return current < end; }

            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                int value = current;
                current += step;
                return value;
            }
        };
    }
}

// Usage
for (int n : new NumberRange(0, 20, 3)) {
    System.out.print(n + " ");  // 0 3 6 9 12 15 18
}

PagedApiCollection<User> users = new PagedApiCollection<>(userApi, 50);
for (User user : users) {  // fetches pages lazily
    processUser(user);
}`
      },
      {
        n: "State",
        intent: "Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.",
        theory: "Classified as Behavioral because it lets an object change its *behavior* when its internal state changes, effectively swapping in a different state-object's logic at runtime — closely related to Strategy, but the switch is driven by the object's own state transitions rather than the client's choice.",
        antipattern: "Overusing State for what's really just a couple of boolean flags/if-else branches adds unnecessary class-per-state overhead; it pays off mainly when there are several states with meaningfully different behavior and transitions, not for a simple on/off toggle.",
        related: "Related: Strategy (identical structure, different intent/trigger for switching — see Strategy's related-concepts note), State Machine / Finite State Machine (State pattern is essentially an object-oriented implementation of an FSM's transition table).",
        use: "Order lifecycle, connection states, vending machine, traffic lights, workflow engines",
        code: `// ── State interface ───────────────────────────────────────
public interface OrderState {
    void confirm(OrderContext ctx);
    void ship(OrderContext ctx);
    void deliver(OrderContext ctx);
    void cancel(OrderContext ctx);
    String getStatus();
}

// ── Context ───────────────────────────────────────────────
public class OrderContext {
    private OrderState state;
    private final String orderId;

    public OrderContext(String orderId) {
        this.orderId = orderId;
        this.state   = new PendingState();   // initial state
    }

    public void setState(OrderState state) { this.state = state; }

    // Delegate all actions to current state
    public void confirm()  { state.confirm(this); }
    public void ship()     { state.ship(this); }
    public void deliver()  { state.deliver(this); }
    public void cancel()   { state.cancel(this); }

    public String getStatus() { return state.getStatus(); }
    public String getOrderId() { return orderId; }
}

// ── Concrete states ───────────────────────────────────────
public class PendingState implements OrderState {
    public void confirm(OrderContext ctx) {
        System.out.println("Order confirmed, awaiting payment");
        ctx.setState(new ConfirmedState());
    }
    public void ship(OrderContext ctx)    { System.out.println("Cannot ship — not confirmed yet"); }
    public void deliver(OrderContext ctx) { System.out.println("Cannot deliver — not shipped yet"); }
    public void cancel(OrderContext ctx)  {
        System.out.println("Order cancelled from pending");
        ctx.setState(new CancelledState());
    }
    public String getStatus() { return "PENDING"; }
}

public class ConfirmedState implements OrderState {
    public void confirm(OrderContext ctx) { System.out.println("Already confirmed"); }
    public void ship(OrderContext ctx) {
        System.out.println("Order shipped!");
        ctx.setState(new ShippedState());
    }
    public void deliver(OrderContext ctx) { System.out.println("Cannot deliver — not shipped"); }
    public void cancel(OrderContext ctx)  {
        System.out.println("Order cancelled after confirmation, refund issued");
        ctx.setState(new CancelledState());
    }
    public String getStatus() { return "CONFIRMED"; }
}

public class ShippedState implements OrderState {
    public void confirm(OrderContext ctx) { System.out.println("Already confirmed"); }
    public void ship(OrderContext ctx)    { System.out.println("Already shipped"); }
    public void deliver(OrderContext ctx) {
        System.out.println("Order delivered!");
        ctx.setState(new DeliveredState());
    }
    public void cancel(OrderContext ctx)  { System.out.println("Cannot cancel — already shipped"); }
    public String getStatus() { return "SHIPPED"; }
}

public class DeliveredState implements OrderState {
    public void confirm(OrderContext ctx) { System.out.println("Illegal — already delivered"); }
    public void ship(OrderContext ctx)    { System.out.println("Illegal — already delivered"); }
    public void deliver(OrderContext ctx) { System.out.println("Already delivered"); }
    public void cancel(OrderContext ctx)  { System.out.println("Cannot cancel — already delivered"); }
    public String getStatus() { return "DELIVERED"; }
}

// Usage
OrderContext order = new OrderContext("ORD-001");
System.out.println(order.getStatus());  // PENDING
order.ship();                           // Cannot ship — not confirmed yet
order.confirm();                        // Order confirmed
order.ship();                           // Order shipped!
order.deliver();                        // Order delivered!
order.cancel();                         // Cannot cancel — already delivered`
      },
      {
        n: "Mediator",
        intent: "Define an object that encapsulates how a set of objects interact. Promotes loose coupling by keeping objects from referring to each other explicitly.",
        theory: "Classified as Behavioral because it centralizes and defines *how a set of objects interact*: instead of objects referencing each other directly (many-to-many communication), they all communicate through one mediator, reducing coupling.",
        antipattern: "Risk of becoming a 'God Object' anti-pattern itself if it absorbs too much logic from all the colleague objects it coordinates — the same failure mode as an overgrown Facade, since centralizing communication can silently turn into centralizing *all* the logic.",
        related: "Related: Facade (Facade offers a one-way simplified entry point to a subsystem; Mediator actively coordinates ongoing two-way interaction between colleague objects), Observer (Mediator can be implemented using Observer internally so colleagues notify the mediator of changes).",
        use: "Chat rooms, air traffic control, UI component coordination, microservice event bus",
        code: `// ── Mediator interface ───────────────────────────────────
public interface ChatMediator {
    void sendMessage(String message, ChatUser sender);
    void addUser(ChatUser user);
    void removeUser(ChatUser user);
}

// ── Colleague (Component) ─────────────────────────────────
public abstract class ChatUser {
    protected final ChatMediator mediator;
    protected final String name;

    public ChatUser(ChatMediator mediator, String name) {
        this.mediator = mediator;
        this.name     = name;
    }

    public abstract void send(String message);
    public abstract void receive(String message, ChatUser from);
    public String getName() { return name; }
}

// ── Concrete colleague ─────────────────────────────────────
public class ChatParticipant extends ChatUser {
    private final List<String> messageHistory = new ArrayList<>();

    public ChatParticipant(ChatMediator mediator, String name) {
        super(mediator, name);
    }

    public void send(String message) {
        System.out.println("[" + name + "] → " + message);
        mediator.sendMessage(message, this);   // routes via mediator, NOT direct to others
    }

    public void receive(String message, ChatUser from) {
        String entry = "[" + from.getName() + " → " + name + "]: " + message;
        messageHistory.add(entry);
        System.out.println("  " + entry);
    }
}

// ── Concrete mediator ─────────────────────────────────────
public class ChatRoom implements ChatMediator {
    private final List<ChatUser> users   = new ArrayList<>();
    private final String         roomName;

    public ChatRoom(String roomName) { this.roomName = roomName; }

    public void addUser(ChatUser user)    { users.add(user); System.out.println(user.getName() + " joined #" + roomName); }
    public void removeUser(ChatUser user) { users.remove(user); System.out.println(user.getName() + " left #" + roomName); }

    public void sendMessage(String message, ChatUser sender) {
        users.stream()
             .filter(u -> u != sender)          // don't echo to sender
             .forEach(u -> u.receive(message, sender));   // mediator routes to all others
    }
}

// ── Usage — no user knows about other users directly ──────
ChatMediator room = new ChatRoom("general");

ChatUser alice = new ChatParticipant(room, "Alice");
ChatUser bob   = new ChatParticipant(room, "Bob");
ChatUser carol = new ChatParticipant(room, "Carol");

room.addUser(alice); room.addUser(bob); room.addUser(carol);

alice.send("Hello everyone!");
bob.send("Hey Alice!");
carol.send("What's up?");`
      },
      {
        n: "Memento",
        intent: "Capture and externalize an object's internal state so it can be restored later, without violating encapsulation.",
        theory: "Classified as Behavioral because it governs the interaction needed to capture and later restore an object's internal state over time (undo/rollback), without exposing that state's internal representation to the object doing the saving.",
        antipattern: "Can silently become a memory/performance problem if mementos capture large object graphs and are kept indefinitely (e.g. an undo history with no size cap) — each snapshot's cost is easy to underestimate, especially for deep object state.",
        related: "Related: Command (paired together for undo functionality — Command triggers the action, Memento stores the state to revert to), Prototype (both involve copying state, but Memento is specifically for restoring a *previous* state of the *same* object later, not producing an independent new object).",
        use: "Undo/redo, snapshots, save-game state, transactional rollback",
        code: `// ── Memento — opaque snapshot of state ───────────────────
public class EditorMemento {
    private final String text;
    private final int    cursorPos;
    private final String selectedText;
    private final Instant timestamp;

    // Only the Originator creates mementos
    EditorMemento(String text, int cursorPos, String selectedText) {
        this.text         = text;
        this.cursorPos    = cursorPos;
        this.selectedText = selectedText;
        this.timestamp    = Instant.now();
    }

    // Only the Originator reads memento state (package-private)
    String getText()         { return text; }
    int    getCursorPos()    { return cursorPos; }
    String getSelectedText() { return selectedText; }
    Instant getTimestamp()   { return timestamp; }

    @Override public String toString() {
        return "Snapshot[" + timestamp + "]: '" + text.substring(0, Math.min(20, text.length())) + "...'";
    }
}

// ── Originator — creates and restores from mementos ──────
public class RichTextEditor {
    private StringBuilder text         = new StringBuilder();
    private int           cursorPos    = 0;
    private String        selectedText = "";

    public void type(String chars) {
        text.insert(cursorPos, chars);
        cursorPos += chars.length();
    }

    public void select(int start, int length) {
        selectedText = text.substring(start, start + length);
        System.out.println("Selected: '" + selectedText + "'");
    }

    public void delete() {
        if (!selectedText.isEmpty()) {
            int idx = text.indexOf(selectedText);
            text.delete(idx, idx + selectedText.length());
            selectedText = "";
        }
    }

    // Create a snapshot of current state
    public EditorMemento save() {
        System.out.println("Saving snapshot...");
        return new EditorMemento(text.toString(), cursorPos, selectedText);
    }

    // Restore state from a snapshot
    public void restore(EditorMemento memento) {
        text         = new StringBuilder(memento.getText());
        cursorPos    = memento.getCursorPos();
        selectedText = memento.getSelectedText();
        System.out.println("Restored to: '" + text + "'");
    }

    public String getText() { return text.toString(); }
}

// ── Caretaker — manages history ───────────────────────────
public class EditorHistory {
    private final Deque<EditorMemento> undoStack = new ArrayDeque<>();
    private final Deque<EditorMemento> redoStack = new ArrayDeque<>();

    public void push(EditorMemento m) { undoStack.push(m); redoStack.clear(); }

    public EditorMemento undo() {
        if (undoStack.isEmpty()) return null;
        EditorMemento m = undoStack.pop();
        redoStack.push(m);
        return undoStack.isEmpty() ? m : undoStack.peek();
    }

    public EditorMemento redo() {
        if (redoStack.isEmpty()) return null;
        EditorMemento m = redoStack.pop();
        undoStack.push(m);
        return m;
    }
}

// Usage
RichTextEditor editor  = new RichTextEditor();
EditorHistory  history = new EditorHistory();

editor.type("Hello");            history.push(editor.save());
editor.type(" World");           history.push(editor.save());
editor.type("!!!");              history.push(editor.save());
System.out.println(editor.getText());  // Hello World!!!

editor.restore(history.undo());  // Hello World
editor.restore(history.undo());  // Hello`
      },
      {
        n: "Visitor",
        intent: "Represent an operation to be performed on elements of an object structure. Visitor lets you add new operations without changing the element classes.",
        theory: "Classified as Behavioral because it defines how a new operation can be applied across a fixed set of element types via 'double dispatch' — the interaction/collaboration between visitor and elements is the behavior being standardized, letting you add operations without touching the element classes.",
        antipattern: "Widely regarded as one of the harder-to-justify GoF patterns in practice: it breaks encapsulation somewhat (elements must expose an `accept()` method purely to support external visitors) and adding a *new element type* (rather than a new operation) requires updating every existing visitor — the opposite trade-off from Strategy/Template Method, which is often surprising to teams and a common source of misuse when element types change frequently.",
        related: "Related: Iterator (an alternative traversal approach — Iterator exposes elements to the client one at a time; Visitor pushes the operation into the structure via double dispatch), Composite (Visitor is most commonly applied to Composite trees to run operations across every node without touching node classes).",
        use: "AST processing, document export (HTML/PDF/Markdown), tax calculations on order items",
        code: `// ── Element interface ────────────────────────────────────
public interface DocumentElement {
    void accept(DocumentVisitor visitor);
}

// ── Concrete elements ─────────────────────────────────────
public record Heading(int level, String text) implements DocumentElement {
    public void accept(DocumentVisitor v) { v.visit(this); }
}
public record Paragraph(String text) implements DocumentElement {
    public void accept(DocumentVisitor v) { v.visit(this); }
}
public record Image(String src, String alt) implements DocumentElement {
    public void accept(DocumentVisitor v) { v.visit(this); }
}

// ── Visitor interface ─────────────────────────────────────
public interface DocumentVisitor {
    void visit(Heading heading);
    void visit(Paragraph paragraph);
    void visit(Image image);
}

// ── Concrete visitor 1: HTML exporter ─────────────────────
public class HtmlExporter implements DocumentVisitor {
    private final StringBuilder html = new StringBuilder();

    public void visit(Heading h) {
        html.append("<h").append(h.level()).append(">")
            .append(h.text())
            .append("</h").append(h.level()).append(">\n");
    }
    public void visit(Paragraph p) {
        html.append("<p>").append(p.text()).append("</p>\n");
    }
    public void visit(Image img) {
        html.append("<img src=\"").append(img.src())
            .append("\" alt=\"").append(img.alt()).append("\">\n");
    }

    public String getHtml() { return html.toString(); }
}

// ── Concrete visitor 2: Markdown exporter ─────────────────
public class MarkdownExporter implements DocumentVisitor {
    private final StringBuilder md = new StringBuilder();

    public void visit(Heading h)   { md.append("#".repeat(h.level())).append(" ").append(h.text()).append("\n\n"); }
    public void visit(Paragraph p) { md.append(p.text()).append("\n\n"); }
    public void visit(Image img)   { md.append("![").append(img.alt()).append("](").append(img.src()).append(")\n\n"); }

    public String getMarkdown() { return md.toString(); }
}

// ── Document object structure ─────────────────────────────
List<DocumentElement> doc = List.of(
    new Heading(1, "Spring Boot Guide"),
    new Paragraph("Spring Boot makes it easy to create stand-alone applications."),
    new Image("diagram.png", "Architecture")
);

// Export to HTML — no changes to element classes
HtmlExporter htmlExporter = new HtmlExporter();
doc.forEach(el -> el.accept(htmlExporter));
System.out.println(htmlExporter.getHtml());

// Export to Markdown — just a different visitor
MarkdownExporter mdExporter = new MarkdownExporter();
doc.forEach(el -> el.accept(mdExporter));
System.out.println(mdExporter.getMarkdown());`
      },
    ]
  },
  {
    cat: "Architectural Patterns",
    icon: "◈",
    color: "#10B981",
    desc: "Higher-level patterns that define the structure of entire systems.",
    topics: [
      {
        n: "Repository Pattern",
        intent: "Abstract data access logic behind a collection-like interface. Business logic doesn't know or care about the underlying data store.",
        theory: "Considered an architectural/enterprise pattern rather than a classic GoF pattern: it abstracts persistence behind a collection-like interface, decoupling domain/business logic from data-access details — an architecture-level separation of concerns rather than an object-creation, structural-composition, or object-interaction pattern.",
        antipattern: "Martin Fowler and others have flagged an overly generic 'Repository over an ORM' (e.g. wrapping JPA/Hibernate, which is already a Repository-like abstraction, in another Repository layer) as a redundant-abstraction anti-pattern sometimes called 'Repository over Repository' — it adds an indirection layer that provides no real decoupling benefit if the ORM is never going to be swapped out.",
        related: "Related: DAO — Data Access Object (an older, similar pattern; Repository is generally considered a more domain-oriented, collection-like abstraction while DAO is closer to raw persistence operations), Unit of Work (frequently paired with Repository to batch multiple repository changes into one transaction), CQRS (a common next step once Repository's single read/write model starts feeling limiting).",
        use: "Every Spring Data application, domain-driven design",
        code: `// ── Domain entity ─────────────────────────────────────────
public record Product(Long id, String name, BigDecimal price, String category, boolean active) {}

// ── Repository interface — pure domain language ────────────
public interface ProductRepository {
    Optional<Product> findById(Long id);
    List<Product>     findAll();
    List<Product>     findByCategory(String category);
    List<Product>     findActive();
    Product           save(Product product);
    void              delete(Long id);
    boolean           exists(Long id);
    long              count();
}

// ── In-memory implementation (for testing) ────────────────
public class InMemoryProductRepository implements ProductRepository {
    private final Map<Long, Product> store = new ConcurrentHashMap<>();
    private final AtomicLong         seq   = new AtomicLong(1);

    public Optional<Product> findById(Long id)    { return Optional.ofNullable(store.get(id)); }
    public List<Product>     findAll()             { return new ArrayList<>(store.values()); }

    public List<Product> findByCategory(String cat) {
        return store.values().stream()
            .filter(p -> p.category().equals(cat))
            .collect(Collectors.toList());
    }

    public List<Product> findActive() {
        return store.values().stream().filter(Product::active).collect(Collectors.toList());
    }

    public Product save(Product product) {
        Long id = product.id() != null ? product.id() : seq.getAndIncrement();
        Product saved = new Product(id, product.name(), product.price(), product.category(), product.active());
        store.put(id, saved);
        return saved;
    }

    public void delete(Long id) { store.remove(id); }
    public boolean exists(Long id) { return store.containsKey(id); }
    public long count() { return store.size(); }
}

// ── JPA implementation ────────────────────────────────────
@Repository
public class JpaProductRepository implements ProductRepository {
    @PersistenceContext private EntityManager em;

    public Optional<Product> findById(Long id) {
        return Optional.ofNullable(em.find(ProductEntity.class, id))
                       .map(ProductMapper::toDomain);
    }

    public List<Product> findByCategory(String category) {
        return em.createQuery("SELECT p FROM Product p WHERE p.category = :cat", ProductEntity.class)
                 .setParameter("cat", category)
                 .getResultList()
                 .stream().map(ProductMapper::toDomain).collect(Collectors.toList());
    }

    @Transactional
    public Product save(Product product) {
        ProductEntity entity = ProductMapper.toEntity(product);
        return ProductMapper.toDomain(em.merge(entity));
    }

    // ... other methods
}

// ── Service uses repository — no SQL anywhere ──────────────
@Service
public class ProductService {
    private final ProductRepository repository;

    public ProductService(ProductRepository repository) { this.repository = repository; }

    public Product getProductOrThrow(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    // Easy to test: inject InMemoryProductRepository
}`
      },
      {
        n: "CQRS — Command Query Responsibility Segregation",
        intent: "Separate the read model (queries) from the write model (commands). Each is optimized independently.",
        theory: "An architectural pattern: it operates above the level of a single class, splitting the read model (queries) from the write model (commands) across the whole application so each can be scaled, modeled, and optimized independently.",
        antipattern: "Frequently over-applied as resume-driven or premature architecture: introducing separate read/write models (and often separate data stores) for a simple CRUD app adds real operational complexity (eventual consistency between the write and read sides, more moving parts) with no matching benefit — CQRS earns its complexity mainly in systems with very different read vs. write load/shape requirements.",
        related: "Related: Event Sourcing (very commonly paired with CQRS — events written on the command side are used to build/update the query-side read models), Repository Pattern (CQRS often replaces a single repository with separate command and query paths), Eventual Consistency (the trade-off CQRS introduces when read and write stores are separate).",
        use: "High-traffic systems, event sourcing, read-heavy APIs with complex write logic",
        code: `// ── Commands — write side ─────────────────────────────────
public record CreateOrderCommand(String customerId, List<LineItem> items, String shippingAddress) {}
public record CancelOrderCommand(String orderId, String reason) {}
public record UpdateOrderItemCommand(String orderId, String itemId, int quantity) {}

// ── Command handlers ──────────────────────────────────────
@Service
public class OrderCommandHandler {

    private final OrderWriteRepository writeRepo;
    private final EventPublisher        eventPublisher;

    @Transactional
    public OrderId handle(CreateOrderCommand cmd) {
        Order order = Order.create(cmd.customerId(), cmd.items(), cmd.shippingAddress());
        Order saved = writeRepo.save(order);
        eventPublisher.publish(new OrderCreatedEvent(saved.getId(), cmd.customerId()));
        return saved.getId();
    }

    @Transactional
    public void handle(CancelOrderCommand cmd) {
        Order order = writeRepo.findById(cmd.orderId()).orElseThrow();
        order.cancel(cmd.reason());
        writeRepo.save(order);
        eventPublisher.publish(new OrderCancelledEvent(cmd.orderId(), cmd.reason()));
    }
}

// ── Queries — read side (different model!) ────────────────
public record OrderSummaryQuery(String customerId, OrderStatus status, int page, int size) {}
public record OrderDetailQuery(String orderId) {}

// ── Read model DTOs (optimized for display, not domain rules) ──
public record OrderSummaryDto(String id, double total, String status, String createdAt) {}
public record OrderDetailDto(String id, List<LineItemDto> items, double total,
                             String status, String shippingAddress, String trackingNumber) {}

// ── Query handlers — can use views, caches, Elasticsearch etc. ──
@Service
public class OrderQueryHandler {

    private final OrderReadRepository readRepo;     // could be different DB/table

    public Page<OrderSummaryDto> handle(OrderSummaryQuery query) {
        return readRepo.findSummaries(
            query.customerId(), query.status(),
            PageRequest.of(query.page(), query.size())
        );
    }

    public OrderDetailDto handle(OrderDetailQuery query) {
        return readRepo.findDetailById(query.orderId())
            .orElseThrow(() -> new OrderNotFoundException(query.orderId()));
    }
}

// ── Controller routes to appropriate handler ─────────────
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderCommandHandler commandHandler;
    private final OrderQueryHandler   queryHandler;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public String create(@RequestBody CreateOrderCommand cmd) {
        return commandHandler.handle(cmd).value();
    }

    @GetMapping
    public Page<OrderSummaryDto> list(OrderSummaryQuery query) {
        return queryHandler.handle(query);
    }

    @GetMapping("/{id}")
    public OrderDetailDto detail(@PathVariable String id) {
        return queryHandler.handle(new OrderDetailQuery(id));
    }
}`
      },
      {
        n: "Event Sourcing",
        intent: "Store all changes to application state as a sequence of events. The current state is derived by replaying events. Events are immutable facts.",
        theory: "An architectural pattern: it changes how state is persisted system-wide — storing an immutable log of state-changing events instead of just current state, with current state derived by replaying events. Often paired with CQRS.",
        antipattern: "A well-known pitfall is treating Event Sourcing as 'free audit log + free CQRS' without planning for event schema evolution — once events are immutable and stored forever, changing their shape later (a near-certainty in any long-lived system) requires careful versioning/upcasting, which teams frequently underestimate until it becomes painful.",
        related: "Related: CQRS (near-constant companion — the event log is the write side's source of truth, while read models are projections built from replaying events), Memento (both preserve state over time, but Memento restores a snapshot of one object, while Event Sourcing reconstructs current state from a full history of *all* changes).",
        use: "Audit trails, temporal queries ('what was the state on date X?'), event-driven microservices",
        code: `// ── Domain events (immutable facts) ──────────────────────
public sealed interface AccountEvent permits
    AccountCreated, MoneyDeposited, MoneyWithdrawn, AccountClosed {
    String accountId();
    Instant occurredAt();
}

public record AccountCreated(String accountId, String ownerId, Instant occurredAt) implements AccountEvent {}
public record MoneyDeposited(String accountId, BigDecimal amount, String description, Instant occurredAt) implements AccountEvent {}
public record MoneyWithdrawn(String accountId, BigDecimal amount, String description, Instant occurredAt) implements AccountEvent {}
public record AccountClosed(String accountId, String reason, Instant occurredAt) implements AccountEvent {}

// ── Aggregate — state built by replaying events ───────────
public class BankAccount {
    private String     id;
    private BigDecimal balance = BigDecimal.ZERO;
    private boolean    closed  = false;
    private final List<AccountEvent> uncommittedEvents = new ArrayList<>();

    // Reconstruct from event history
    public static BankAccount from(List<AccountEvent> history) {
        BankAccount acc = new BankAccount();
        history.forEach(acc::apply);
        return acc;
    }

    // Business methods — validate, create event
    public void deposit(BigDecimal amount, String description) {
        if (closed) throw new IllegalStateException("Account is closed");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Amount must be positive");

        MoneyDeposited event = new MoneyDeposited(id, amount, description, Instant.now());
        apply(event);
        uncommittedEvents.add(event);   // mark for persistence
    }

    public void withdraw(BigDecimal amount, String description) {
        if (closed) throw new IllegalStateException("Account is closed");
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException(balance, amount);

        MoneyWithdrawn event = new MoneyWithdrawn(id, amount, description, Instant.now());
        apply(event);
        uncommittedEvents.add(event);
    }

    // Apply — pure state mutation, no side effects
    private void apply(AccountEvent event) {
        switch (event) {
            case AccountCreated  e -> { this.id = e.accountId(); }
            case MoneyDeposited  e -> { this.balance = balance.add(e.amount()); }
            case MoneyWithdrawn  e -> { this.balance = balance.subtract(e.amount()); }
            case AccountClosed   e -> { this.closed = true; }
        }
    }

    public List<AccountEvent> getUncommittedEvents() { return List.copyOf(uncommittedEvents); }
    public void clearUncommittedEvents()             { uncommittedEvents.clear(); }
    public BigDecimal getBalance()                   { return balance; }
}

// ── Event store ────────────────────────────────────────────
public interface EventStore {
    void append(String aggregateId, List<AccountEvent> events, long expectedVersion);
    List<AccountEvent> load(String aggregateId);
    List<AccountEvent> loadSince(String aggregateId, Instant since);  // temporal queries!
}

// ── Service ────────────────────────────────────────────────
@Service
public class BankAccountService {
    private final EventStore eventStore;

    public void deposit(String accountId, BigDecimal amount, String desc) {
        List<AccountEvent> history = eventStore.load(accountId);
        BankAccount account = BankAccount.from(history);

        account.deposit(amount, desc);  // generates MoneyDeposited event

        eventStore.append(accountId, account.getUncommittedEvents(), history.size());
        // State is NEVER stored — only events!
    }

    public BigDecimal getBalance(String accountId) {
        return BankAccount.from(eventStore.load(accountId)).getBalance();
    }

    // "What was the balance on Jan 1?" — replay events up to that point
    public BigDecimal getBalanceAt(String accountId, Instant pointInTime) {
        List<AccountEvent> history = eventStore.load(accountId)
            .stream().filter(e -> !e.occurredAt().isAfter(pointInTime))
            .collect(Collectors.toList());
        return BankAccount.from(history).getBalance();
    }
}`
      },
    ]
  },
  {
    cat: "Java-Specific Patterns",
    icon: "☕",
    color: "#F97316",
    desc: "Patterns idiomatic to Java — leveraging the type system, generics, and language features.",
    topics: [
      {
        n: "Null Object Pattern",
        intent: "Provide a default object with do-nothing behavior instead of returning null. Eliminates null checks throughout the codebase.",
        theory: "Classified as Behavioral because it standardizes how calling code *behaves* when there's 'nothing to do' — substituting a real object with a do-nothing implementation keeps the calling code's control flow uniform, eliminating scattered null checks.",
        antipattern: "Not an anti-pattern — it's specifically the *fix* for a real anti-pattern: littering code with `if (obj != null)` checks everywhere, or worse, allowing `NullPointerException`s to propagate. The only pitfall is using a Null Object where the caller genuinely needs to distinguish 'nothing happened' from 'a real object did nothing' (e.g. for logging/metrics) — in that case, swallowing the null case silently can hide real issues.",
        related: "Related: Special Case pattern (Martin Fowler's broader term for this idea — substituting a well-defined class for a special/edge condition), Optional/Maybe types (Java's `Optional<T>` is a more explicit, type-checked alternative to a silent Null Object).",
        use: "Default implementations, optional dependencies, logging no-ops",
        code: `// ── Interface ─────────────────────────────────────────────
public interface DiscountCalculator {
    BigDecimal calculate(Order order);
    String getName();
    boolean isApplicable(Customer customer);
}

// ── Real implementation ────────────────────────────────────
public class PremiumDiscount implements DiscountCalculator {
    public BigDecimal calculate(Order order) {
        return order.getTotal().multiply(new BigDecimal("0.25"));  // 25% off
    }
    public String getName()  { return "Premium Member Discount"; }
    public boolean isApplicable(Customer c) { return c.isPremium(); }
}

// ── Null Object — no discount, no null checks ──────────────
public class NoDiscount implements DiscountCalculator {
    public BigDecimal calculate(Order order) { return BigDecimal.ZERO; }  // safe default
    public String getName()  { return "No Discount"; }
    public boolean isApplicable(Customer c) { return true; }
}

// ── Service uses it without null checks ───────────────────
public class OrderService {
    private static final DiscountCalculator NO_DISCOUNT = new NoDiscount();

    public BigDecimal calculateTotal(Order order, Customer customer) {
        DiscountCalculator calc = discountRepo.findFor(customer)
            .orElse(NO_DISCOUNT);   // never null — null object instead

        // No null check needed!
        BigDecimal discount = calc.calculate(order);
        System.out.println("Applied: " + calc.getName() + " = -$" + discount);
        return order.getTotal().subtract(discount);
    }
}

// ── Null Logger pattern ────────────────────────────────────
public interface Logger {
    void info(String msg);
    void error(String msg, Throwable t);
}

public class NullLogger implements Logger {
    public void info(String msg) {}                   // no-op
    public void error(String msg, Throwable t) {}    // no-op
}

public class ConsoleLogger implements Logger {
    public void info(String msg)            { System.out.println("[INFO]  " + msg); }
    public void error(String msg, Throwable t) { System.err.println("[ERROR] " + msg + ": " + t); }
}

// Optional logger dependency
public class ReportGenerator {
    private Logger logger = new NullLogger();  // default: no logging

    public ReportGenerator withLogger(Logger logger) {
        this.logger = logger; return this;
    }

    public Report generate() {
        logger.info("Generating report...");  // safe — NullLogger handles no-op
        return new Report();
    }
}`
      },
      {
        n: "Service Locator vs Dependency Injection",
        intent: "Both manage dependencies. DI (preferred) pushes dependencies in from outside; Service Locator pulls them from a registry. DI makes dependencies explicit and testable.",
        theory: "This comparison is included because Service Locator is widely considered an **anti-pattern**: it hides a class's real dependencies behind a global lookup call, so they're no longer visible in the constructor/API — this hurts testability and makes the true dependency graph opaque. Dependency Injection is the accepted counter-pattern because it pushes dependencies in explicitly (usually via the constructor), keeping them visible, testable, and swappable — which is why modern Java design favors DI and flags Service Locator as a pattern to avoid.",
        antipattern: "Beyond hiding dependencies, Service Locator has a second, subtler problem: dependency resolution failures move from compile-time (a missing constructor argument won't compile) to run-time (a missing registration in the locator only fails when that code path actually executes) — this is a major reason it's downgraded from 'pattern' to 'anti-pattern' in most modern Java guidance, even though early J2EE architectures relied on it heavily.",
        related: "Related: Dependency Injection / IoC Container (the modern replacement — Spring's `ApplicationContext`, CDI, etc.), Factory Method / Abstract Factory (Service Locator is sometimes seen as a generalized, registry-based factory — but one that hides *what* is being requested until run-time, which is exactly the trade-off DI avoids).",
        use: "Dependency injection frameworks, testability, service configuration",
        code: `// ── Service Locator (anti-pattern in modern Java) ──────────
public class ServiceLocator {
    private static final Map<Class<?>, Object> registry = new HashMap<>();

    public static <T> void register(Class<T> type, T impl) { registry.put(type, impl); }

    @SuppressWarnings("unchecked")
    public static <T> T get(Class<T> type) {
        T service = (T) registry.get(type);
        if (service == null) throw new RuntimeException("No service registered for " + type);
        return service;
    }
}

// Problems: hidden dependencies, hard to test, global mutable state
class OrderService_BAD {
    public void process(Order order) {
        PaymentService payment = ServiceLocator.get(PaymentService.class); // hidden dep!
        EmailService   email   = ServiceLocator.get(EmailService.class);   // hidden dep!
        // Can't test without setting up the global registry
    }
}

// ── Dependency Injection (preferred) ───────────────────────
class OrderService_GOOD {
    private final PaymentService paymentService;   // explicit dep
    private final EmailService   emailService;     // explicit dep

    // Constructor injection — dependencies are explicit and required
    public OrderService_GOOD(PaymentService paymentService, EmailService emailService) {
        this.paymentService = paymentService;
        this.emailService   = emailService;
    }

    public void process(Order order) {
        paymentService.charge(order);  // obvious where this comes from
        emailService.sendConfirmation(order);
    }
}

// In tests: just pass mocks — no global state to set up
class OrderServiceTest {
    @Test
    void processOrder() {
        PaymentService mockPayment = mock(PaymentService.class);
        EmailService   mockEmail   = mock(EmailService.class);

        OrderService_GOOD service = new OrderService_GOOD(mockPayment, mockEmail);
        service.process(new Order());

        verify(mockPayment).charge(any());
        verify(mockEmail).sendConfirmation(any());
    }
}`
      },
    ]
  },
];

export { SECTIONS };

export default function DesignPatterns() {
  return (
    <RevisionNotesLayout
      pageKey="design-patterns"
      title="Java Design Patterns"
      subtitle="Creational, Structural, Behavioral and Architectural design patterns with intent, implementation, and code examples."
      categoryIcon="🎨"
      categoryColor="#EC4899"
      sections={SECTIONS}
    />
  );
}