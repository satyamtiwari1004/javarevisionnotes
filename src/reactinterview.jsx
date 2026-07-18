import RevisionNotesLayout from './components/RevisionNotesLayout';


const SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    cat: "React Fundamentals & JSX",
    icon: "◎",
    color: "#06B6D4",
    desc: "Virtual DOM, JSX compilation, components, and the props vs state distinction interviewers always probe.",
    topics: [
      {
        n: "JSX, Virtual DOM & Component Model",
        star: true,
        tag: "OVERVIEW",
        desc: `React is a declarative UI library built around a component model and a Virtual DOM diffing strategy. Interviewers use this as the warm-up topic to gauge how deep you actually go.

JSX: Syntactic sugar that compiles to React.createElement() calls (or jsx() with the new JSX transform). JSX is NOT HTML — it's an expression, so it must return a single root (or a Fragment), attributes are camelCase (className, onClick), and {} embeds JS expressions.

VIRTUAL DOM: A lightweight in-memory JS object tree that mirrors the real DOM. On state change React builds a new Virtual DOM tree, diffs it against the previous one (reconciliation), and computes the minimal set of real DOM mutations (the "patch"). This is fast because JS object diffing is far cheaper than touching the real DOM.

WHY NOT DIRECTLY MUTATE THE DOM: Real DOM writes trigger layout/reflow and repaint — expensive. Batching many logical changes into one minimal patch avoids redundant work.

COMPONENTS: Two kinds — function components (the modern default, use Hooks) and class components (legacy, lifecycle methods). A component is just a function that takes props and returns JSX (a description of UI, not the UI itself).

PROPS vs STATE:
  PROPS: Read-only, passed from parent to child, component cannot modify its own props (one-way data flow).
  STATE: Local, mutable (via setState/useState), owned by the component, triggers re-render on change.
  Rule of thumb interviewers listen for: "props are how a component receives data, state is how it remembers data across renders."

CONTROLLED vs UNCONTROLLED COMPONENTS:
  Controlled: form input's value is driven by React state (value={state}, onChange updates state) — single source of truth.
  Uncontrolled: form input manages its own DOM state internally, accessed via a ref when needed (defaultValue, ref.current.value).`,
        code: `// ── JSX compiles to createElement calls ──────────────────
const element = <h1 className="title">Hello, {name}</h1>;
// Compiles (classic transform) to:
const element2 = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, ', name
);
// New JSX transform (React 17+, no need to import React for JSX):
// import { jsx as _jsx } from 'react/jsx-runtime';

// ── Function component vs class component ────────────────
function Greeting({ name }) {          // props destructured directly
  return <h1>Hello, {name}</h1>;
}

class GreetingClass extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// ── Props are read-only ───────────────────────────────────
function Button({ label, onClick }) {
  // props.label = "new"; // ❌ never mutate props directly
  return <button onClick={onClick}>{label}</button>;
}

// ── State is local and triggers re-render ─────────────────
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}

// ── Controlled vs uncontrolled input ──────────────────────
// Controlled — React state is the single source of truth
function ControlledInput() {
  const [value, setValue] = React.useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// Uncontrolled — DOM manages its own value, read via ref
function UncontrolledInput() {
  const inputRef = React.useRef(null);
  const handleSubmit = () => alert(inputRef.current.value);
  return <input ref={inputRef} defaultValue="initial" />;
}

// ── Fragments — avoid unnecessary wrapper divs ────────────
function List() {
  return (
    <>
      <li>One</li>
      <li>Two</li>
    </>
  );
}

// ── Conditional rendering patterns ────────────────────────
function Status({ isLoggedIn, error }) {
  if (error) return <ErrorBanner msg={error} />;      // early return
  return (
    <div>
      {isLoggedIn && <p>Welcome back!</p>}              {/* && guard */}
      {isLoggedIn ? <Dashboard /> : <LoginForm />}       {/* ternary */}
    </div>
  );
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Hooks — Deep Dive",
    icon: "⚓",
    color: "#F59E0B",
    desc: "useState, useEffect, useMemo, useCallback, useRef, useContext, useReducer, and the Rules of Hooks — the single most-asked interview area.",
    topics: [
      {
        n: "Core Hooks, Rules of Hooks & Custom Hooks",
        star: true,
        tag: "HOOKS",
        desc: `Hooks let function components use state and lifecycle features without classes. Interviewers probe both "how do you use X hook" and "why does React need the Rules of Hooks."

RULES OF HOOKS (enforced by eslint-plugin-react-hooks):
  1. Only call Hooks at the top level — never inside loops, conditions, or nested functions.
  2. Only call Hooks from React function components or custom Hooks.
WHY: React tracks Hooks by call order per render, using an internal linked list tied to the fiber. Conditionally skipping a Hook call shifts every subsequent Hook's slot, corrupting state between renders.

useSTATE: Returns [value, setter]. Updates are asynchronous/batched, and setState triggers a re-render, not an immediate mutation. Passing a function to the setter (functional update) is required when the new state depends on the previous state, especially inside closures/async callbacks.

useEFFECT: Runs side effects after render/commit. Dependency array controls when it re-runs:
  [] → runs once after mount (and cleanup on unmount)
  [dep1, dep2] → runs after mount + whenever any dependency changes
  omitted → runs after every render
  The returned function from the effect is the CLEANUP function — runs before the next effect execution and on unmount (unsubscribe listeners, clear timers, abort fetches).

useMEMO vs useCALLBACK: Both memoize across renders to avoid unnecessary work.
  useMemo(fn, deps) memoizes a COMPUTED VALUE — recomputes only if deps change.
  useCallback(fn, deps) memoizes a FUNCTION REFERENCE — returns the same function identity if deps haven't changed.
  useCallback(fn, deps) is literally useMemo(() => fn, deps).
  Use case: prevent child components wrapped in React.memo from re-rendering due to a new function/object reference being passed as a prop every render.

useREF: Returns a mutable {current} object that persists across renders WITHOUT causing a re-render when changed. Two uses: (1) DOM element access, (2) storing any mutable value that shouldn't trigger a render (previous value tracking, interval IDs, render counts).

useCONTEXT: Consumes a Context value without wrapping in a Consumer component — subscribes the component to context changes (re-renders on Provider value change).

useREDUCER: An alternative to useState for complex state logic — useful when next state depends on previous state in non-trivial ways, or when many sub-values update together. Same underlying mental model as Redux reducers: (state, action) => newState.

CUSTOM HOOKS: A JS function whose name starts with "use" that calls other Hooks — the primary mechanism for reusing stateful logic across components (replaces the old HOC/render-props patterns for that purpose).`,
        code: `// ── useState — functional updates for stale closures ─────
function Counter() {
  const [count, setCount] = React.useState(0);
  const incrementThreeTimes = () => {
    setCount(c => c + 1); // ✓ functional update — sees latest value
    setCount(c => c + 1);
    setCount(c => c + 1);
    // setCount(count + 1) three times would only add 1 total —
    // all three read the same stale 'count' from this closure
  };
  return <button onClick={incrementThreeTimes}>{count}</button>;
}

// ── useEffect — dependency array & cleanup ────────────────
function ChatRoom({ roomId }) {
  React.useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect(); // cleanup — runs before next effect + unmount
  }, [roomId]); // re-runs only when roomId changes

  return <div>Connected to {roomId}</div>;
}

