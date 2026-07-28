import RevisionNotesLayout from './components/RevisionNotesLayout';

// ─── Theory + desc + code for every annotation ───────────────
const DATA = [
  {
    cat: "Controller / Web MVC",
    color: "#58a6ff",
    bg: "#1f3a5f",
    icon: "🌐",
    anns: [
      {
        n: "@RestController",
        theory: `@RestController is a composed annotation introduced in Spring 4. Internally it is annotated with both @Controller and @ResponseBody, which means every handler method in the class automatically serialises its return value into the HTTP response body (JSON by default via Jackson) instead of treating it as a view name.

How it works under the hood: Spring MVC passes the return value through a chain of HttpMessageConverter instances. Jackson's MappingJackson2HttpMessageConverter handles objects → JSON. When the Accept header asks for XML and you have Jackson-Dataformat-XML on the classpath, the same return value is written as XML — zero code change.

Without @RestController you would need @Controller on the class AND @ResponseBody on every method. @RestController removes that duplication.

Key difference from @Controller: A plain @Controller method returning a String is interpreted as a logical view name ("home" → home.html). A @RestController method returning a String writes that string directly to the HTTP response body.

When to use: Every REST API endpoint class. When you need BOTH view rendering and JSON from the same controller, use @Controller and annotate individual methods with @ResponseBody.`,
        desc: "Combines @Controller + @ResponseBody. Every method's return value is written directly to the HTTP response body as JSON/XML. The most common annotation for building REST APIs.",
        code: `@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id); // auto-serialized to JSON
    }
}`
      },
      {
        n: "@Controller",
        theory: `@Controller is a specialisation of @Component that marks a class as a Spring MVC controller. It participates in component scanning and registers the class as a bean in the ApplicationContext.

The fundamental purpose is server-side view rendering. When a handler method returns a String like "dashboard", Spring's ViewResolver (e.g., ThymeleafViewResolver) looks up the template at templates/dashboard.html and renders it with the current Model data.

Spring MVC lifecycle for a @Controller request:
1. DispatcherServlet receives the request.
2. HandlerMapping finds the controller method.
3. The method executes, adds data to the Model, returns a view name.
4. ViewResolver resolves the name to a template.
5. Template engine renders HTML and writes to response.

You can mix JSON and view responses in the same @Controller by annotating specific methods with @ResponseBody or using ResponseEntity. However, once you go fully REST, @RestController is cleaner.

Stereotype role: Because it is meta-annotated with @Component, @Controller classes are auto-detected by @ComponentScan, just like @Service and @Repository.`,
        desc: "Marks an MVC controller. Methods return view names (templates like Thymeleaf). Use @ResponseBody explicitly if you need JSON from a specific method.",
        code: `@Controller
public class HomeController {

    @GetMapping("/home")
    public String home(Model model) {
        model.addAttribute("user", "John");
        return "home"; // resolves to home.html template
    }
}`
      },
      {
        n: "@RequestMapping",
        theory: `@RequestMapping is the root annotation for mapping HTTP requests to handler methods or classes. It is the general-purpose mapping annotation from which all the shortcuts (@GetMapping, @PostMapping, etc.) are derived.

Attributes you can specify:
• value / path: URL patterns (supports Ant wildcards like /api/** and path variables like /users/{id}).
• method: HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS).
• params: require specific request parameters (e.g., params="version=2").
• headers: require specific request headers.
• consumes: restrict to requests with a specific Content-Type.
• produces: restrict to requests with a specific Accept header and sets the response Content-Type.

Class-level vs method-level: When @RequestMapping is on the class, all method mappings are relative to it. A class with @RequestMapping("/api/orders") and a method with @GetMapping("/{id}") maps to GET /api/orders/{id}.

Pattern matching: Spring uses PathPatternParser (default since Spring 5.3) for efficient path matching. Supports {variable}, {variable:regex}, ** (multi-segment wildcard).

Why prefer shortcuts: @GetMapping is @RequestMapping(method = RequestMethod.GET) — shorter and immediately communicates intent. Use @RequestMapping directly when you need fine-grained control over multiple attributes at once or need to handle multiple HTTP methods with a single handler.`,
        desc: "Maps HTTP requests to handler methods. Can be applied at class and method level. Supports path, method, headers, params, consumes, and produces attributes.",
        code: `@RestController
@RequestMapping(value = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class ApiController {

    @RequestMapping(value = "/data", method = RequestMethod.GET)
    public List<Data> getData() { ... }
}`
      },
      {
        n: "@GetMapping / @PostMapping / @PutMapping / @DeleteMapping / @PatchMapping",
        theory: `These five annotations are composed shortcuts that combine @RequestMapping with a specific HTTP method constraint. They were introduced in Spring 4.3 to improve code readability and reduce boilerplate.

Each one is annotated as a meta-annotation like:
  @RequestMapping(method = RequestMethod.GET)
  public @interface GetMapping { ... }

HTTP method semantics (REST conventions):
• @GetMapping: Retrieve resource(s). Safe (no side effects) and idempotent. Response can be cached.
• @PostMapping: Create a new resource or trigger an action. Not idempotent — calling twice creates two resources.
• @PutMapping: Replace an entire resource at a known URI. Idempotent — calling twice gives the same result.
• @DeleteMapping: Remove a resource. Idempotent.
• @PatchMapping: Partially update a resource. Not necessarily idempotent (depends on implementation).

All five support the same attributes as @RequestMapping (path, consumes, produces, params, headers). You can combine them at the class level with a class-level @RequestMapping to build a clean, nested routing structure.

Interview note: PATCH vs PUT — PUT replaces the whole resource (you send the full representation), PATCH sends only changed fields (partial update). Spring doesn't enforce this semantically; the difference is a REST convention.`,
        desc: "Composed shortcuts for @RequestMapping with a specific HTTP method. Prefer these over @RequestMapping for clarity.",
        code: `@RestController
@RequestMapping("/api/products")
public class ProductController {

    @GetMapping                        // GET /api/products
    public List<Product> getAll() { ... }

    @PostMapping                       // POST /api/products
    public Product create(@RequestBody Product p) { ... }

    @PutMapping("/{id}")              // PUT /api/products/{id}
    public Product update(@PathVariable Long id, @RequestBody Product p) { ... }

    @DeleteMapping("/{id}")           // DELETE /api/products/{id}
    public void delete(@PathVariable Long id) { ... }

    @PatchMapping("/{id}/status")     // PATCH /api/products/{id}/status
    public Product patchStatus(@PathVariable Long id, @RequestBody StatusDto dto) { ... }
}`
      },
      {
        n: "@PathVariable",
        theory: `@PathVariable extracts dynamic segments from the URI path template and binds them to method parameters. The URI template uses curly braces to denote variable segments: /orders/{orderId}/items/{itemId}.

How it works: Spring's HandlerMapping parses the URI against the template and stores matches in a Map. @PathVariable reads from that map by name. By default, the parameter name must match the template variable name exactly. Use @PathVariable("varName") to override.

Type conversion: Spring automatically converts the extracted String to the target type (Long, Integer, UUID, enum, etc.) using its built-in ConversionService. If conversion fails, a MethodArgumentTypeMismatchException (HTTP 400) is thrown.

Optional path variables: In Spring 5+, you can use @PathVariable(required = false) with Optional<T> or a nullable type to make a path segment optional. However, this usually signals a design issue — consider separate mappings instead.

Regex constraints: Path templates support inline regex to constrain what a segment can match:
  @GetMapping("/users/{id:[0-9]+}") — only numeric IDs match.
  @GetMapping("/files/{filename:.+}") — allows dots in filename.`,
        desc: "Extracts a value from the URI path template. The variable name must match the placeholder in @RequestMapping unless you use the value attribute.",
        code: `@GetMapping("/orders/{orderId}/items/{itemId}")
public OrderItem getItem(
    @PathVariable Long orderId,
    @PathVariable("itemId") Long id) {

    return orderService.getItem(orderId, id);
}`
      },
      {
        n: "@RequestParam",
        theory: `@RequestParam binds query string parameters (the part after ? in a URL) or HTML form fields to method parameters. It is used for optional filters, pagination, search terms, and other non-path data.

Attributes:
• value / name: The query parameter key name (defaults to the parameter name via reflection).
• required: Whether the parameter must be present (default true — missing param → 400 Bad Request).
• defaultValue: Value to use if the param is absent. Setting a defaultValue implicitly makes the param optional (required becomes false).

Multi-value parameters: A parameter can appear multiple times in the URL: ?tags=java&tags=spring. Use List<String> or String[] as the parameter type to collect all values.

Map binding: @RequestParam Map<String, String> params collects ALL query parameters into a map — useful for dynamic filtering.

Difference from @PathVariable: @PathVariable reads from the URL path structure (/users/42). @RequestParam reads from the query string (/users?id=42). Both can coexist in the same method.

Form data: For HTML form POSTs, @RequestParam extracts values from the request body when the Content-Type is application/x-www-form-urlencoded — same annotation, different request source.`,
        desc: "Extracts a query parameter or form field from the request. Supports required flag and defaultValue.",
        code: `// GET /search?query=shoes&page=2&size=20
@GetMapping("/search")
public Page<Product> search(
    @RequestParam String query,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(required = false, defaultValue = "10") int size) {

    return productService.search(query, page, size);
}`
      },
      {
        n: "@RequestBody",
        theory: `@RequestBody tells Spring to read the HTTP request body and deserialise it into the annotated method parameter using the appropriate HttpMessageConverter.

For JSON, Jackson's MappingJackson2HttpMessageConverter is used. It reads the request Content-Type header to select the converter. If the Content-Type is application/json, Jackson deserialises the body into the target class.

Validation integration: Combine with @Valid or @Validated to trigger Bean Validation constraints on the deserialized object. If validation fails, Spring throws MethodArgumentNotValidException (HTTP 400) and BindingResult can be used to inspect specific field errors.

How the body is read: The request body is an InputStream that can only be read once. @RequestBody reads it fully and converts it. This means you cannot use @RequestBody and also manually read HttpServletRequest's InputStream in the same request.

Supported content types: Beyond JSON, Spring supports XML (with Jackson-Dataformat-XML), form data (with FormHttpMessageConverter), and plain text, depending on which converters are registered.

Null/missing body: If the request has no body and @RequestBody is present, Spring throws HttpMessageNotReadableException (HTTP 400) unless required = false is set (available in Spring 5).`,
        desc: "Deserializes the HTTP request body (JSON/XML) into a Java object using HttpMessageConverter (Jackson by default).",
        code: `@PostMapping("/users")
public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserDto dto) {
    // dto is auto-populated from JSON request body
    // { "name": "Alice", "email": "alice@example.com" }
    User user = userService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(user);
}`
      },
      {
        n: "@ResponseBody",
        theory: `@ResponseBody tells Spring that the return value of an annotated method should be written directly to the HTTP response body, rather than being interpreted as a view name.

Mechanism: Spring passes the return value through the registered HttpMessageConverter chain. The converter matching the Accept header and the return type does the serialisation (typically Jackson → JSON).

Without @ResponseBody on a @Controller method, returning "dashboard" means "resolve the template named dashboard". With @ResponseBody, "dashboard" is written as a plain string body.

@RestController is a shortcut: It meta-annotates @ResponseBody at the class level, so all methods in the class inherit it automatically. You only need @ResponseBody explicitly on individual methods when working inside a @Controller class that also has view-rendering methods.

ResponseEntity vs @ResponseBody: @ResponseBody serialises the return value as the body only. ResponseEntity<T> lets you also control status code and headers explicitly — it is a superset of @ResponseBody.`,
        desc: "Tells Spring to serialize the method return value and write it to the response body. Implied by @RestController.",
        code: `@Controller
public class DataController {

    @GetMapping("/api/data")
    @ResponseBody   // This specific method returns JSON, not a view
    public Map<String, Object> getData() {
        return Map.of("status", "ok", "count", 42);
    }
}`
      },
      {
        n: "@ResponseStatus",
        theory: `@ResponseStatus sets the HTTP status code (and optionally a reason phrase) that should be returned by a handler method or when a specific exception class is thrown.

Two main use cases:

1. ON A HANDLER METHOD: Declares what status code to send when the method completes normally. Without @ResponseStatus, Spring defaults to 200 OK for successful responses. Use @ResponseStatus(HttpStatus.CREATED) for POST handlers that create resources, or NO_CONTENT (204) for DELETE handlers.

2. ON AN EXCEPTION CLASS: When an exception annotated with @ResponseStatus is thrown anywhere, Spring's ResponseStatusExceptionResolver catches it and writes the specified status code. This is a clean way to tie a business exception to an HTTP response code without a catch block or @ExceptionHandler.

Priority and interaction: If both @ResponseStatus and ResponseEntity are present, ResponseEntity takes precedence (it gives you explicit runtime control over the status). @ResponseStatus is a static declaration — great for documenting intent, but inflexible if the status depends on runtime conditions.

Reason phrase: The reason attribute sets the response reason phrase but also commits the response using sendError(), which may conflict with custom error bodies. Prefer @ExceptionHandler for full control over the response body.`,
        desc: "Sets a specific HTTP status code for a method or exception class. Can be used on controllers or exception handlers.",
        code: `// On a controller method
@PostMapping("/items")
@ResponseStatus(HttpStatus.CREATED)   // returns 201 Created
public Item create(@RequestBody Item item) {
    return itemService.save(item);
}

// On a custom exception class
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String msg) { super(msg); }
}`
      },
      {
        n: "@CrossOrigin",
        theory: `@CrossOrigin enables Cross-Origin Resource Sharing (CORS) — the browser security mechanism that blocks JavaScript running on domain A from calling APIs on domain B unless the server explicitly allows it.

How CORS works:
1. Browser sends a preflight OPTIONS request with Origin, Access-Control-Request-Method, and Access-Control-Request-Headers headers.
2. Server responds with Access-Control-Allow-Origin, Access-Control-Allow-Methods, etc.
3. If the server allows it, the browser proceeds with the real request.
4. For simple requests (GET, POST with simple content types), there may be no preflight.

@CrossOrigin placement:
• On a method: applies only to that endpoint.
• On a class: applies to all endpoints in the controller.
• Global via WebMvcConfigurer: applies to all controllers — preferred for production.

Key attributes:
• origins: Which origins to allow ("*" = all, or specific domains).
• methods: Which HTTP methods are allowed.
• allowedHeaders: Which request headers are allowed.
• allowCredentials: Whether to include cookies/auth in CORS requests (cannot use "*" for origins when true).
• maxAge: How long the preflight response can be cached (in seconds).

Security note: allowedOrigins("*") with allowCredentials(true) is rejected by browsers. You must list specific origins when using credentials.`,
        desc: "Enables CORS (Cross-Origin Resource Sharing) for specific controllers or methods. Allows browsers from other domains to call your API.",
        code: `// Allow all origins on specific method
@CrossOrigin(origins = "*")
@GetMapping("/public-data")
public Data getPublicData() { ... }

// Global CORS via WebMvcConfigurer
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://myapp.com")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}`
      },
      {
        n: "@RequestHeader",
        theory: `@RequestHeader binds an HTTP request header value to a method parameter. Headers carry metadata about the request — authentication tokens, content negotiation, client information, custom routing headers, etc.

Attributes:
• value / name: The header name (case-insensitive per HTTP spec).
• required: Whether the header must be present (default true). Missing required header → 400 Bad Request.
• defaultValue: Fallback value if header is absent.

Common headers you'll bind: Authorization (Bearer tokens, Basic auth), Content-Type, Accept, X-Tenant-ID (multi-tenancy), X-Correlation-ID (distributed tracing), X-Forwarded-For (client IP via proxy), User-Agent.

Multi-value headers: Some headers can appear multiple times (Accept, Cookie). Use List<String> or String[] as the parameter type to capture all values.

Map binding: @RequestHeader Map<String, String> headers captures all request headers — useful for debugging or passing headers through to downstream services.

Alternative — HttpServletRequest: You can access headers via request.getHeader("Authorization") on an injected HttpServletRequest, but @RequestHeader is cleaner and integrates with Spring's type conversion.`,
        desc: "Binds an HTTP request header value to a method parameter.",
        code: `@GetMapping("/secure")
public Data getSecure(
    @RequestHeader("Authorization") String authHeader,
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant) {

    // authHeader = "Bearer eyJhbGci..."
    return secureService.getData(authHeader, tenant);
}`
      },
      {
        n: "@CookieValue",
        theory: `@CookieValue binds the value of an HTTP cookie to a method parameter. Cookies are key-value pairs stored in the browser and sent with every matching request.

How cookies work: The server sets a cookie with Set-Cookie response header. The browser stores it and includes it in subsequent requests via the Cookie request header. @CookieValue extracts a named cookie from that header.

Attributes:
• value / name: Cookie name (case-sensitive).
• required: Whether the cookie must be present (default true).
• defaultValue: Fallback if cookie is absent.

Type binding: The cookie value is always a String. Spring converts it to the target type (Integer, UUID, etc.) using ConversionService.

Security considerations: Never store sensitive data in cookies unless they are HttpOnly (not accessible via JavaScript) and Secure (only sent over HTTPS). Session identifiers, CSRF tokens, and authentication tokens are common legitimate uses.

vs @RequestHeader("Cookie"): @CookieValue parses the Cookie header and extracts a single named cookie cleanly. @RequestHeader("Cookie") gives you the raw Cookie header string (all cookies concatenated), which you'd have to parse manually.`,
        desc: "Binds the value of an HTTP cookie to a method parameter.",
        code: `@GetMapping("/session-data")
public String getSessionData(
    @CookieValue(value = "sessionId", defaultValue = "none") String sessionId) {

    return sessionService.getData(sessionId);
}`
      },
      {
        n: "@ModelAttribute",
        theory: `@ModelAttribute has two distinct uses that are easy to confuse:

USE 1 — ON A METHOD PARAMETER: Binds incoming request data (query params, form fields, path variables) to an object. Spring populates the object's fields by matching parameter names. This is the classic form-submission binding pattern. Unlike @RequestBody (which reads the full JSON body), @ModelAttribute binds individual request parameters to individual fields.

USE 2 — ON A METHOD: When placed on a method in a @Controller (not on a parameter), that method executes BEFORE every handler method in the controller and its return value is added to the Model. Used to pre-populate the model with common data (reference data like dropdown options, current user, categories) that every view in the controller needs.

Validation: Combine with @Valid for model binding + validation in one step.

Data binding order: For parameter binding, Spring first instantiates the object (default constructor), then populates fields from request data, then validates if @Valid is present.

vs @RequestBody: @RequestBody reads and parses the entire request body as JSON/XML. @ModelAttribute reads form fields or query params and sets them field-by-field. You cannot use both in the same method.`,
        desc: "Binds request data (query params, form fields) to a model object, or adds data to the model before rendering a view.",
        code: `// Bind form data to object
@PostMapping("/register")
public String register(@ModelAttribute UserForm form) {
    userService.register(form);
    return "redirect:/success";
}

// Populate model before all handler methods
@ModelAttribute("categories")
public List<Category> populateCategories() {
    return categoryService.findAll(); // available in all views
}`
      },
    ]
  },
  {
    cat: "Application Bootstrap",
    color: "#3fb950",
    bg: "#122d1f",
    icon: "🚀",
    anns: [
      {
        n: "@SpringBootApplication",
        theory: `@SpringBootApplication is the entry-point meta-annotation of every Spring Boot application. It combines three annotations into one:

1. @Configuration: Marks the class as a source of @Bean definitions for the ApplicationContext.
2. @EnableAutoConfiguration: Tells Spring Boot to automatically configure beans based on what's on the classpath and in application.properties. Spring Boot uses SpringFactoriesLoader to discover all AutoConfiguration classes listed in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.
3. @ComponentScan: Scans the package of the annotated class (and all sub-packages) for @Component, @Service, @Repository, @Controller, etc.

Auto-configuration mechanism: Spring Boot evaluates conditional annotations (@ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty) on each AutoConfiguration class to decide whether to apply it. For example, DataSourceAutoConfiguration only activates when a JDBC driver is on the classpath.

scanBasePackages / scanBasePackageClasses: Override the default scan roots.
exclude / excludeName: Prevent specific auto-configurations from being applied.

Important: Place your main class in the root package of your application. All business packages should be sub-packages of the root so @ComponentScan picks them up automatically.`,
        desc: "The entry-point meta-annotation. Combines @Configuration, @EnableAutoConfiguration, and @ComponentScan. Place it on your main class.",
        code: `@SpringBootApplication
// @SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}`
      },
      {
        n: "@EnableAutoConfiguration",
        theory: `@EnableAutoConfiguration is the Spring Boot magic annotation. It imports AutoConfigurationImportSelector, which scans all JARs on the classpath for META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports files and loads the listed configuration classes — but only those whose @Conditional conditions are met.

The conditional evaluation chain: Each auto-configuration class is typically annotated with multiple conditions:
  @ConditionalOnClass(DataSource.class)    // only if this class is in classpath
  @ConditionalOnMissingBean               // only if user hasn't defined their own
  @ConditionalOnProperty(...)             // only if a property is set

This means you get automatic configuration without any boilerplate for common concerns: DataSource, JPA EntityManagerFactory, Jackson ObjectMapper, DispatcherServlet, Embedded Tomcat, etc.

Customising auto-configuration: You override any auto-configured bean simply by declaring your own @Bean of the same type. Spring's @ConditionalOnMissingBean ensures the auto-configured version backs off when yours is present. This is the "convention over configuration" backbone of Spring Boot.

Debugging: Add --debug to your run command or set debug=true in application.properties to see the auto-configuration report (which configs applied and why, which were skipped).`,
        desc: "Tells Spring Boot to automatically configure the application based on the JARs on the classpath.",
        code: `// Rarely used alone — usually through @SpringBootApplication
@Configuration
@EnableAutoConfiguration(exclude = SecurityAutoConfiguration.class)
public class AppConfig { }`
      },
      {
        n: "@ComponentScan",
        theory: `@ComponentScan instructs Spring to scan specified packages for classes annotated with stereotype annotations (@Component, @Service, @Repository, @Controller, @Configuration, and any meta-annotated with @Component) and register them as beans in the ApplicationContext.

Default behaviour: Without specifying packages, @ComponentScan scans the package of the annotated class and all its sub-packages. This is why the @SpringBootApplication class should be at the root package.

Customisation attributes:
• basePackages: String array of package names to scan ("com.myapp.service").
• basePackageClasses: Type-safe alternative — specify a class in the package you want to scan.
• includeFilters / excludeFilters: Filter which components to include or exclude using annotation type, assignable type, regex, or AspectJ expressions.
• lazyInit: Whether to register all detected beans as lazy-initialized (only created when first requested).
• nameGenerator: Custom BeanNameGenerator for component names.

Multiple scans: You can have multiple @ComponentScan annotations or a @ComponentScans container, or use basePackages with multiple values.

Why you'd customise: Multi-module projects where the main class is in a different package, excluding certain packages from scanning to avoid bean conflicts, or scanning external libraries you don't own.`,
        desc: "Scans specified base packages for @Component, @Service, @Repository, @Controller etc. By default scans the package of the annotated class.",
        code: `@SpringBootApplication
@ComponentScan(basePackages = {
    "com.myapp.controllers",
    "com.myapp.services",
    "com.myapp.utils"
})
public class MyApplication { ... }`
      },
      {
        n: "@Profile",
        theory: `@Profile restricts a bean's registration to specific Spring profiles. Profiles let you define environment-specific configurations without if-else blocks in your code.

How profiles work:
1. You annotate beans with @Profile("dev"), @Profile("prod"), @Profile("!prod") (not prod), etc.
2. You activate profiles via spring.profiles.active property (in application.properties, as a JVM argument -Dspring.profiles.active=dev, or as an environment variable).
3. Spring only registers beans whose profile expression matches the active profiles.
4. Beans without @Profile are always registered.

Profile expressions (Spring 5.1+): Supports logical operators:
• @Profile("dev | test")  — active if dev OR test is active
• @Profile("prod & !debug") — active if prod is active AND debug is NOT active

spring.profiles.default: If no profiles are active, Spring uses the "default" profile. Beans annotated @Profile("default") are registered when no explicit profile is set.

Common use cases: Switch between MockEmailService (dev) and SmtpEmailService (prod), in-memory H2 database (test) vs production PostgreSQL, verbose logging vs minimal logging, Swagger UI (dev) vs disabled (prod).`,
        desc: "Restricts bean registration to specific active Spring profiles. Use spring.profiles.active property to switch profiles.",
        code: `@Service
@Profile("dev")
public class MockEmailService implements EmailService {
    public void send(String to, String body) {
        System.out.println("DEV - Mock email to " + to);
    }
}

@Service
@Profile("prod")
public class SmtpEmailService implements EmailService {
    public void send(String to, String body) {
        smtpClient.sendEmail(to, body);
    }
}`
      },
    ]
  },
  {
    cat: "Exception Handling",
    color: "#f85149",
    bg: "#3d1a18",
    icon: "⚠️",
    anns: [
      {
        n: "@ControllerAdvice / @RestControllerAdvice",
        theory: `@ControllerAdvice is a specialisation of @Component that allows you to write shared exception handling, model attribute binding, and data binding setup code that applies globally across multiple controllers — or all controllers.

How it works: Spring wraps @ControllerAdvice beans in ExceptionHandlerExceptionResolver. When a controller throws an exception, Spring looks for @ExceptionHandler methods first in the controller itself, then in any @ControllerAdvice beans.

@RestControllerAdvice = @ControllerAdvice + @ResponseBody. This means exception handler methods return values that are serialised to JSON/XML, rather than view names. Use this for all REST APIs.

Scope narrowing: By default @ControllerAdvice applies to all controllers. You can narrow scope:
• @ControllerAdvice(assignableTypes = {UserController.class, OrderController.class})
• @ControllerAdvice(annotations = RestController.class)
• @ControllerAdvice(basePackages = "com.myapp.api")

What can go inside @ControllerAdvice (besides @ExceptionHandler):
• @ModelAttribute methods — add data to every controller's model.
• @InitBinder methods — configure data binding/conversion globally.

Priority: If multiple @ControllerAdvice beans define handlers for the same exception, the one with higher @Order or implementing Ordered takes precedence. The controller's own @ExceptionHandler always wins.`,
        desc: "@ControllerAdvice is a global interceptor for all controllers. @RestControllerAdvice adds @ResponseBody so exceptions are serialized to JSON.",
        code: `@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return new ErrorResponse("INTERNAL_ERROR", "Something went wrong");
    }
}`
      },
      {
        n: "@ExceptionHandler",
        theory: `@ExceptionHandler marks a method as an exception handler for one or more exception types. When those exceptions are thrown during request processing, Spring invokes the annotated method instead of propagating the exception.

Placement options:
1. Inside a @Controller or @RestController: handles exceptions only from that specific controller.
2. Inside a @ControllerAdvice: handles exceptions globally across all controllers.

Method signature flexibility: Spring is very flexible about what parameters an @ExceptionHandler method can accept:
• The exception class itself (caught exception is injected).
• HttpServletRequest / HttpServletResponse
• WebRequest or NativeWebRequest
• Locale, TimeZone, ZoneId
• OutputStream / Writer for the response body
• Model
• @SessionAttribute, @RequestAttribute annotated params

Exception hierarchy: @ExceptionHandler({ParentException.class}) catches both the parent and all its subclasses. If you have both a specific handler and a generic Exception handler, Spring selects the most specific one.

Return types: Can return ModelAndView, ResponseEntity<T>, @ResponseBody-annotated value, String view name, or void. ResponseEntity gives the most control (body + status + headers).

Missing @ResponseStatus: If you don't specify a status code via @ResponseStatus or ResponseEntity, the default 200 OK is returned — which is wrong for error responses. Always set the appropriate 4xx or 5xx status.`,
        desc: "Handles specific exception types thrown by controller methods. Can be scoped to one controller or global via @ControllerAdvice.",
        code: `@RestController
@RequestMapping("/api/users")
public class UserController {

    // Local handler — only for this controller
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(404).body("User not found: " + ex.getId());
    }
}`
      },
    ]
  },
  {
    cat: "Environment & Config Values",
    color: "#d29922",
    bg: "#2d2000",
    icon: "⚙️",
    anns: [
      {
        n: "@Value",
        theory: `@Value injects a single value from the Spring Environment (which aggregates application.properties, application.yml, OS environment variables, system properties, and custom PropertySources) into a field, constructor parameter, or method parameter.

The \${} placeholder syntax reads from properties:

@Value("\${server.port}") — reads server.port

@Value("\${timeout:5000}") — reads timeout, falls back to 5000 if missing

The #{} SpEL (Spring Expression Language) syntax evaluates expressions:

@Value("#{systemProperties['user.home']}") — system property

@Value("#{T(java.lang.Math).PI}") — static method/field access

@Value("#{orderService.maxRetries}") — read a property from another bean

@Value("#{'\${csv.values}'.split(',')}") — parse a list from a comma-separated property

When @Value fails: If a \${} placeholder references a key that doesn't exist and no default is provided, Spring throws BeanCreationException at startup — not at runtime.
When to prefer @ConfigurationProperties: If you have more than 2-3 related config values, group them in a @ConfigurationProperties class. It gives you: IDE autocomplete, validation annotations, type-safe binding, refactoring support, and a clear document of all configuration options.`,
        desc: "Injects a single property value from application.properties/yml, environment variables, or a SpEL expression.",
        code: `@Service
public class PaymentService {

    @Value("\${payment.api.url}")
    private String apiUrl;

    @Value("\${payment.timeout:5000}")   // default = 5000 if missing
    private int timeout;

    @Value("#{systemProperties['user.home']}")  // SpEL expression
    private String userHome;

    @Value("#{'\${allowed.origins}'.split(',')}")  // parse list from CSV property
    private List<String> allowedOrigins;
}`
      },
      {
        n: "@ConfigurationProperties",
        theory: `@ConfigurationProperties binds a group of related properties to a strongly-typed POJO using a common prefix. It is the recommended approach for all but the simplest configuration.

How binding works: Spring reads all properties starting with the configured prefix, strips the prefix, converts the remaining key to camelCase (hyphen-separated kebab-case is auto-converted — pool-size binds to poolSize), and sets the POJO's fields using setters or constructor binding.

Constructor binding (Spring Boot 2.2+): Annotate with @ConstructorBinding to bind via the constructor instead of setters — the bound object becomes immutable, which is ideal for configuration.

Registration: You must either:
• Annotate with @Component (makes it a bean automatically).
• Annotate with @EnableConfigurationProperties(DatabaseProperties.class) on a @Configuration class.
• Use @ConfigurationPropertiesScan on your main class.

Validation: Combine with @Validated and Jakarta Bean Validation annotations (@NotBlank, @Min, @Max, @URL, etc.) to validate config at startup. Missing or invalid config is caught before the app finishes starting.

IDE support: Add spring-boot-configuration-processor to your build to generate metadata. IDEs use this for autocomplete and documentation in application.properties/yml.`,
        desc: "Binds a whole group of properties (by prefix) to a POJO. Preferred over @Value for complex config — supports validation, lists, maps, and nested objects.",
        code: `@ConfigurationProperties(prefix = "database.primary")
@Validated
public class DatabaseProperties {

    @NotBlank
    private String url;

    private String username;

    @Min(1) @Max(100)
    private int poolSize = 10;

    // getters & setters
}

@Service
public class DataService {
    private final DatabaseProperties dbProps;

    public DataService(DatabaseProperties dbProps) {
        this.dbProps = dbProps;
    }
}`
      },
      {
        n: "@PropertySource",
        theory: `@PropertySource adds a custom .properties file to the Spring Environment. This extends the default property sources (application.properties, command-line args, env vars) with additional files.

When to use: You have environment-specific secrets (vault properties), third-party library config, or modular config files (kafka.properties, redis.properties) that you want to keep separate from the main application.properties.

Evaluation order: Properties from @PropertySource are added to the Environment but have lower priority than application.properties by default. To override application.properties, you must explicitly control the PropertySource order using the Environment API or @Order.

Multiple @PropertySource: Stack multiple annotations (or use @PropertySources container). Each adds its file to the Environment. Files are loaded in declaration order.

classpath: vs file: prefix:
• classpath:kafka.properties — loaded from the classpath (inside the JAR or on the class path).
• file:/etc/myapp/secrets.properties — loaded from the filesystem at an absolute path.
• file:\${user.home}/app.properties — supports SpEL placeholders in the location.

Ignoring missing files: Add ignoreResourceNotFound = true to prevent startup failure if the file doesn't exist — useful for optional override files.`,
        desc: "Loads a custom .properties file into the Spring Environment. Useful for externalized config not in the default application.properties.",
        code: `@Configuration
@PropertySource("classpath:kafka.properties")
@PropertySource(value = "file:/etc/myapp/secrets.properties",
                ignoreResourceNotFound = true)
public class KafkaConfig {

    @Value("\${kafka.bootstrap-servers}")
    private String bootstrapServers;
}`
      },
      {
        n: "@Conditional variants",
        theory: `Spring's @Conditional family lets you conditionally register beans — a bean is only created if its condition evaluates to true. This is the backbone of Spring Boot auto-configuration.

Core annotation: @Conditional(MyCondition.class) accepts a Condition interface implementation. The condition's matches() method receives the application context and can inspect the environment, classpath, and existing beans.

Built-in variants (Spring Boot):

@ConditionalOnClass / @ConditionalOnMissingClass:
  Activates when a specific class IS / IS NOT on the classpath. Used to configure beans only when a library is present (e.g., only set up Redis beans when the Lettuce library is present).

@ConditionalOnBean / @ConditionalOnMissingBean:
  Activates when a bean of the specified type IS / IS NOT already in the context. @ConditionalOnMissingBean is heavily used in auto-configuration so user-defined beans take precedence.

@ConditionalOnProperty:
  Activates when a property key exists and (optionally) has a specific value. The matchIfMissing attribute controls behaviour when the property is absent.

@ConditionalOnExpression:
  Activates when a SpEL expression evaluates to true. Flexible but harder to read.

@ConditionalOnWebApplication / @ConditionalOnNotWebApplication:
  Activates only in a web (servlet or reactive) context or in a non-web context.

Ordering matters: Conditions are evaluated during bean definition phase. @ConditionalOnMissingBean relies on the bean not existing at evaluation time — order your configurations carefully.`,
        desc: "Control bean registration based on conditions. Widely used in auto-configuration. @ConditionalOnProperty activates a bean when a property is set; @ConditionalOnMissingBean prevents overriding user-defined beans.",
        code: `// Active only when feature flag is true
@Bean
@ConditionalOnProperty(name = "feature.cache.enabled", havingValue = "true")
public CacheManager redisCacheManager() {
    return new RedisCacheManager(...);
}

// Fallback — only if no CacheManager defined by the user
@Bean
@ConditionalOnMissingBean(CacheManager.class)
public CacheManager simpleCacheManager() {
    return new ConcurrentMapCacheManager("default");
}

// Only if a class is on the classpath
@Bean
@ConditionalOnClass(RedisClient.class)
public RedisService redisService() { ... }`
      },
    ]
  },
  {
    cat: "Model / DTO / Validation",
    color: "#58a6ff",
    bg: "#1a2d4a",
    icon: "📦",
    anns: [
      {
        n: "@Valid / @Validated",
        theory: `@Valid (jakarta.validation.Valid) and @Validated (org.springframework.validation.annotation.Validated) both trigger Bean Validation but have important differences.

@Valid:
• Standard Jakarta Bean Validation annotation.
• Can be placed on method parameters, fields, and return types.
• Triggers validation recursively — if a field is itself a complex object annotated with @Valid, its fields are validated too (cascading validation).
• Does NOT support validation groups.

@Validated:
• Spring's own annotation.
• Can be placed on classes (enabling method-level validation via AOP) as well as parameters.
• Supports validation groups: @Validated(Create.class) runs only the constraints in the Create group.
• Required at the class level to enable @Valid / @Validated on service method parameters (not just controllers).

Where validation errors go:
• In controllers: if validation fails, Spring throws MethodArgumentNotValidException (for @RequestBody) or ConstraintViolationException (for other parameters). Both result in HTTP 400.
• Add BindingResult immediately after the validated parameter to intercept errors manually instead of throwing.
• In @ControllerAdvice: handle MethodArgumentNotValidException globally to return a structured error response.

Constraint annotations: @NotNull, @NotBlank, @NotEmpty, @Size, @Min, @Max, @Email, @Pattern, @Positive, @Future, @Past — these come from jakarta.validation.constraints and hibernate-validator.`,
        desc: "@Valid triggers Jakarta Bean Validation on a method parameter. @Validated additionally supports validation groups and class-level method validation.",
        code: `public class CreateUserDto {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email")
    @NotBlank
    private String email;

    @Min(18) @Max(120)
    private int age;
}

@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping
    public User create(@Valid @RequestBody CreateUserDto dto,
                       BindingResult result) {
        if (result.hasErrors()) {
            throw new ValidationException(result.getAllErrors());
        }
        return userService.create(dto);
    }
}`
      },
      {
        n: "Jackson Annotations (@JsonProperty, @JsonIgnore, @JsonInclude)",
        theory: `Jackson annotations control how Java objects are serialised to JSON and deserialised from JSON. They are used with Spring's MappingJackson2HttpMessageConverter, which is the default JSON converter.

@JsonProperty(value):
Renames a field in JSON output/input. The Java field name and JSON key name are decoupled. Also ensures the field is included in serialisation even if it would otherwise be excluded (e.g., if it starts with "is" and Jackson misidentifies it).

@JsonIgnore:
Completely excludes a field from both serialisation and deserialisation. Use for sensitive data (passwords, tokens), internal fields, or circular references. Can be placed on the field, getter, or setter.
@JsonIgnoreProperties({"field1","field2"}) on the class is the bulk alternative.

@JsonInclude:
Controls when a field is included in serialisation output:
• NON_NULL: skip if null.
• NON_EMPTY: skip if null, empty string, empty collection, etc.
• ALWAYS (default): always include.
• NON_DEFAULT: skip if value equals the Java default for that type.

@JsonAlias: Accept multiple JSON key names on deserialisation (useful for API versioning or external API inconsistencies).

@JsonSerialize / @JsonDeserialize: Plug in custom serialisers/deserialisers for specific types (custom date formats, Money types, enums).

@JsonManagedReference / @JsonBackReference: Solve bidirectional relationship infinite recursion (parent contains child which contains parent).`,
        desc: "Control JSON serialization/deserialization. @JsonProperty renames fields, @JsonIgnore excludes them, @JsonInclude conditionally includes them.",
        code: `@JsonInclude(JsonInclude.Include.NON_NULL)  // skip null fields in output
public class UserDto {

    @JsonProperty("user_id")        // JSON key is "user_id", Java field is "id"
    private Long id;

    @JsonIgnore                     // never included in JSON output
    private String password;

    // Accept both "email" and "emailAddress" on deserialization
    @JsonAlias({"emailAddress", "email_addr"})
    private String email;
}`
      },
    ]
  },
  {
    cat: "ObjectMapper (Jackson)",
    color: "#3fb950",
    bg: "#0f2a18",
    icon: "🔄",
    anns: [
      {
        n: "ObjectMapper configuration",
        theory: `ObjectMapper is the central Jackson class for all JSON operations — serialisation (Java → JSON), deserialisation (JSON → Java), and tree model manipulation.

Why configure it as a Spring Bean: Spring Boot auto-configures an ObjectMapper, but you often need to customise it. Declaring your own @Bean ObjectMapper (or a Jackson2ObjectMapperBuilderCustomizer) replaces or customises the auto-configured one. It is then injected into every HttpMessageConverter and MappingJackson2HttpMessageConverter in the application — affecting all JSON requests and responses.

Key configuration options:
• FAIL_ON_UNKNOWN_PROPERTIES: Default true. Set to false so that extra JSON keys from external APIs don't cause deserialisation failure — crucial for forward compatibility.
• WRITE_DATES_AS_TIMESTAMPS: Set to false with JavaTimeModule to write LocalDateTime as "2025-01-15T10:30:00" instead of a numeric timestamp.
• PropertyNamingStrategies.SNAKE_CASE: Automatically maps camelCase Java fields to snake_case JSON and vice versa — no need for @JsonProperty on every field.
• NON_NULL serialisation inclusion: Skip null fields globally instead of annotating every DTO.
• JavaTimeModule: Required for Java 8+ date/time types (LocalDate, LocalDateTime, ZonedDateTime, Instant). Without it, Jackson cannot handle them.

Thread safety: ObjectMapper is thread-safe once configured. Always use a single shared instance (which Spring's bean management handles for you).`,
        desc: "ObjectMapper is Jackson's main class for JSON conversion. Configure it as a Spring Bean to customize serialization globally — date formats, naming strategies, null handling, etc.",
        code: `@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
            .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
            .addModule(new JavaTimeModule())
            .serializationInclusion(JsonInclude.Include.NON_NULL)
            .build();
    }
}`
      },
    ]
  },
  {
    cat: "Service / Business Logic",
    color: "#3fb950",
    bg: "#0f2a18",
    icon: "🛠️",
    anns: [
      {
        n: "@Service",
        theory: `@Service is a specialisation of @Component that semantically marks a class as belonging to the service layer — the layer containing business logic, orchestration, and use cases.

Functionally, @Service is identical to @Component: both cause the class to be detected by component scanning and registered as a bean. The difference is purely semantic — it communicates the architectural role of the class to developers and tools.

Service layer responsibilities:
• Business logic and rules.
• Transaction boundaries (@Transactional belongs here, not in controllers or repositories).
• Orchestration: calling multiple repositories or external services.
• Validation beyond simple field checks.
• Events: publishing ApplicationEvents.

Constructor injection (preferred): Always inject dependencies via the constructor, not field injection. Constructor injection makes dependencies explicit, enables immutable fields, and makes the class testable without Spring (just call new MyService(mockRepo)).

AOP proxy: Like all Spring beans, @Service classes are wrapped in a Spring AOP proxy. This is what makes @Transactional, @Async, @Cacheable, etc. work — they are implemented as proxy interceptors around the bean's methods.

Layered architecture: @Controller → @Service → @Repository. The service layer isolates business logic from HTTP concerns (controllers) and persistence concerns (repositories), making each independently testable.`,
        desc: "Semantic specialization of @Component for the service layer. Marks classes containing business logic. Spring detects it during component scanning.",
        code: `@Service
@Slf4j
public class OrderService {

    private final OrderRepository repo;
    private final EmailService emailService;

    public OrderService(OrderRepository repo, EmailService emailService) {
        this.repo = repo;
        this.emailService = emailService;
    }

    public Order placeOrder(OrderRequest request) {
        Order order = new Order(request);
        Order saved = repo.save(order);
        log.info("Order {} placed for customer {}", saved.getId(), request.getCustomerId());
        emailService.sendConfirmation(saved);
        return saved;
    }
}`
      },
      {
        n: "@Transactional",
        theory: `@Transactional wraps the annotated method (or all methods of an annotated class) in a database transaction. If the method completes normally, the transaction is committed. If a RuntimeException (or any exception specified by rollbackFor) is thrown, the transaction is rolled back.

How it works via AOP proxy: Spring creates a proxy around the bean. When a @Transactional method is called through the proxy, the proxy intercepts the call, opens a transaction (or reuses the existing one based on propagation), invokes the real method, then commits or rolls back.

Self-invocation gotcha: If a method within the same class calls another @Transactional method directly (not through the proxy), the transaction annotation on the inner method is IGNORED. This is the single most common @Transactional bug. Fix: inject the bean into itself via @Autowired or refactor into a separate class.

PROPAGATION LEVELS:
• REQUIRED (default): Join existing transaction; create new if none exists. Most common.
• REQUIRES_NEW: Always create a new transaction, suspending the current one. Useful for audit logging that must commit independently.
• SUPPORTS: Join if exists; run without transaction if not. For read-only methods that should work in both transactional and non-transactional contexts.
• MANDATORY: Must run within an existing transaction; throw if none. Enforces that callers are responsible for transaction management.
• NOT_SUPPORTED: Suspend current transaction; run without one.
• NEVER: Must NOT run within a transaction; throw if one exists.
• NESTED: Create a savepoint within the current transaction; rollback to savepoint on failure without rolling back the outer transaction.

ISOLATION LEVELS:
• READ_COMMITTED (default in most DBs): Prevents dirty reads. Can have non-repeatable reads.
• REPEATABLE_READ: Same data for repeated reads within the transaction.
• SERIALIZABLE: Full isolation; highest correctness, lowest concurrency.
• READ_UNCOMMITTED: Allows dirty reads; rarely used.

rollbackFor / noRollbackFor: By default only RuntimeException and Error trigger rollback. Checked exceptions do NOT. Use rollbackFor = {IOException.class} to rollback on checked exceptions.

readOnly = true: Hint to the persistence provider (Hibernate) to skip dirty checking — can improve read performance. Does NOT enforce read-only at the DB level in all databases.`,
        desc: "Wraps a method or class in a database transaction. Rolls back on exception. Supports propagation and isolation levels.",
        code: `@Service
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepo.findById(fromId).orElseThrow();
        Account to   = accountRepo.findById(toId).orElseThrow();
        from.debit(amount);
        to.credit(amount);
        accountRepo.save(from);
        accountRepo.save(to);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(String event) {
        auditRepo.save(new AuditLog(event)); // committed independently
    }

    @Transactional(readOnly = true)
    public List<Account> getAccounts() {
        return accountRepo.findAll();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Report generateReport() { ... }
}`
      },
      {
        n: "@Async",
        theory: `@Async marks a method to run asynchronously in a separate thread from a configured thread pool. The caller's thread returns immediately without waiting for the method to complete.

How it works: Like @Transactional, @Async is implemented via AOP proxy. When the proxy intercepts a call to an @Async method, it submits the method execution as a task to the configured Executor (thread pool) and returns immediately. The same self-invocation limitation applies — calling an @Async method within the same class bypasses the proxy.

Return types:
• void: Fire and forget. Caller never gets the result.
• Future<T>: Caller can call future.get() to block and retrieve the result.
• CompletableFuture<T>: The modern choice. Non-blocking chaining, error handling, combining multiple futures.
• ListenableFuture<T>: Spring's version (deprecated in Spring 6).

@EnableAsync: Must be placed on a @Configuration class. Without it, @Async is silently ignored.

Custom Executor: By default Spring uses a SimpleAsyncTaskExecutor which creates a new thread per task — never use this in production. Define a ThreadPoolTaskExecutor bean and use @Async("myExecutorBeanName") to direct async tasks to it.

Exception handling: Exceptions thrown in void @Async methods are swallowed unless you configure an AsyncUncaughtExceptionHandler via AsyncConfigurer. For Future/CompletableFuture return types, exceptions are wrapped and rethrown when get() is called.

Thread context: The executing thread is a different thread from the caller. ThreadLocal values (security context, request context) are NOT automatically propagated unless you configure a DelegatingSecurityContextAsyncTaskExecutor or similar wrapper.`,
        desc: "Executes a method asynchronously in a thread pool. Caller doesn't wait. Return CompletableFuture<T> for the result. Requires @EnableAsync.",
        code: `@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(5);
        exec.setMaxPoolSize(20);
        exec.setQueueCapacity(500);
        exec.setThreadNamePrefix("async-");
        exec.initialize();
        return exec;
    }
}

@Service
public class ReportService {

    @Async
    public CompletableFuture<Report> generateHeavyReport(Long userId) {
        Report report = buildReport(userId);
        return CompletableFuture.completedFuture(report);
    }
}`
      },
      {
        n: "@Scheduled",
        theory: `@Scheduled marks a method to be executed on a schedule — periodically or at specific times. It is Spring's built-in task scheduling, equivalent to a cron job inside your application.

Requires @EnableScheduling on a @Configuration class. Without it, @Scheduled annotations are silently ignored.

Scheduling modes:
• cron: Standard cron expression — 6 fields: second minute hour day-of-month month day-of-week. Evaluates against a timezone (use zone attribute). Examples: "0 0 2 * * *" = 2 AM daily; "0 */15 * * * *" = every 15 minutes; "0 0 9-17 * * MON-FRI" = every hour 9-5 on weekdays.

• fixedRate: Execute every N milliseconds from the START time of the previous execution. If the task takes longer than the rate, executions stack up (or are queued if there's only one thread). Use TimeUnit.SECONDS.toMillis(30) for readability or fixedRateString = "\${my.rate.ms}" to externalise.

• fixedDelay: Wait N milliseconds after the PREVIOUS execution COMPLETES before starting the next. Guarantees minimum gap between executions. Safer for tasks that shouldn't overlap.

• initialDelay: Wait this many milliseconds before the first execution. Useful to let the application fully start up before scheduled tasks begin.

Threading model: By default Spring uses a single-threaded scheduler. Multiple @Scheduled methods share the same thread — if one blocks, others are delayed. Configure a TaskScheduler bean with multiple threads for independent execution.

Distributed scheduling: @Scheduled runs on EVERY application instance in a cluster. For jobs that should run only once across all instances, use ShedLock or Spring Batch scheduled jobs.`,
        desc: "Schedules a method to run periodically. Supports cron, fixedRate, and fixedDelay. Requires @EnableScheduling.",
        code: `@Configuration
@EnableScheduling
public class SchedulingConfig { }

@Component
public class ScheduledTasks {

    // Every day at 2:30 AM
    @Scheduled(cron = "0 30 2 * * *")
    public void cleanupExpiredSessions() {
        sessionService.deleteExpired();
    }

    // Every 5 seconds from START time of previous run
    @Scheduled(fixedRate = 5000)
    public void pollExternalApi() {
        apiPoller.poll();
    }

    // Wait 10s after previous run COMPLETES
    @Scheduled(fixedDelay = 10000, initialDelay = 5000)
    public void syncInventory() {
        inventoryService.sync();
    }
}`
      },
    ]
  },
  {
    cat: "Beans & Dependency Injection",
    color: "#a5d6ff",
    bg: "#1a2d4a",
    icon: "🔌",
    anns: [
      {
        n: "@Component / @Bean",
        theory: `@Component and @Bean are both ways to register objects as Spring beans (objects managed by the ApplicationContext), but they differ fundamentally in how and where they are used.

@Component (class-level, auto-discovered):
Placed on a class. Spring's component scan detects it and automatically registers the class as a bean. The bean name defaults to the class name with lowercase first letter (FileStorageService → fileStorageService).
• @Service, @Repository, @Controller, @RestController, @Configuration are all @Component specialisations with semantic meaning.
• Use when you own the class and it fits the stereotype roles.

@Bean (method-level, explicit):
Placed on a method inside a @Configuration class. The method return value is registered as a bean. You have full programmatic control over creation — you can call constructors with specific arguments, set properties, return different implementations based on conditions, etc.
• Use when you DON'T own the class (third-party library — you can't add @Component to RestTemplate or ObjectMapper).
• Use for complex creation logic that can't be expressed with constructor injection alone.
• The method name is the default bean name.

Scope and proxy: @Configuration classes are CGLIB-proxied. Calling one @Bean method from another inside the same @Configuration class returns the SAME singleton bean (Spring intercepts the call). Without @Configuration (using @Component instead), @Bean methods are not proxied — each call creates a new instance.

lite mode vs full mode: @Bean inside a plain @Component class is "lite mode" — no proxying, each method call creates a new instance. Use @Configuration for singleton @Bean methods.`,
        desc: "@Component is discovered by component scanning. @Bean is a method-level annotation inside @Configuration for programmatic bean creation of third-party classes.",
        code: `// @Component — class-level, auto-discovered
@Component
public class FileStorageService {
    public void store(MultipartFile file) { ... }
}

// @Bean — method-level, explicit wiring for third-party classes
@Configuration
public class AppBeans {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate rt = new RestTemplate();
        rt.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return rt;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}`
      },
      {
        n: "@Autowired / @Qualifier / @Primary",
        theory: `These three annotations work together to resolve Spring's dependency injection.

@Autowired:
Triggers Spring to inject a matching bean into the annotated field, constructor, or setter. Spring matches by TYPE first. If multiple beans of the same type exist, it tries to match by name (the field name must match the bean name).

Placement options:
• Constructor injection (preferred — makes dependencies explicit and enables immutability).
• Field injection (convenient but hard to test — requires reflection to inject in tests).
• Setter injection (useful for optional dependencies).
• Since Spring 4.3, @Autowired is optional on constructors if the class has exactly one constructor.

@Qualifier("beanName"):
When multiple beans of the same type exist, @Qualifier disambiguates by specifying the exact bean name. Must be combined with @Autowired.

@Primary:
Marks one bean as the "default" when multiple candidates of the same type exist. When Spring needs to inject a NotificationService and both EmailNotificationService and SmsNotificationService exist, the @Primary one is chosen unless @Qualifier overrides it.

required = false: @Autowired(required = false) makes the injection optional — Spring won't throw NoSuchBeanDefinitionException if no matching bean exists. The injected field remains null.

Best practice: ALWAYS use constructor injection. @Autowired on the constructor makes all dependencies visible, enables final fields (immutability), and makes unit testing easy — just use new MyService(mockDep1, mockDep2).`,
        desc: "@Autowired injects dependencies. @Qualifier selects among multiple beans of the same type. @Primary marks the default bean when multiple candidates exist.",
        code: `@Service
@Primary
public class EmailNotificationService implements NotificationService { ... }

@Service
@Qualifier("sms")
public class SmsNotificationService implements NotificationService { ... }

@Service
public class AlertService {

    private final NotificationService notifier;
    private final NotificationService smsNotifier;

    @Autowired
    public AlertService(
            NotificationService notifier,             // gets @Primary (Email)
            @Qualifier("sms") NotificationService smsNotifier) {
        this.notifier    = notifier;
        this.smsNotifier = smsNotifier;
    }
}`
      },
      {
        n: "@Scope",
        theory: `@Scope defines the lifecycle and visibility of a Spring bean — how many instances are created and for how long each one lives.

Built-in scopes:

SINGLETON (default): One instance per ApplicationContext. All injections of this bean share the same object. This is the most common scope. The instance is created at context startup (unless lazy) and destroyed when the context shuts down.

PROTOTYPE: A new instance is created every time the bean is requested (every injection, every getBean() call). Spring creates it and injects dependencies, but does NOT manage its destruction — @PreDestroy is NOT called. Caller is responsible for cleanup.

REQUEST (Web): One instance per HTTP request. Created at the start of the request, destroyed at the end. Each thread handling a different HTTP request gets its own instance.

SESSION (Web): One instance per HTTP session. Lives as long as the user's session. Useful for user-specific state like shopping carts.

APPLICATION (Web): One instance per ServletContext — basically singleton for web apps.

WEBSOCKET: One instance per WebSocket session.

Scoped proxy (proxyMode): When a shorter-scoped bean (request/prototype/session) is injected into a longer-scoped bean (singleton), you need a scoped proxy. Without it, the singleton would hold a reference to the instance created at injection time (before any request exists). With proxyMode = ScopedProxyMode.TARGET_CLASS, Spring injects a proxy that delegates to the correct scoped instance at runtime.`,
        desc: "Controls the bean lifecycle. singleton=one instance per context, prototype=new instance per injection, request/session=web-scoped.",
        code: `@Component
@Scope("prototype")
public class ReportBuilder {
    private final List<String> lines = new ArrayList<>();
    public void addLine(String line) { lines.add(line); }
    public String build() { return String.join("\n", lines); }
}

// request-scoped — one per HTTP request
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST,
       proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    private String correlationId = UUID.randomUUID().toString();
}`
      },
      {
        n: "@PostConstruct / @PreDestroy",
        theory: `@PostConstruct and @PreDestroy are Jakarta EE lifecycle callback annotations (not Spring-specific) that integrate with Spring's bean lifecycle.

@PostConstruct:
Annotates a method that is called AFTER dependency injection is complete but BEFORE the bean is put into service. Runs once per bean instance.

When to use:
• Validate injected configuration (fail fast if something is wrong).
• Initialise in-memory caches or warm-up operations.
• Establish connections that require injected config values.
• Start background threads or register listeners.

Why not in the constructor: At constructor time, injected fields are NOT yet set (constructor injection is the exception — fields are set BY the constructor). @PostConstruct runs after all injection is complete.

@PreDestroy:
Annotates a method that is called just BEFORE the bean is removed from the ApplicationContext — either on graceful shutdown or when the context is closed.

When to use:
• Close database connections or thread pools.
• Flush caches or buffers.
• Deregister from external systems.
• Clean up temporary files.

Important caveat: @PreDestroy is only called for singleton beans. Prototype beans are not tracked by Spring — their @PreDestroy methods are never called. For cleanup of prototype beans, implement DisposableBean or use a custom destruction logic.

Alternative: @Bean(initMethod = "init", destroyMethod = "cleanup") achieves the same for @Bean-declared beans.`,
        desc: "@PostConstruct runs after all dependencies are injected. @PreDestroy runs before the bean is destroyed. Jakarta annotations that hook into Spring's lifecycle.",
        code: `@Service
public class CacheWarmupService {

    private final CacheManager cacheManager;
    private final ProductRepository repo;

    public CacheWarmupService(CacheManager cacheManager, ProductRepository repo) {
        this.cacheManager = cacheManager;
        this.repo = repo;
    }

    @PostConstruct
    public void warmCache() {
        repo.findTop100ByOrderBySalesDesc()
            .forEach(p -> cacheManager.getCache("products").put(p.getId(), p));
    }

    @PreDestroy
    public void cleanup() {
        cacheManager.getCache("products").clear();
        System.out.println("Cache cleared on shutdown");
    }
}`
      },
      {
        n: "Spring Bean Lifecycle (Full Sequence)",
        theory: `The bean lifecycle is the exact sequence of steps Spring performs to turn a class definition into a fully usable, managed object, and eventually tear it down. Interviewers love this because it explains WHY annotations like @PostConstruct exist and WHEN injected fields become safe to use.

Full sequence for a singleton bean:
1. Bean definition loading — Spring reads @Component/@Bean/XML definitions and builds a BeanDefinition (metadata: class, scope, dependencies) in the BeanDefinitionRegistry. No objects exist yet.
2. BeanFactoryPostProcessor hooks run — these operate on BEAN DEFINITIONS (metadata) before any bean is instantiated. Example: PropertySourcesPlaceholderConfigurer resolves \${...} placeholders in bean definitions.
3. Instantiation — Spring calls the constructor (constructor injection happens here — dependencies must already exist, triggering their own lifecycle recursively).
4. Populate properties — field/setter injection happens here (@Autowired on fields/setters runs after construction, unlike constructor injection).
5. Aware interfaces invoked (if implemented) — BeanNameAware.setBeanName(), BeanFactoryAware.setBeanFactory(), ApplicationContextAware.setApplicationContext(). Gives the bean access to Spring infrastructure it wouldn't get via normal DI.
6. BeanPostProcessor#postProcessBeforeInitialization — runs for EVERY bean. This is how @Autowired, @Value, and @Configuration proxying, and @Async/@Transactional proxy-wrapping actually get implemented internally.
7. @PostConstruct / InitializingBean.afterPropertiesSet() / custom init-method — in that order if more than one is present.
8. BeanPostProcessor#postProcessAfterInitialization — this is where AOP proxies (for @Transactional, @Cacheable, @Async) are actually created, wrapping the raw bean in a proxy. This is why the object you get back from Spring can be a different object (a proxy) than the one your constructor built.
9. Bean is ready — placed in the singleton cache, available for injection.
10. Shutdown — on context close: @PreDestroy / DisposableBean.destroy() / custom destroy-method run, in that order, for singleton beans only.

Key interview insight: BeanFactoryPostProcessor operates on definitions/metadata (step 2); BeanPostProcessor operates on live bean instances (steps 6 & 8). Confusing these two is the most common mistake. Also: AOP proxying is NOT magic — it's a BeanPostProcessor (AnnotationAwareAspectJAutoProxyCreator) wrapping your bean after initialization, which is exactly why calling a @Transactional method from ANOTHER method in the SAME class bypasses the proxy and the transaction doesn't apply (self-invocation problem).`,
        desc: "Definition loading → BeanFactoryPostProcessor (metadata) → constructor → property injection → Aware callbacks → BeanPostProcessor before → @PostConstruct → BeanPostProcessor after (AOP proxies created here) → ready → @PreDestroy on shutdown.",
        code: `@Component
public class LifecycleDemoBean implements
        BeanNameAware, ApplicationContextAware, InitializingBean, DisposableBean {

    @Value("\${app.name}")
    private String appName;   // step 4: property injection

    @Override
    public void setBeanName(String name) {
        System.out.println("5. Aware: bean name = " + name);
    }

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        System.out.println("5. Aware: context injected");
    }

    @PostConstruct
    public void postConstruct() {
        System.out.println("7a. @PostConstruct — appName=" + appName);
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("7b. InitializingBean.afterPropertiesSet()");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("10a. @PreDestroy");
    }

    @Override
    public void destroy() {
        System.out.println("10b. DisposableBean.destroy()");
    }
}

// A custom BeanPostProcessor — runs for every bean, before and after init
@Component
public class TimingBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("Before init: " + beanName);
        return bean; // must return the bean (or a wrapped/proxied version)
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("After init: " + beanName);
        return bean; // AOP proxies get created by returning a proxy here
    }
}`
      },
      {
        n: "@Lazy",
        theory: `By default, singleton beans are eagerly instantiated at ApplicationContext startup — every singleton is created, wired, and initialised before the application is ready to serve traffic. @Lazy changes this: the bean is only created the first time it is actually requested (injected somewhere and that injection point is used, or fetched via getBean()).

Where it can be applied:
• On a @Component/@Bean/@Configuration class — that bean is created on first use instead of at startup.
• On an @Autowired injection point — Spring injects a CGLIB proxy immediately, but the REAL bean behind it is only created the first time a method is called on the proxy.
• Globally via spring.main.lazy-initialization=true in application.properties — makes ALL beans lazy application-wide (faster startup, useful for local dev, but defers config errors to runtime and can hide startup problems).

Why use it:
• Faster application startup when a bean is expensive to create (e.g., loads a large ML model) but rarely used.
• Breaking certain circular dependency situations that field/setter injection can't otherwise resolve.
• Reducing unnecessary bean creation for optional/rarely-used features.

Trade-off (interview trap): Lazy beans defer failures. If a lazily-initialised bean has a misconfiguration, you won't find out at startup (fail-fast is lost) — you'll get a runtime exception the first time it's actually used, possibly in production traffic. This is why @Lazy is used selectively, not globally, in most production systems.`,
        desc: "Defers bean creation until first use instead of at context startup. Useful for expensive beans or breaking circular dependencies, at the cost of losing fail-fast startup validation.",
        code: `@Lazy
@Component
public class ExpensiveMlModelLoader {
    public ExpensiveMlModelLoader() {
        System.out.println("Loading 2GB model into memory...");
        // only runs when first actually needed, not at startup
    }
}

@Service
public class PredictionService {

    private final ExpensiveMlModelLoader loader;

    // Spring injects a proxy immediately; real object built on first call
    public PredictionService(@Lazy ExpensiveMlModelLoader loader) {
        this.loader = loader;
    }
}`
      },
      {
        n: "@DependsOn",
        theory: `@DependsOn forces Spring to initialise one or more specified beans BEFORE the annotated bean, even when there is no direct field/constructor dependency between them that Spring's DI graph would normally detect.

Why it's needed: Spring normally figures out creation order automatically from constructor/field dependencies. But sometimes a bean depends on another bean's SIDE EFFECT rather than its reference — for example, a bean that needs a database driver to already be registered, or a JDBC DataSource pool that must be initialised before a cache warms up, with no actual object reference passed between them.

Also affects shutdown order: beans declared with @DependsOn are destroyed AFTER the bean that depends on them, preserving the correct teardown sequence.

Common real use cases:
• Ensuring a Flyway/Liquibase migration bean runs before a repository bean that assumes the schema already exists.
• Ordering initialisation of JMS/Kafka listener containers relative to registry beans.
• Legacy static initialisers or JDBC driver registration beans.

Caveat: @DependsOn is a code smell if overused — it usually signals a hidden dependency that would be cleaner expressed as an actual object reference (constructor injection). Prefer real dependencies where possible; reach for @DependsOn only for side-effect-based ordering.`,
        desc: "Forces explicit bean creation (and destruction) ordering when there's no direct object reference between beans, only a side-effect dependency.",
        code: `@Component
public class DatabaseMigrationRunner {
    public DatabaseMigrationRunner() {
        System.out.println("Running Flyway migrations...");
    }
}

@Component
@DependsOn("databaseMigrationRunner")   // must run AFTER migrations
public class ReportingRepository {
    public ReportingRepository() {
        System.out.println("Repository ready — schema guaranteed to exist");
    }
}`
      },
      {
        n: "Circular Dependency Resolution",
        theory: `A circular dependency is when bean A needs bean B, and bean B needs bean A (directly or through a longer chain). Understanding how — and whether — Spring resolves this is a very common interview question.

Field/setter injection (works, via early bean exposure):
Spring's singleton creation uses a three-level cache system:
1. singletonObjects — fully created beans.
2. earlySingletonObjects — raw, not-yet-fully-initialised bean instances (or their early proxy reference).
3. singletonFactories — factories that can produce the early reference, allowing AOP proxies to be resolved correctly even mid-creation.

When creating bean A, Spring instantiates it (constructor done), then BEFORE populating its properties, exposes an "early reference" to A in the third-level cache. When B is created and needs A, Spring finds this early reference and injects it — even though A isn't fully initialised (its own fields aren't set yet) — because with field/setter injection, dependency resolution happens by reference, not by value at construction time. By the time anyone actually CALLS a method on A, both objects have finished full initialisation.

Constructor injection (fails, throws BeanCurrentlyInCreationException):
Constructor injection requires ALL constructor arguments to be fully resolved BEFORE the object can be constructed at all — there is no "early reference" possible because the object doesn't exist yet. A needs B's constructor argument, B needs A's constructor argument — deadlock. Spring detects this and fails fast at startup rather than looping forever.

How to actually fix it (the early-reference trick is a mechanism, not a recommended pattern):
• Best: redesign — circular dependencies usually indicate two responsibilities that should be merged, or a missing third class both should depend on.
• @Lazy on one of the constructor parameters — injects a proxy, breaking the immediate resolution requirement.
• Switch one side to setter/field injection.
• Use ApplicationContext.getBean() manually inside a method (not the constructor) as a last resort.

Interview one-liner: "Spring CAN resolve circular dependencies with field injection via its early-reference cache, but CANNOT with pure constructor injection, and will throw BeanCurrentlyInCreationException — which is actually a feature, because it forces you to notice a design problem instead of silently limping along."`,
        desc: "Field/setter injection: Spring resolves circular deps via an early-reference singleton cache. Constructor injection: impossible to resolve, throws BeanCurrentlyInCreationException at startup — a signal to redesign or use @Lazy.",
        code: `// FAILS at startup: BeanCurrentlyInCreationException
@Service
public class OrderService {
    public OrderService(PaymentService paymentService) { ... }
}

@Service
public class PaymentService {
    public PaymentService(OrderService orderService) { ... } // circular!
}

// FIX 1 — break the cycle with @Lazy (injects a proxy)
@Service
public class PaymentService {
    public PaymentService(@Lazy OrderService orderService) { ... }
}

// FIX 2 — better: extract shared logic into a third bean
@Service
public class OrderPaymentCoordinator {
    private final OrderService orderService;
    private final PaymentService paymentService;
    // both depend on coordinator's callers, not on each other
}`
      },
      {
        n: "@ComponentScan / @Import / @Conditional",
        theory: `These annotations control which beans get discovered and registered — the "wiring configuration" layer above individual bean definitions.

@ComponentScan:
Tells Spring which packages to scan for @Component-stereotyped classes. @SpringBootApplication implicitly includes @ComponentScan on the package containing the main class (and all sub-packages) — this is why Spring Boot conventionally wants your main class at the project root package. Explicit basePackages or basePackageClasses attributes let you scan additional/different locations.

@Import:
Manually pulls in @Configuration classes (or plain @Component classes) that live outside the normal component-scan path — for example, from a separate library module. Also used to import ImportSelector or ImportBeanDefinitionRegistrar implementations for advanced, programmatic bean registration (this is how many Spring Boot auto-configuration mechanisms work internally).

@Conditional (and its specialisations):
Registers a bean only if a specified condition evaluates to true at startup. Spring Boot's auto-configuration is built almost entirely on these:
• @ConditionalOnClass / @ConditionalOnMissingClass — register only if a class is/isn't on the classpath.
• @ConditionalOnBean / @ConditionalOnMissingBean — register only if a bean is/isn't already defined (lets user-defined beans override Boot's defaults).
• @ConditionalOnProperty — register only if a property has a specific value (or is present at all).
• @Profile("prod") — a specialised @Conditional that checks active Spring profiles.

Why this matters: this is literally the mechanism behind Spring Boot's "convention over configuration" auto-configuration — e.g., DataSourceAutoConfiguration only activates @ConditionalOnClass(DataSource.class) AND @ConditionalOnMissingBean(DataSource.class), so it backs off automatically the moment you define your own DataSource bean.`,
        desc: "@ComponentScan finds classes to register as beans. @Import manually wires in external configuration. @Conditional (and @ConditionalOnBean/@ConditionalOnProperty/@Profile) registers beans only when a condition holds — the backbone of Spring Boot auto-configuration.",
        code: `@Configuration
@ComponentScan(basePackages = {"com.acme.orders", "com.acme.shared"})
@Import({SecurityConfig.class, MetricsConfig.class})
public class AppConfig { }

@Configuration
public class CacheAutoConfig {

    @Bean
    @ConditionalOnMissingBean(CacheManager.class)   // user can override
    @ConditionalOnProperty(name = "app.cache.enabled", havingValue = "true")
    public CacheManager defaultCacheManager() {
        return new ConcurrentMapCacheManager("products");
    }
}

@Service
@Profile("prod")   // only registered when "prod" profile is active
public class ProdEmailService implements EmailService { ... }

@Service
@Profile("!prod")  // registered for every profile EXCEPT prod
public class MockEmailService implements EmailService { ... }`
      },
      {
        n: "FactoryBean vs @Bean factory method",
        theory: `Both patterns let you control object creation, but they solve different problems and are easy to confuse.

FactoryBean<T> interface:
A bean that implements FactoryBean<T> is special — when you inject or getBean() the TYPE T, Spring calls factoryBean.getObject() and gives you the PRODUCT, not the factory itself. To get the factory instance itself (rarely needed), you prefix the bean name with &: getBean("&myFactory").

Why it exists: Some objects need complex, possibly multi-step, or externally-delegated construction logic that doesn't fit neatly into a constructor or a single @Bean method — historically used heavily by ORM/library integrations (e.g., MyBatis's SqlSessionFactoryBean, JNDI lookups via JndiObjectFactoryBean). It also lets Spring know the PRODUCT's type via getObjectType() for autowiring-by-type to work correctly before the object is even created.

@Bean factory method (the modern, usual approach):
A regular method inside a @Configuration class that returns the object directly. For 95% of cases in modern Spring Boot code, this is simpler and preferred — full Java, no extra interface, easy to read.

When you'd still reach for FactoryBean today: integrating a legacy/third-party library that already exposes a FactoryBean (you're consuming it, not writing your own), or building reusable library code that needs to plug into arbitrary consuming applications' contexts without those apps needing a @Configuration class.

Interview note: isSingleton() on FactoryBean controls whether the PRODUCT is cached as a singleton — independent of whether the FactoryBean itself is a singleton bean.`,
        desc: "FactoryBean<T> is a bean whose job is to build another object — Spring transparently returns the PRODUCT when you request the type, not the factory. Modern code almost always prefers a simple @Bean method instead.",
        code: `// Implementing a FactoryBean (rare in app code, common in library code)
public class ConnectionPoolFactoryBean implements FactoryBean<ConnectionPool> {

    @Override
    public ConnectionPool getObject() {
        return ConnectionPool.builder()
                .maxSize(20)
                .build();               // complex construction logic
    }

    @Override
    public Class<?> getObjectType() {
        return ConnectionPool.class;
    }

    @Override
    public boolean isSingleton() {
        return true;                    // product is cached as singleton
    }
}

@Configuration
public class PoolConfig {
    @Bean
    public ConnectionPoolFactoryBean connectionPoolFactoryBean() {
        return new ConnectionPoolFactoryBean();
    }
}

// Elsewhere: injecting ConnectionPool gets the PRODUCT, not the factory
@Service
public class QueryService {
    public QueryService(ConnectionPool pool) { ... } // getObject() result
}

// The modern, usually-preferred equivalent — no FactoryBean needed
@Configuration
public class PoolConfigSimple {
    @Bean
    public ConnectionPool connectionPool() {
        return ConnectionPool.builder().maxSize(20).build();
    }
}`
      },
    ]
  },
  {
    cat: "Caching",
    color: "#3fb950",
    bg: "#0a2010",
    icon: "⚡",
    anns: [
      {
        n: "@EnableCaching / @Cacheable / @CachePut / @CacheEvict",
        theory: `Spring's caching abstraction lets you add caching to service methods declaratively — without coupling your code to a specific cache implementation (Redis, Caffeine, EhCache, Hazelcast, etc.).

@EnableCaching:
Activates Spring's annotation-driven caching by registering a CacheInterceptor (AOP advice) that intercepts calls to @Cacheable, @CachePut, and @CacheEvict methods.

@Cacheable(value, key):
The workhorse annotation. On first call: executes the method, stores the result in the cache under the key. On subsequent calls with the same key: returns the cached result WITHOUT executing the method. The key is a SpEL expression evaluated against method parameters (#id, #user.email, etc.). Default key: all parameters combined.

Condition vs Unless:
• condition: SpEL expression evaluated BEFORE execution — if false, caching is skipped entirely.
• unless: SpEL expression evaluated AFTER execution against the return value (#result) — if true, the result is NOT cached. Useful to skip caching null or empty results.

@CachePut(value, key):
ALWAYS executes the method AND stores the result in the cache. Used to keep the cache in sync after an update. Unlike @Cacheable it never skips execution.

@CacheEvict(value, key):
Removes entries from the cache. key targets a specific entry; allEntries = true clears the entire named cache. beforeInvocation = true evicts before the method runs (useful if the method might throw).

@Caching: Groups multiple cache annotations on one method (e.g., evict from two caches and update one in a single method).

AOP proxy limitation: Same as @Transactional — self-invocation bypasses the proxy. Calling @Cacheable from within the same bean skips caching.`,
        desc: "Spring's declarative caching. @Cacheable skips execution on cache hit; @CachePut always runs and updates; @CacheEvict removes entries. Works with Redis, Caffeine, etc.",
        code: `@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager("products", "users");
        mgr.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(1000));
        return mgr;
    }
}

@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public Product findById(Long id) {
        return repo.findById(id).orElseThrow(); // DB hit only on miss
    }

    @CachePut(value = "products", key = "#product.id")
    public Product update(Product product) {
        return repo.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void clearCache() { }
}`
      },
    ]
  },
  {
    cat: "Repository / Spring Data",
    color: "#f85149",
    bg: "#2d0f0f",
    icon: "🗄️",
    anns: [
      {
        n: "@Repository / @Query / @Modifying",
        theory: `@Repository marks a class as a Data Access Object (DAO) — the persistence layer. Beyond marking it for component scan, Spring adds exception translation: Spring wraps JPA/JDBC/Hibernate-specific exceptions into Spring's DataAccessException hierarchy (a consistent, unchecked exception hierarchy). This means your service layer doesn't need to know whether the underlying store is JPA, JDBC, or MongoDB.

Spring Data JPA extends this with JpaRepository<T, ID>, which provides out-of-the-box methods: findById, findAll, save, delete, count, existsById, findAll(Pageable), findAll(Sort), etc. You only write an interface — Spring generates the implementation at startup using JDK dynamic proxies.

Derived query methods: Spring Data parses the method name and generates JPQL automatically:
  findByEmailAndIsActive → SELECT ... WHERE email = ? AND is_active = ?
  findByLastNameOrderBySalaryDesc → SELECT ... WHERE last_name = ? ORDER BY salary DESC
  countByDepartment → SELECT COUNT(*) WHERE department = ?

@Query: For complex queries that can't be expressed as method names. Write JPQL (entity-based) or native SQL (nativeQuery = true). Named parameters via @Param or positional via ?1, ?2.

@Modifying: Required for any @Query that is an INSERT, UPDATE, or DELETE (not SELECT). Without it, Spring Data throws QueryExecutionRequestException. Combine with @Transactional because writes require a transaction.

@Lock: Apply pessimistic or optimistic locking to queries. @Lock(LockModeType.PESSIMISTIC_WRITE) adds FOR UPDATE to the SQL.

@EntityGraph: Override LAZY/EAGER fetch strategy for a specific query to solve N+1 problems declaratively.`,
        desc: "@Repository marks DAO beans and enables exception translation. @Query defines custom JPQL/SQL. @Modifying marks DML queries. Spring Data generates implementations from interfaces.",
        code: `@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Derived query — Spring generates SQL
    List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);

    // Custom JPQL
    @Query("SELECT o FROM Order o WHERE o.total > :minAmount ORDER BY o.createdAt DESC")
    List<Order> findHighValueOrders(@Param("minAmount") BigDecimal minAmount);

    // Bulk update — requires @Modifying
    @Modifying
    @Transactional
    @Query("UPDATE Order o SET o.status = :status WHERE o.customerId = :customerId")
    int updateOrderStatus(@Param("customerId") Long customerId,
                          @Param("status") OrderStatus status);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}`
      },
    ]
  },
  {
    cat: "Entity / JPA",
    color: "#58a6ff",
    bg: "#0f1f3a",
    icon: "🗃️",
    anns: [
      {
        n: "JPA Entity Annotations",
        theory: `JPA (Java Persistence API, now Jakarta Persistence) is the standard ORM specification. Hibernate is the most common implementation. Together they map Java objects to relational database tables.

@Entity: Marks the class as a JPA-managed persistent entity. Must have a no-arg constructor (can be protected). The class name maps to a table of the same name by default.

@Table: Customises the mapped table name, schema, catalog, and creates indexes or unique constraints at the DDL level.

@Id + @GeneratedValue: @Id marks the primary key field. @GeneratedValue configures auto-generation strategy: IDENTITY (relies on DB auto-increment), SEQUENCE (uses a DB sequence), TABLE (uses a table to simulate sequences), AUTO (database-specific default).

@Column: Maps a field to a specific column name, nullable constraint, length, precision, scale, unique constraint, insertable/updatable flags.

Relationship annotations — fetch types are critical:
• @OneToMany(fetch = FetchType.LAZY): Default and recommended. Related collection loaded on demand.
• @ManyToOne(fetch = FetchType.EAGER): Default and usually fine for single objects.
• @ManyToMany: Uses a join table. Both sides should be LAZY.
Eager fetching causes N+1 and performance issues — always default to LAZY and use JOIN FETCH or @EntityGraph when you need the association.

Cascade types: CascadeType.ALL propagates all operations (persist, merge, remove, refresh, detach) from parent to child. CascadeType.PERSIST + MERGE is safer for most cases. Never use CascadeType.REMOVE without careful consideration — deleting a parent deletes all children.

@Transient: Excludes the field from persistence — it has no column in the table.

@Enumerated(EnumType.STRING): Stores enum values as their String name ("PENDING") rather than ordinal (0). ALWAYS use STRING — ordinal breaks if enum values are reordered.

Auditing: @CreatedDate, @LastModifiedDate, @CreatedBy, @LastModifiedBy work with @EnableJpaAuditing and @EntityListeners(AuditingEntityListener.class) to auto-populate audit fields.`,
        desc: "Map Java classes to DB tables. @Entity marks the class; @Id marks the PK; relationship annotations (@OneToMany, @ManyToOne) wire entities. Fetch type and cascade are critical to get right.",
        code: `@Entity
@Table(name = "orders",
       indexes = @Index(name = "idx_customer_id", columnList = "customer_id"))
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Enumerated(EnumType.STRING)       // stores "PENDING", not 0
    private OrderStatus status;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    @Transient
    private String displayLabel;     // not persisted
}`
      },
    ]
  },
  {
    cat: "Projections (Spring Data)",
    color: "#a5d6ff",
    bg: "#1a2d4a",
    icon: "🔍",
    anns: [
      {
        n: "Interface & Class Projections",
        theory: `Spring Data Projections let you retrieve only specific columns from queries instead of loading full entity objects — reducing memory usage, avoiding lazy-loading issues, and simplifying DTOs.

Interface projections (open):
You declare an interface with getter methods matching entity fields. Spring Data auto-generates a proxy implementation at runtime. The query only fetches the columns corresponding to the declared getters.

Closed interface projections: If all getter methods map directly to entity fields, Hibernate can optimise the SQL to SELECT only those columns. This is the most efficient form.

Open interface projections: When a getter has a @Value SpEL expression (e.g., combining first and last name), Spring must load the full entity to evaluate the expression — the performance benefit is lost.

Class-based (DTO) projections:
Use a class (or record) with a constructor matching the fields you want. Spring Data uses a JPQL constructor expression or maps constructor parameters. Completely decouples from the entity — pure data carrier.

Dynamic projections:
The same repository method can return different projection types based on the caller's choice:
  <T> List<T> findByStatus(Status s, Class<T> type)
  repo.findByStatus(PENDING, OrderSummary.class)  // interface projection
  repo.findByStatus(PENDING, OrderDto.class)       // DTO projection

When to use which:
• Interface projection: quick, minimal boilerplate, for simple read-only views.
• DTO (record) projection: full type safety, works anywhere (not proxy-based), serialises cleanly to JSON, testable without Spring context.
• Full entity: when you need the full object for modification (save it back).`,
        desc: "Retrieve only specific columns instead of full entities. Interface projections use auto-generated proxies; DTO projections use constructor expressions. Better performance and cleaner APIs.",
        code: `// Interface projection — Spring generates proxy, fetches only these columns
public interface OrderSummary {
    Long getId();
    BigDecimal getTotal();
    OrderStatus getStatus();

    @Value("#{target.total > 1000 ? 'VIP' : 'Regular'}")
    String getCustomerTier();
}

// DTO projection (record)
public record OrderDto(Long id, BigDecimal total, String customerName) { }

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<OrderSummary> findByCustomerId(Long customerId);

    @Query("SELECT new com.app.dto.OrderDto(o.id, o.total, c.name) " +
           "FROM Order o JOIN o.customer c WHERE o.status = :status")
    List<OrderDto> findOrderDtosByStatus(@Param("status") OrderStatus status);

    // Dynamic — caller decides the projection type at runtime
    <T> List<T> findByStatus(OrderStatus status, Class<T> type);
}`
      },
    ]
  },
  {
    cat: "Security",
    color: "#f85149",
    bg: "#2d0f0f",
    icon: "🔐",
    anns: [
      {
        n: "@EnableWebSecurity / Security Config",
        theory: `Spring Security is a comprehensive security framework. @EnableWebSecurity activates it by importing SecurityFilterChain and other infrastructure beans.

Spring Security Filter Chain: Security is implemented as a chain of Servlet Filters that intercept every HTTP request before it reaches your controllers. The chain includes: ChannelProcessingFilter, SecurityContextPersistenceFilter, LogoutFilter, UsernamePasswordAuthenticationFilter, BasicAuthenticationFilter, JwtAuthenticationFilter, ExceptionTranslationFilter, FilterSecurityInterceptor.

SecurityFilterChain bean (Spring Security 6+): Replaces the old approach of extending WebSecurityConfigurerAdapter (removed in Spring Security 6). You declare a @Bean SecurityFilterChain and configure it fluently.

csrf().disable(): CSRF protection is important for browser-based session apps. For stateless REST APIs using JWT (no session, no cookies for auth), CSRF protection is unnecessary and is typically disabled.

sessionManagement().sessionCreationPolicy(STATELESS): Tells Spring not to create/use HTTP sessions. Each request must carry its own authentication token (JWT). Essential for REST APIs.

authorizeHttpRequests: URL-based access control rules. Rules are evaluated in order — put more specific patterns first. requestMatchers uses Ant-style patterns.

oauth2ResourceServer(jwt): Configures the app as an OAuth2 resource server that validates JWT Bearer tokens. Spring Security extracts the JWT from the Authorization header, verifies the signature, and populates the SecurityContext.

@EnableMethodSecurity (formerly @EnableGlobalMethodSecurity): Activates @PreAuthorize, @PostAuthorize, @Secured, @RolesAllowed on individual methods. Pre-post annotations are most powerful (support SpEL).`,
        desc: "Activates Spring Security. Define a SecurityFilterChain bean to configure auth rules, session management, CSRF, and OAuth2. @EnableMethodSecurity enables method-level access control.",
        code: `@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`
      },
      {
        n: "@PreAuthorize / @PostAuthorize / @Secured",
        theory: `Method-level security annotations allow fine-grained access control at the individual method level — going beyond URL pattern matching to enforce business-specific rules.

@PreAuthorize (recommended):
Evaluates a SpEL expression BEFORE the method runs. Access is denied if the expression returns false (throws AccessDeniedException). Full access to the Spring Security SpEL context:
• hasRole('ADMIN') / hasAnyRole('ADMIN', 'USER')
• hasAuthority('PERM_ORDER_WRITE')
• isAuthenticated() / isAnonymous()
• authentication.principal.username
• #paramName — access method parameters by name
• @beanName.method(#param) — call a bean's method for complex permission logic

@PostAuthorize:
Evaluates AFTER the method runs. Can access the return value via returnObject. The method executes even if the check will deny — useful for "did the logged-in user just fetch their own data?" checks.

@Secured:
Simpler than @PreAuthorize — just a list of role names. Does NOT support SpEL. Role names must include the "ROLE_" prefix. Less flexible but clearer for simple role checks.

@RolesAllowed (JSR-250):
Standard Java annotation, equivalent to @Secured. Requires jsr250Enabled = true in @EnableMethodSecurity.

@AuthenticationPrincipal:
Injects the current user's principal (usually a UserDetails implementation) directly into a controller method parameter — no need to call SecurityContextHolder.

Requires @EnableMethodSecurity on a @Configuration class (enabled = true by default in Spring Security 6).`,
        desc: "@PreAuthorize / @PostAuthorize evaluate SpEL expressions for access control. @Secured uses simple role names. @AuthenticationPrincipal injects the current user.",
        code: `@Service
public class DocumentService {

    @PreAuthorize("hasRole('ADMIN') or hasPermission(#id, 'Document', 'READ')")
    public Document getDocument(Long id) { ... }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDocument(Long id) { ... }

    @PostAuthorize("returnObject.ownerId == authentication.principal.id")
    public Document getMyDocument(Long id) { ... }

    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public List<Document> getAllDocuments() { ... }
}

@RestController
public class UserController {

    @GetMapping("/me")
    public UserDto getMe(@AuthenticationPrincipal UserDetails principal) {
        return userService.findByUsername(principal.getUsername());
    }
}`
      },
    ]
  },
  {
    cat: "Configuration & DB Config",
    color: "#adbac7",
    bg: "#1c2128",
    icon: "🛢️",
    anns: [
      {
        n: "@Configuration / Multiple DataSources",
        theory: `@Configuration marks a class as a source of bean definitions. It is a specialisation of @Component that is CGLIB-proxied, enabling inter-@Bean method calls to return the same singleton instance.

@Configuration vs @Component for beans:
In a @Configuration class, calling beanA() inside beanB()'s method returns the Spring singleton (proxied call). In a @Component class (lite mode), calling beanA() calls the actual Java method and creates a new instance. Always use @Configuration for beans that depend on each other.

Multiple DataSources pattern:
When your application needs to connect to more than one database (main + analytics, primary + replica, two microservice databases), you must define separate beans for each:
1. DataSource: connection pool (HikariCP) for each database.
2. LocalContainerEntityManagerFactoryBean: JPA EntityManagerFactory for each database, pointing to its DataSource and scanning its entity packages.
3. PlatformTransactionManager: transaction manager for each EntityManagerFactory.
4. @EnableJpaRepositories: points each package of repositories to the correct EntityManagerFactory and TransactionManager.
5. @Primary on one set of beans: makes it the default when no @Qualifier is specified.

@EnableTransactionManagement: Activates Spring's annotation-driven transaction management. Required when using @Transactional without Spring Boot auto-configuration.

@Sql: Execute SQL scripts before or after a test method (e.g., seed test data).`,
        desc: "@Configuration marks a source of @Bean definitions (CGLIB-proxied). Multiple DataSource setup requires separate DataSource, EntityManagerFactory, and TransactionManager beans per database.",
        code: `// Two databases: primary (PostgreSQL) + secondary (MySQL)
@Configuration
@EnableJpaRepositories(
    basePackages = "com.app.primary.repository",
    entityManagerFactoryRef = "primaryEmf",
    transactionManagerRef = "primaryTm"
)
public class PrimaryDataSourceConfig {

    @Primary
    @Bean("primaryDs")
    @ConfigurationProperties("spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean("primaryEmf")
    public LocalContainerEntityManagerFactoryBean primaryEmf(
            @Qualifier("primaryDs") DataSource ds,
            EntityManagerFactoryBuilder builder) {
        return builder.dataSource(ds)
                      .packages("com.app.primary.entity")
                      .build();
    }

    @Primary
    @Bean("primaryTm")
    public PlatformTransactionManager primaryTm(
            @Qualifier("primaryEmf") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}`
      },
    ]
  },
  {
    cat: "Kafka / RabbitMQ",
    color: "#a5d6ff",
    bg: "#0f1f3a",
    icon: "📨",
    anns: [
      {
        n: "Kafka Annotations",
        theory: `Spring Kafka provides a Spring-friendly wrapper around the Apache Kafka Java client, adding annotation-driven consumer configuration, transaction support, error handling, and Spring-managed lifecycle.

@KafkaListener:
The core consumer annotation. Marks a method to be invoked when messages arrive on the specified topic(s). Spring creates a ConcurrentMessageListenerContainer that manages one or more consumer threads. The method can accept a ConsumerRecord, the payload directly (with deserialization), or Message<T>.

Consumer group (groupId): All instances of the application with the same groupId share the topic's partitions. Each partition is consumed by exactly one consumer per group. This is Kafka's native parallelism mechanism.

containerFactory: References a KafkaListenerContainerFactory bean. Configures concurrency (number of consumer threads per listener), ack mode (manual vs batch vs record), error handlers, and retry behaviour.

Acknowledgement modes:
• BATCH (default): Offsets committed after processing the entire batch polled.
• MANUAL: Application calls Acknowledgment.acknowledge() explicitly — most control.
• RECORD: Offsets committed after each record.
• AckMode.COUNT / TIME: Commit every N records or every T seconds.

@Header(KafkaHeaders.RECEIVED_PARTITION): Injects Kafka message header values into parameters. KafkaHeaders provides constants for all standard Kafka headers.

KafkaTemplate: Used to produce messages. send() returns a CompletableFuture<SendResult<K,V>>. Execute flush() or set producer configs for immediate delivery guarantees.`,
        desc: "@KafkaListener consumes messages from topics. KafkaTemplate produces messages. Configure via KafkaListenerContainerFactory for concurrency, ack mode, and error handling.",
        code: `@Component
public class OrderEventConsumer {

    @KafkaListener(topics = "orders.events", groupId = "order-processor",
                   containerFactory = "kafkaListenerContainerFactory")
    public void handleOrderEvent(
            @Payload OrderEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment ack) {

        try {
            processEvent(event);
            ack.acknowledge();    // manual ack after processing
        } catch (Exception ex) {
            log.error("Failed to process event", ex);
            // route to retry topic or DLT
        }
    }
}

@Service
public class OrderEventProducer {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void sendOrderPlaced(Order order) {
        kafkaTemplate.send("orders.events", order.getId().toString(),
                           new OrderEvent(order.getId(), "ORDER_PLACED"))
            .whenComplete((result, ex) -> {
                if (ex != null) log.error("Failed to send", ex);
            });
    }
}`
      },
      {
        n: "RabbitMQ Annotations",
        theory: `Spring AMQP provides annotation-driven RabbitMQ integration with automatic queue/exchange/binding declaration, message conversion, and container lifecycle management.

@RabbitListener:
Marks a method as a listener on one or more RabbitMQ queues. Spring creates a SimpleMessageListenerContainer (or DirectMessageListenerContainer) that polls the queue and invokes the method for each message. The container handles connection recovery, thread management, and ack/nack.

@EnableRabbit: Activates annotation-driven listener registration. Usually included automatically via Spring Boot's RabbitAutoConfiguration.

Message acknowledgement modes:
• AUTO (default): Spring acknowledges after the method returns normally; nacks on exception.
• MANUAL: Method receives Channel and DeliveryTag; calls channel.basicAck() / channel.basicNack() explicitly. Gives full control for dead-letter queue routing.
• NONE: Messages are never acknowledged (auto-ack at the broker level).

Queue/Exchange/Binding declarations:
Declare these as @Bean objects (Queue, TopicExchange, DirectExchange, FanoutExchange, Binding) in a @Configuration class. Spring AMQP creates them in RabbitMQ at startup if they don't exist, using the configured credentials.

MessageConverter:
RabbitTemplate and listeners use a MessageConverter for serialisation. Jackson2JsonMessageConverter converts Java objects to/from JSON. Must be registered as a @Bean and configured on the RabbitTemplate and ListenerContainerFactory.

RabbitTemplate:
Used to produce messages. convertAndSend(exchange, routingKey, message) publishes to an exchange with a routing key. The exchange routes the message to queues based on bindings.`,
        desc: "@RabbitListener consumes messages from queues. RabbitTemplate publishes messages. Queues, exchanges, and bindings are declared as @Beans and auto-created at startup.",
        code: `@Configuration
public class RabbitConfig {

    @Bean public Queue orderQueue() {
        return QueueBuilder.durable("orders.queue").build();
    }

    @Bean public TopicExchange orderExchange() {
        return new TopicExchange("orders.exchange");
    }

    @Bean public Binding orderBinding(Queue q, TopicExchange ex) {
        return BindingBuilder.bind(q).to(ex).with("orders.placed");
    }

    @Bean public MessageConverter jacksonConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

@Component
public class OrderConsumer {

    @RabbitListener(queues = "orders.queue")
    public void handleOrder(OrderEvent event, Channel channel,
                            @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws Exception {
        try {
            orderProcessor.process(event);
            channel.basicAck(tag, false);
        } catch (Exception ex) {
            channel.basicNack(tag, false, false); // reject → DLQ
        }
    }
}`
      },
    ]
  },
  {
    cat: "Spring Test",
    color: "#d29922",
    bg: "#2d2000",
    icon: "🧪",
    anns: [
      {
        n: "@SpringBootTest / @WebMvcTest / @DataJpaTest / @MockBean",
        theory: `Spring Boot provides test slice annotations that load only the relevant parts of the application context, making tests faster and more focused.

@SpringBootTest:
Loads the FULL application context — all beans, all configurations, all auto-configurations. Use for integration tests that must test component interaction across layers. webEnvironment = RANDOM_PORT starts an actual embedded Tomcat on a random port. Use TestRestTemplate or WebTestClient to make HTTP calls.

@WebMvcTest(Controller.class):
Loads ONLY the web layer — controllers, filters, ControllerAdvice, WebMvcConfigurer. Does NOT load @Service or @Repository beans. Use @MockBean to replace service dependencies with Mockito mocks. MockMvc is auto-configured. Fast — no DB, no full context.

@DataJpaTest:
Loads ONLY JPA-related beans — repositories, @Entity classes, JPA configuration. By default uses an embedded in-memory H2 database and wraps each test in a transaction that is rolled back after the test. Use @AutoConfigureTestDatabase(replace = NONE) to use your real database (e.g., with Testcontainers).

@MockBean:
Creates a Mockito mock and registers it as a Spring bean in the test context, replacing any real bean of the same type. Automatically reset between tests. Use with @WebMvcTest to mock the service layer.

@SpyBean: Like @MockBean but wraps the real bean — you can stub specific methods while others use the real implementation.

@TestConfiguration: Defines additional beans specific to the test context without affecting the production context. Used inside test classes or as a nested static class.

@ActiveProfiles("test"): Activates the "test" Spring profile, loading test-specific beans and properties.`,
        desc: "@SpringBootTest loads full context for integration tests. @WebMvcTest loads only the web layer. @DataJpaTest loads only JPA. @MockBean replaces a real bean with a Mockito mock.",
        code: `// Full integration test
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OrderIntegrationTest {

    @Autowired private TestRestTemplate restTemplate;

    @Test
    void createOrderReturns201() {
        ResponseEntity<Order> res = restTemplate.postForEntity("/api/orders",
                new OrderRequest(1L, List.of()), Order.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}

// Web layer only — fast, no DB
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean  private UserService userService;

    @Test
    void getUser_returns200() throws Exception {
        given(userService.findById(1L)).willReturn(new User(1L, "Alice"));

        mockMvc.perform(get("/api/users/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("Alice"));
    }
}`
      },
    ]
  },
  {
    cat: "Actuator",
    color: "#3fb950",
    bg: "#0a2010",
    icon: "❤️",
    anns: [
      {
        n: "@Endpoint / @ReadOperation / Custom Health",
        theory: `Spring Boot Actuator exposes operational endpoints over HTTP (and JMX) to monitor and manage a running application — without writing controller code.

Built-in endpoints: /actuator/health, /actuator/metrics, /actuator/info, /actuator/env, /actuator/beans, /actuator/conditions, /actuator/loggers, /actuator/heapdump, /actuator/threaddump, /actuator/httptrace, /actuator/mappings.

Security: All actuator endpoints except /health and /info are restricted by default. Configure management.endpoints.web.exposure.include=* (or specific list) to expose them, and secure with Spring Security.

Custom Endpoint (@Endpoint):
@Endpoint(id = "feature-flags") creates /actuator/feature-flags. Methods are annotated with @ReadOperation (GET), @WriteOperation (POST), or @DeleteOperation (DELETE). @Selector on a parameter makes it a path segment (/actuator/feature-flags/{flagName}).

HealthIndicator:
Implement the HealthIndicator interface and return Health.up() / Health.down() / Health.unknown() with diagnostic details. Spring aggregates all registered HealthIndicators into the /health endpoint. Health check status flows through a CompositeHealthContributor — if any indicator is DOWN, the overall status is DOWN.

Common HealthIndicator implementations: DiskSpaceHealthIndicator, DataSourceHealthIndicator, RedisHealthIndicator. These are auto-configured when the relevant dependencies are present.

management.endpoint.health.show-details=always: Exposes full health details (including HealthIndicator output) in the /health response. Set to when-authorized for production.`,
        desc: "Actuator exposes operational /health, /metrics, /info endpoints. Custom @Endpoint creates new endpoints. HealthIndicator plugs custom health checks into the /health endpoint.",
        code: `// Custom actuator endpoint at /actuator/feature-flags
@Component
@Endpoint(id = "feature-flags")
public class FeatureFlagEndpoint {

    @ReadOperation
    public Map<String, Boolean> getFlags() {
        return flagService.getAllFlags();
    }

    @WriteOperation
    public void setFlag(@Selector String flagName, boolean enabled) {
        flagService.setFlag(flagName, enabled);
    }
}

// Custom health indicator
@Component
public class ExternalApiHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            ResponseEntity<String> resp =
                restTemplate.getForEntity("https://api.partner.com/ping", String.class);
            if (resp.getStatusCode().is2xxSuccessful())
                return Health.up().withDetail("partner-api", "reachable").build();
        } catch (Exception ex) {
            return Health.down().withDetail("partner-api", "unreachable")
                               .withException(ex).build();
        }
        return Health.unknown().build();
    }
}`
      },
    ]
  },
  {
    cat: "Lombok & Java Meta",
    color: "#adbac7",
    bg: "#1c2128",
    icon: "⚒️",
    anns: [
      {
        n: "Lombok + Java Annotations",
        theory: `Lombok is a compile-time annotation processor that eliminates Java boilerplate by generating code (getters, setters, constructors, toString, equals, hashCode, builders, loggers) in the bytecode at compile time — without cluttering your source code.

Key annotations:

@Data: Generates @Getter, @Setter, @RequiredArgsConstructor, @EqualsAndHashCode, @ToString. Use with caution on JPA entities — @EqualsAndHashCode using all fields (including mutable ones and lazy-loaded associations) can cause problems. Prefer @Getter + @Setter + explicit equals/hashCode on JPA entities.

@Builder: Generates a static inner Builder class with a fluent API. Combine with @NoArgsConstructor + @AllArgsConstructor when used with JPA (JPA requires a no-arg constructor; @Builder requires all-args). Use @Builder.Default to set default values.

@Slf4j: Injects private static final Logger log = LoggerFactory.getLogger(ClassName.class). Use log.info(), log.warn(), log.debug(), log.error() directly.

@EqualsAndHashCode(onlyExplicitlyIncluded = true): Critical for JPA entities — mark only @Id with @EqualsAndHashCode.Include. Using all fields causes issues: lazy associations trigger fetching, and mutable fields break Set/Map behaviour.

@NonNull: Adds a null check at the start of the constructor/method and throws NullPointerException with a clear message. Different from jakarta @NotNull (which is a Bean Validation constraint).

Java meta-annotations:
@Deprecated(forRemoval = true): Marks an element as obsolete, scheduled for removal. IDEs show strikethrough.
@FunctionalInterface: Ensures the interface has exactly one abstract method — allows lambda expressions.
@SuppressWarnings: Suppresses specific compiler warnings (unchecked generics, deprecation, etc.).`,
        desc: "Lombok eliminates boilerplate — @Data, @Builder, @Slf4j, @Getter, @Setter at compile time. Use @EqualsAndHashCode carefully on JPA entities.",
        code: `@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
@Entity
@Table(name = "products")
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NonNull
    private String sku;

    @Builder.Default
    private boolean active = true;
}

// Builder usage
Product p = Product.builder()
                   .name("Widget")
                   .sku("WGT-001")
                   .build();

log.info("Created product: {}", p);

// @EqualsAndHashCode — safe for JPA
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class Category {
    @EqualsAndHashCode.Include
    @Id private Long id;
    private String name;
}

@FunctionalInterface
public interface OrderProcessor {
    void process(Order order);  // exactly one abstract method → lambda-safe
}`
      },
    ]
  },
];

