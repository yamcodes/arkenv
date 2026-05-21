# Performance

## Code Splitting

Split production JavaScript at the route level to optimize loading times. Only essential code is loaded initially — additional parts are fetched lazily as needed.

```tsx
// app/router.tsx
import { lazy } from "react";

const Dashboard = lazy(() => import("./routes/dashboard"));
const Settings = lazy(() => import("./routes/settings"));
```

Avoid excessive splitting — too many small chunks increases request overhead. Focus on critical route-level boundaries.

## Data Prefetching

Prefetch data before the user navigates to reduce perceived load time:

```tsx
function DiscussionLink({ id }: { id: string }) {
    const queryClient = useQueryClient();

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: ["discussion", id],
            queryFn: () => getDiscussion(id),
        });
    };

    return (
        <Link to={`/discussions/${id}`} onMouseEnter={prefetch} onFocus={prefetch}>
            View Discussion
        </Link>
    );
}
```

## State Optimization

### Split State

Don't put everything in a single state — split to avoid unnecessary re-renders:

```tsx
// Instead of one monolithic state:
const [state, setState] = useState({ count: 0, name: "", isOpen: false });

// Split by concern:
const [count, setCount] = useState(0);
const [name, setName] = useState("");
const [isOpen, setIsOpen] = useState(false);
```

### Keep State Close

Keep state as close as possible to where it's used. Don't hoist state to a global store when it's only needed by one component tree.

### State Initializer Functions

Use initializer functions for expensive computations:

```tsx
// Runs on every render:
const [state, setState] = useState(expensiveFn());

// Runs only once:
const [state, setState] = useState(() => expensiveFn());
```

### Atomic State Libraries

For applications tracking many elements at once, consider atomic state libraries like [Jotai](https://jotai.pmnd.rs/) for granular updates.

## Children as Optimization

The `children` prop is the simplest way to avoid unnecessary re-renders. JSX passed as `children` represents an isolated VDOM structure that does not re-render when the parent's state changes:

```tsx
// Not optimized — PureComponent re-renders on every count update
function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
            <PureComponent />
        </div>
    );
}

// Optimized — PureComponent does NOT re-render
function App() {
    return (
        <Counter>
            <PureComponent />
        </Counter>
    );
}

function Counter({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    return (
        <div>
            <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
            {children}
        </div>
    );
}
```

## Context Performance

React Context is good for low-velocity data (themes, user data, small state). For medium/high-velocity data:

- Use [use-context-selector](https://github.com/dai-shi/use-context-selector) for selector support
- Or use state libraries with built-in selectors (Zustand, Jotai)

Before reaching for Context, consider [lifting state up](https://react.dev/learn/sharing-state-between-components#lifting-state-up-by-example) or [proper component composition](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context).

## Styling Performance

For high-frequency updates, prefer zero-runtime styling over runtime CSS-in-JS:

| Zero Runtime (Preferred) | Runtime (Avoid for Perf) |
| ------------------------ | ------------------------ |
| Tailwind CSS             | styled-components        |
| vanilla-extract          | emotion                  |
| CSS Modules              |                          |

## Image Optimization

- Lazy load images not in the viewport.
- Use modern formats (WebP) for faster loading.
- Use `srcset` to load optimal images for the client's screen size.

## Web Vitals

Monitor [Core Web Vitals](https://web.dev/measure/) (LCP, INP, CLS) using Lighthouse and PageSpeed Insights.