// Common bug: missing dependency causes stale closure
function Timer() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000); // ❌ stale 'count'
    return () => clearInterval(id);
  }, []); // count is captured at 0 forever
  // FIX: setCount(c => c + 1) — functional update avoids the dependency
}

// ── useMemo — memoize expensive computation ───────────────
function ProductList({ products, query }) {
  const filtered = React.useMemo(
    () => products.filter(p => p.name.includes(query)), // only recomputes if products/query change
    [products, query]
  );
  return <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

// ── useCallback — stable function identity ────────────────
function Parent() {
  const [count, setCount] = React.useState(0);
  const handleClick = React.useCallback(() => {
    console.log('clicked');
  }, []); // same function reference across renders
  return <MemoizedChild onClick={handleClick} />; // won't re-render needlessly
}
const MemoizedChild = React.memo(function Child({ onClick }) {
  return <button onClick={onClick}>Click</button>;
});

// ── useRef — DOM access & mutable value without re-render ─
function FocusInput() {
  const inputRef = React.useRef(null);
  React.useEffect(() => inputRef.current.focus(), []);
  return <input ref={inputRef} />;
}

function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => { ref.current = value; }); // stores after render
  return ref.current; // returns value from BEFORE this render
}

// ── useReducer — complex state transitions ────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    case 'reset':      return { count: 0 };
    default: throw new Error('Unknown action: ' + action.type);
  }
}
function Counter2() {
  const [state, dispatch] = React.useReducer(reducer, { count: 0 });
  return (
    <>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}

// ── Custom hook — reusable stateful logic ─────────────────
function useDebounce(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // cancel pending timer on rapid changes
  }, [value, delayMs]);
  return debounced;
}
function SearchBox() {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 400);
  React.useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Reconciliation, Keys & Rendering Behavior",
    icon: "⇄",
    color: "#A855F7",
    desc: "The diffing algorithm, why keys matter, batching, and what actually triggers a re-render.",
    topics: [
      {
        n: "Reconciliation Algorithm & Render Triggers",
        star: true,
        tag: "RENDER",
        desc: `RECONCILIATION: React's algorithm for diffing the previous Virtual DOM tree against the new one to compute the minimal real-DOM patch. A naive tree-diff is O(n³); React uses heuristics to get to O(n):

  1. DIFFERENT ELEMENT TYPES → tear down the old subtree entirely, build the new one from scratch (state is lost). <div> → <span> destroys and rebuilds.
  2. SAME ELEMENT TYPE → keep the DOM node, update only changed attributes, recurse into children.
  3. LISTS OF CHILDREN → matched by KEY. Without keys, React compares by index, which causes wrong matches when items are reordered/inserted/removed (state can leak onto the wrong item).

WHY KEYS MATTER: A stable, unique key lets React tell "this is the same logical item, just moved" vs "this is a new item." Using array INDEX as key is a common anti-pattern when the list can reorder or items can be inserted/removed — it causes incorrect DOM reuse (form input values swapping between rows, component state ending up on the wrong element, unnecessary DOM mutations).

WHAT TRIGGERS A RE-RENDER:
  1. State change in the component (setState/useState setter, even to the "same" object reference if it's an object — React compares with Object.is, so mutating in place and calling setState with the same reference won't re-render).
  2. Parent re-renders → all children re-render by default (regardless of whether their own props changed) UNLESS wrapped in React.memo.
  3. Context value change → all consuming components re-render.
  4. forceUpdate() (class components only, rarely used).

BATCHING: React batches multiple setState calls within the same event handler/lifecycle into a single re-render for performance. React 18's automatic batching extends this to promises, setTimeout, and native event handlers too (previously only batched inside React event handlers).

STRICT MODE double-invocation: In development, React 18 StrictMode intentionally double-invokes function component bodies, and mounts→unmounts→remounts once, to surface side effects that aren't properly cleaned up. This is dev-only and doesn't happen in production.`,
        code: `// ── Why array index as key is dangerous ───────────────────
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        // ❌ if todos are reordered/removed, index-based keys
        // cause React to reuse the wrong DOM node + local state
        <TodoItem key={index} todo={todo} />
      ))}
    </ul>
  );
}
function TodoListFixed({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} /> // ✓ stable, unique id
      ))}
    </ul>
  );
}

// ── Demonstrating the bug: input state gets scrambled ─────
function BuggyList() {
  const [items, setItems] = React.useState(['A', 'B', 'C']);
  return items.map((item, i) => (
    <div key={i}>                          {/* index key */}
      {item}
      <input placeholder={'note for ' + item} /> {/* uncontrolled — keeps its own value */}
    </div>
  ));
  // Removing 'A' from the front shifts every index down by one —
  // React matches by key(index), so the input that WAS attached
  // to 'A' now renders next to 'B', keeping its stale typed value.
}

// ── Object.is comparison — mutating state won't re-render ──
function Broken() {
  const [user, setUser] = React.useState({ name: 'Alice' });
  const handleClick = () => {
    user.name = 'Bob';       // ❌ mutates in place
    setUser(user);           // same reference → Object.is says "unchanged" → no re-render
  };
  const handleClickFixed = () => {
    setUser({ ...user, name: 'Bob' }); // ✓ new object reference → re-renders
  };
}

// ── Automatic batching (React 18+) ────────────────────────
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1); // React 18: batched together —
    setFlag(f => !f);     // only ONE re-render, even inside setTimeout
  }, 0);
}

// ── React.memo — skip re-render if props are shallow-equal ─
const ExpensiveRow = React.memo(function Row({ data }) {
  console.log('rendering', data.id);
  return <li>{data.label}</li>;
}); // parent re-rendering won't re-render this unless 'data' prop changes`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Performance Optimization",
    icon: "⚡",
    color: "#10B981",
    desc: "React.memo, code splitting, virtualization, and diagnosing unnecessary re-renders.",
    topics: [
      {
        n: "Memoization, Code Splitting & Avoiding Re-renders",
        star: true,
        tag: "PERFORMANCE",
        desc: `React.memo: A higher-order component that skips re-rendering a function component if its props are shallow-equal to the previous render. Doesn't help if you pass a new inline object/array/function as a prop every render (shallow equal fails) — pair with useMemo/useCallback in the parent.

WHY OBJECTS/ARRAYS/FUNCTIONS DEFINED INLINE BREAK MEMOIZATION: {} !== {} and () => {} !== () => {} on every render even with identical contents — this is the #1 reason React.memo "doesn't work."

CODE SPLITTING: React.lazy() + Suspense lets you split bundles so route/feature code loads on demand instead of one giant initial bundle — improves first-load performance. Combined with dynamic import().

VIRTUALIZATION (windowing): For long lists, only render the DOM nodes currently visible in the viewport (react-window, react-virtualized) instead of all N items — turns O(n) DOM nodes into O(viewport size).

KEY DIAGNOSTIC TOOLS: React DevTools Profiler (flame graph of render times, "why did this render" highlighting), the "Highlight updates when components render" setting.

LAZY STATE INITIALIZATION: Pass a FUNCTION to useState (not the computed value directly) when the initial value is expensive to compute — the function only runs once on mount, not on every render.

useTRANSITION / useDEFERREDVALUE (React 18 concurrent features): Mark non-urgent state updates as low priority so urgent updates (typing) aren't blocked by expensive re-renders — improves perceived responsiveness without debouncing.`,
        code: `// ── React.memo defeated by inline props ───────────────────
function Parent() {
  const [count, setCount] = React.useState(0);
  return (
    <MemoChild
      config={{ theme: 'dark' }}   // ❌ new object every render — memo fails
      onSave={() => save()}         // ❌ new function every render — memo fails
    />
  );
}
// FIX: hoist/memoize
function ParentFixed() {
  const [count, setCount] = React.useState(0);
  const config = React.useMemo(() => ({ theme: 'dark' }), []);
  const onSave = React.useCallback(() => save(), []);
  return <MemoChild config={config} onSave={onSave} />; // ✓ stable references
}

// ── Lazy initial state — avoid recomputation every render ─
function Table({ rawData }) {
  // ❌ expensiveParse() runs on EVERY render, result thrown away except first
  const [data, setData] = React.useState(expensiveParse(rawData));

  // ✓ function form — only invoked once, on mount
  const [dataFixed] = React.useState(() => expensiveParse(rawData));
}

// ── Code splitting with lazy + Suspense ───────────────────
const Settings = React.lazy(() => import('./Settings'));
function App() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <Settings /> {/* Settings.js only downloaded when this renders */}
    </React.Suspense>
  );
}

// ── Virtualization — render only visible rows ─────────────
import { FixedSizeList } from 'react-window';
function BigList({ items }) {
  const Row = ({ index, style }) => <div style={style}>{items[index]}</div>;
  return (
    <FixedSizeList height={400} width={300} itemCount={items.length} itemSize={35}>
      {Row}
    </FixedSizeList>
  ); // only ~12 DOM nodes exist at a time, even for 100,000 items
}

// ── useDeferredValue — keep typing responsive ─────────────
function SearchResults({ query }) {
  const deferredQuery = React.useDeferredValue(query);
  const results = React.useMemo(
    () => expensiveSearch(deferredQuery), // low priority — won't block keystrokes
    [deferredQuery]
  );
  return <ResultsList results={results} />;
}

// ── Splitting context to avoid mass re-renders ────────────
// ❌ one big context — ANY value change re-renders ALL consumers
const AppContext = React.createContext();

// ✓ split by concern — consumers only re-render for what they use
const UserContext = React.createContext();
const ThemeContext = React.createContext();`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "State Management — Context, Redux & useReducer",
    icon: "⊟",
    color: "#EC4899",
    desc: "Context API mechanics, when to reach for Redux/Zustand, and useReducer as a local Redux pattern.",
    topics: [
      {
        n: "Context API vs Redux — When & Why",
        star: true,
        tag: "STATE",
        desc: `CONTEXT API: Built-in mechanism to pass data through the component tree without manually threading props at every level ("prop drilling"). createContext() → <Provider value={}> → useContext(Context) in any descendant.

CONTEXT'S RE-RENDER GOTCHA: Every component that calls useContext(SomeContext) re-renders whenever the Provider's value changes — even if the consumer only cares about part of the value. This is why splitting contexts by concern (UserContext, ThemeContext) beats one giant AppContext.

CONTEXT IS NOT A STATE MANAGEMENT LIBRARY: It's a dependency-injection mechanism for AVOIDING PROP DRILLING. It has no built-in mechanism for selective subscriptions, middleware, devtools, or time-travel debugging — that's what Redux/Zustand/Recoil add on top.

REDUX: Single immutable store, unidirectional data flow: dispatch(action) → reducer(state, action) → new state → subscribed components re-render (via react-redux's useSelector, which DOES support selective subscription — a component only re-renders if the SPECIFIC slice it selects changes, unlike raw Context).
  Core pieces: store, actions (plain objects describing "what happened"), reducers (pure functions computing new state), middleware (redux-thunk/redux-saga for async side effects).

WHEN TO REACH FOR A STATE LIBRARY vs CONTEXT+useState:
  Context + useState/useReducer: small-to-medium apps, state that changes infrequently (theme, auth user, locale).
  Redux/Zustand: large apps, frequently-changing shared state, need for devtools/time-travel debugging, complex cross-cutting update logic, want selective re-renders without manually splitting contexts.

REDUX TOOLKIT (RTK): The modern, official, opinionated way to write Redux — configureStore, createSlice (auto-generates action creators + reducers, uses Immer under the hood so you can "mutate" draft state safely), createAsyncThunk for async logic. Drastically less boilerplate than classic Redux.`,
        code: `// ── Context API — avoiding prop drilling ──────────────────
const ThemeContext = React.createContext('light');

function App() {
  const [theme, setTheme] = React.useState('dark');
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar /> {/* doesn't need to pass theme down manually */}
    </ThemeContext.Provider>
  );
}
function Toolbar() { return <ThemedButton />; } // no prop drilling through here
function ThemedButton() {
  const theme = React.useContext(ThemeContext); // read directly
  return <button className={theme}>Click</button>;
}

// ── Context re-render gotcha & the fix ────────────────────
// ❌ one big value object — new object every render → ALL consumers re-render
function BadProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [theme, setTheme] = React.useState('light');
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}
// ✓ split contexts + memoize value
function GoodProviders({ children }) {
  const [user, setUser] = React.useState(null);
  const userValue = React.useMemo(() => ({ user, setUser }), [user]);
  return (
    <UserContext.Provider value={userValue}>{children}</UserContext.Provider>
  );
}

// ── useReducer as "local Redux" ───────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    default:
      return state;
  }
}
function Cart() {
  const [state, dispatch] = React.useReducer(cartReducer, { items: [] });
  return <button onClick={() => dispatch({ type: 'ADD_ITEM', payload: { id: 1 } })}>Add</button>;
}

// ── Redux Toolkit slice — modern Redux with less boilerplate
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; }, // "mutation" — Immer handles immutability
    decrementBy: (state, action) => { state.value -= action.payload; },
  },
});
export const { increment, decrementBy } = counterSlice.actions;
const store = configureStore({ reducer: { counter: counterSlice.reducer } });

// In a component:
import { useSelector, useDispatch } from 'react-redux';
function Counter3() {
  const count = useSelector(state => state.counter.value); // selective subscription —
  const dispatch = useDispatch();                            // only re-renders if this slice changes
  return <button onClick={() => dispatch(increment())}>{count}</button>;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Advanced Patterns",
    icon: "◈",
    color: "#F97316",
    desc: "HOCs, render props, compound components, and error boundaries — the composition patterns interviewers use to test design sense.",
    topics: [
      {
        n: "HOCs, Render Props, Compound Components & Error Boundaries",
        star: true,
        tag: "PATTERNS",
        desc: `HIGHER-ORDER COMPONENT (HOC): A function that takes a component and returns a new, enhanced component — withX(Component) => EnhancedComponent. Used for cross-cutting concerns (auth checks, logging, data fetching) before Hooks existed. Downsides: "wrapper hell" (deeply nested trees in DevTools), prop name collisions between HOCs, indirect data flow that's hard to trace.

RENDER PROPS: A component takes a function as a prop (often called "render" or "children") and calls it to determine what to render, passing it internal state. Solves the same code-reuse problem as HOCs but avoids extra wrapper components in the tree — data flow is explicit since it's passed as function arguments.

WHY HOOKS LARGELY REPLACED BOTH: A custom Hook shares logic without adding ANY extra component to the tree at all — no wrapper hell, no prop collisions, explicit data flow. This is why modern React code rarely reaches for HOCs/render props anymore, though you'll still see them in older codebases and some libraries.

COMPOUND COMPONENTS: A set of components that work together to form a cohesive UI, implicitly sharing state via Context, letting the consumer control composition/order/markup while the components manage shared logic internally (e.g., <Select><Select.Option/></Select>, <Tabs><Tabs.Tab/></Tabs>). Gives more flexible, declarative APIs than a single monolithic component with a dozen props.

ERROR BOUNDARIES: Class components (no Hook equivalent exists as of React 18) that catch JS errors anywhere in their child tree during render, log them, and display a fallback UI instead of the whole app crashing. Implemented via static getDerivedStateFromError() (render fallback) and componentDidCatch() (side-effect logging). Do NOT catch errors in event handlers, async code, SSR, or errors thrown in the boundary itself — those need regular try/catch.

PORTALS: ReactDOM.createPortal(child, domNode) renders children into a DOM node OUTSIDE the parent component's DOM hierarchy (e.g., for modals/tooltips that must escape an overflow:hidden or z-index-stacked ancestor) while still participating in the normal React tree for context/event bubbling purposes.`,
        code: `// ── Higher-Order Component ────────────────────────────────
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const user = useCurrentUser();
    if (!user) return <LoginPrompt />;
    return <Component {...props} user={user} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard); // usage: <ProtectedDashboard />

// ── Render props ───────────────────────────────────────────
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  handleMove = (e) => this.setState({ x: e.clientX, y: e.clientY });
  render() {
    return (
      <div onMouseMove={this.handleMove}>
        {this.props.render(this.state)} {/* caller decides what to render */}
      </div>
    );
  }
}
// usage: <MouseTracker render={({x,y}) => <p>{x},{y}</p>} />

// ── Same problem solved with a custom Hook (modern approach)
function useMousePosition() {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  React.useEffect(() => {
    const handler = e => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos; // no wrapper component needed at all
}
function Cursor() {
  const { x, y } = useMousePosition();
  return <p>{x}, {y}</p>;
}

// ── Compound components — shared state via Context ────────
const TabsContext = React.createContext();
function Tabs({ children, defaultIndex = 0 }) {
  const [active, setActive] = React.useState(defaultIndex);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = function TabList({ children }) { return <div className="tab-list">{children}</div>; };
Tabs.Tab = function Tab({ index, children }) {
  const { active, setActive } = React.useContext(TabsContext);
  return (
    <button className={active === index ? 'active' : ''} onClick={() => setActive(index)}>
      {children}
    </button>
  );
};
// usage:
// <Tabs>
//   <Tabs.List>
//     <Tabs.Tab index={0}>Profile</Tabs.Tab>
//     <Tabs.Tab index={1}>Settings</Tabs.Tab>
//   </Tabs.List>
// </Tabs>

// ── Error boundary ─────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, info) { logErrorToService(error, info); }
  render() {
    if (this.state.hasError) return <h2>Something went wrong.</h2>;
    return this.props.children;
  }
}
// usage: <ErrorBoundary><RiskyWidget /></ErrorBoundary>

// ── Portal — render outside the parent DOM hierarchy ──────
function Modal({ children }) {
  return ReactDOM.createPortal(
    <div className="modal-overlay">{children}</div>,
    document.getElementById('modal-root') // escapes overflow:hidden ancestors
  );
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Common Coding Interview Questions",
    icon: "▹",
    color: "#8B5CF6",
    desc: "Frequently asked build-it-live questions: debounced search, infinite scroll, custom hooks, and a simple state machine.",
    topics: [
      {
        n: "Build-It-Live Patterns",
        star: true,
        tag: "CODING",
        desc: `These are the "build a small feature live" style questions that come up repeatedly in React interviews. The evaluation criteria are usually: correct dependency arrays, proper cleanup (no memory leaks / race conditions), and not over-fetching/over-rendering.

COMMON PITFALLS INTERVIEWERS WATCH FOR:
  • Forgetting to cancel/ignore stale async responses (race condition — a slow earlier request resolving AFTER a faster later one, overwriting fresh data with stale data).
  • Missing cleanup in useEffect (event listeners, intervals, subscriptions not removed → memory leaks).
  • Not debouncing/throttling expensive operations tied to fast-firing events (typing, scroll, resize).
  • Mutating state directly instead of creating new references.`,
        code: `// ── Debounced search with race-condition protection ───────
function SearchBox() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    if (!query) { setResults([]); return; }
    let ignore = false; // race-condition guard
    const timer = setTimeout(async () => {
      const res = await fetch('/api/search?q=' + query);
      const data = await res.json();
      if (!ignore) setResults(data); // only apply if this effect wasn't superseded
    }, 400);
    return () => { ignore = true; clearTimeout(timer); }; // cancel stale timer + ignore stale response
  }, [query]);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </>
  );
}

// ── Infinite scroll with IntersectionObserver ─────────────
function InfiniteList() {
  const [items, setItems] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const sentinelRef = React.useRef(null);

  React.useEffect(() => {
    fetchPage(page).then(newItems => setItems(prev => [...prev, ...newItems]));
  }, [page]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setPage(p => p + 1); // load next page when sentinel visible
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
      <div ref={sentinelRef} style={{ height: 1 }} /> {/* trigger element */}
    </div>
  );
}

// ── Custom hook: useFetch with loading/error/abort ────────
function useFetch(url) {
  const [state, setState] = React.useState({ data: null, loading: true, error: null });
  React.useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => controller.abort(); // cancel in-flight request on unmount/url change
  }, [url]);
  return state;
}