const SECTION_COLORS = {
  "Controller / Web MVC":          { accent: "#58a6ff", dim: "#0d1f3c" },
  "Application Bootstrap":         { accent: "#3fb950", dim: "#0d2216" },
  "Exception Handling":            { accent: "#f85149", dim: "#2d0f0f" },
  "Environment & Config Values":   { accent: "#d29922", dim: "#2d2000" },
  "Model / DTO / Validation":      { accent: "#58a6ff", dim: "#0d1f3c" },
  "ObjectMapper (Jackson)":        { accent: "#3fb950", dim: "#0d2216" },
  "Service / Business Logic":      { accent: "#3fb950", dim: "#0d2216" },
  "Beans & Dependency Injection":  { accent: "#a5d6ff", dim: "#0d1f3c" },
  "Caching":                       { accent: "#3fb950", dim: "#0a2010" },
  "Repository / Spring Data":      { accent: "#f85149", dim: "#2d0f0f" },
  "Entity / JPA":                  { accent: "#58a6ff", dim: "#0f1f3a" },
  "Projections (Spring Data)":     { accent: "#a5d6ff", dim: "#0d1f3c" },
  "Security":                      { accent: "#f85149", dim: "#2d0f0f" },
  "Configuration & DB Config":     { accent: "#adbac7", dim: "#1c2128" },
  "Kafka / RabbitMQ":              { accent: "#a5d6ff", dim: "#0f1f3a" },
  "Spring Test":                   { accent: "#d29922", dim: "#2d2000" },
  "Actuator":                      { accent: "#3fb950", dim: "#0a2010" },
  "Lombok & Java Meta":            { accent: "#adbac7", dim: "#1c2128" },
};

export default function SpringAnnotations() {
  return (
    <RevisionNotesLayout
      pageKey="java"
      title="SpringBoot Annotations Reference"
      subtitle="Comprehensive guide to Spring Boot and Spring MVC annotations with working examples."
      categoryIcon="☕"
      categoryColor="#f97316"
      sections={DATA}
      tagMeta={SECTION_COLORS}
    />
  );
}

export { DATA };