// ── Traffic-light / simple state machine with useReducer ──
const LIGHT_TRANSITIONS = { red: 'green', green: 'yellow', yellow: 'red' };
function trafficReducer(state) { return LIGHT_TRANSITIONS[state]; }
function TrafficLight() {
  const [light, dispatch] = React.useReducer(trafficReducer, 'red');
  React.useEffect(() => {
    const timer = setTimeout(() => dispatch(), 2000); // dispatch value ignored by reducer above
    return () => clearTimeout(timer);
  }, [light]);
  return <div className={'light-' + light} />;
}

// ── Click-outside custom hook (common utility question) ───
function useClickOutside(ref, onOutsideClick) {
  React.useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutsideClick();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutsideClick]);
}
function Dropdown({ onClose }) {
  const ref = React.useRef(null);
  useClickOutside(ref, onClose);
  return <div ref={ref} className="dropdown">...</div>;
}`
      },
    ]
  },
  // ─────────────────────────────────────────────────────────────
  {
    cat: "Performance & Concept Cheat Sheet",
    icon: "⚡",
    color: "#10B981",
    desc: "Class vs function component lifecycle mapping, common gotchas, and a rapid-fire summary table.",
    topics: [
      {
        n: "Lifecycle Mapping & Rapid-Fire Summary",
        star: true,
        tag: "SUMMARY",
        desc: `LEGEND: Mapping class-component lifecycle methods to their Hook equivalents — a question that comes up whenever a codebase mixes old and new patterns, or when migrating a legacy app.

CLASS LIFECYCLE → HOOK EQUIVALENT:
  constructor()                     → useState initializer
  componentDidMount()               → useEffect(fn, [])
  componentDidUpdate(prevProps)     → useEffect(fn, [deps])
  componentWillUnmount()            → useEffect return (cleanup) function
  shouldComponentUpdate()           → React.memo (for whole component) / useMemo (for values)
  getDerivedStateFromProps()        → recompute during render, or useEffect for side effects
  static getDerivedStateFromError() → Error Boundaries only (no Hook equivalent)

KEY GOTCHAS RAPID-FIRE:
  • key prop is special — not accessible via props.key inside the component.
  • Never call Hooks conditionally — always top level, same order every render.
  • setState/useState setter is asynchronous — don't read the state variable immediately after calling the setter expecting the new value.
  • Spreading props ({...props}) onto a DOM element passes ALL of them as DOM attributes — can cause "unknown prop" warnings for non-DOM props.
  • dangerouslySetInnerHTML exists for a reason — it's the explicit opt-in for raw HTML injection (XSS risk if content isn't sanitized).
  • Children re-render by default when a parent re-renders, even with unrelated state changes — memoize only after profiling shows it's actually a bottleneck (premature memoization adds complexity for no gain).`,
        code: `// ── Class lifecycle vs Hooks — side by side ───────────────
class Old extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null };
  }
  componentDidMount() {
    fetchData().then(data => this.setState({ data }));
  }
  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) fetchData(this.props.id);
  }
  componentWillUnmount() {
    this.subscription.unsubscribe();
  }
  render() { return <div>{this.state.data}</div>; }
}

function New({ id }) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {                 // componentDidMount + componentDidUpdate combined
    fetchData(id).then(setData);
  }, [id]);
  React.useEffect(() => {                 // separate effect for subscription lifecycle
    const sub = subscribe();
    return () => sub.unsubscribe();       // componentWillUnmount
  }, []);
  return <div>{data}</div>;
}

// ── setState is async — common interview gotcha ───────────
function Broken() {
  const [count, setCount] = React.useState(0);
  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // ❌ still logs OLD value — state hasn't updated yet this render
  };
}

// ── Rendering the same component with different keys resets it
function Profile({ userId }) {
  // key={userId} forces full remount (fresh state) when switching users,
  // instead of reusing the same component instance with stale internal state
  return <UserForm key={userId} userId={userId} />;
}

// ── Rapid-fire complexity/behavior table (as comments) ────
// CONCEPT                 BEHAVIOR
// useState setter          Batched, async, triggers re-render
// useEffect([])            Runs once after mount, cleanup on unmount
// useEffect([deps])        Runs after mount + when any dep changes (Object.is compare)
// useMemo(fn, deps)        Memoizes a VALUE
// useCallback(fn, deps)    Memoizes a FUNCTION reference
// React.memo(Component)    Skips re-render if props shallow-equal
// key prop on list items   Must be stable + unique among siblings, not array index if reorderable
// Context value change     Re-renders ALL consumers, regardless of which field changed
// Error Boundary           Catches render-phase errors in children; NOT event handlers/async`
      },
    ]
  },
];

const TAG_META = {
  OVERVIEW:    { bg: "#0E3A4A", text: "#06B6D4", border: "#0C4A5E" },
  HOOKS:       { bg: "#3A2E0A", text: "#F59E0B", border: "#4A3C0E" },
  RENDER:      { bg: "#2D1A4A", text: "#A855F7", border: "#3A2060" },
  PERFORMANCE: { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
  STATE:       { bg: "#3A1A2E", text: "#EC4899", border: "#4A2040" },
  PATTERNS:    { bg: "#3A1F0A", text: "#F97316", border: "#4A2A0E" },
  CODING:      { bg: "#2A1A4A", text: "#8B5CF6", border: "#3A206A" },
  SUMMARY:     { bg: "#0A2E1E", text: "#10B981", border: "#0C3D28" },
};

export default function ReactInterview() {
  return (
    <RevisionNotesLayout
      pageKey="react-interview"
      title="React JS Interview Questions"
      subtitle="Hooks, reconciliation, performance, patterns, and build-it-live coding questions with explanations and code."
      categoryIcon="⚛️"
      categoryColor="#06B6D4"
      sections={SECTIONS}
      tagMeta={TAG_META}
    />
  );
}

export { SECTIONS };
