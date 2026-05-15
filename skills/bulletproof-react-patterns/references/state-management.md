# State Management

Divide state into categories based on usage rather than storing everything centrally.

## State Categories

| State Type         | Description                                       | Solutions                                              |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Component State    | Local to a component, passed as props to children | `useState`, `useReducer`                               |
| Application State  | Global UI state (modals, notifications, theme)    | Context + hooks, Zustand, Jotai, Redux Toolkit, XState |
| Server Cache State | Remote data cached on the client                  | TanStack Query, SWR, Apollo Client, URQL, RTK Query    |
| Form State         | Form inputs, validation, submission               | React Hook Form, Formik, React Final Form              |
| URL State          | Data in the address bar (params, query strings)   | React Router, URL search params                        |

## Component State

Start by defining state within the component. Elevate to a higher level only if needed elsewhere.

```tsx
const [isOpen, setIsOpen] = useState(false);
```

Use `useReducer` when a single action should update multiple pieces of state.

## Application State

Localize state as closely as possible to the components that need it. Avoid globalizing state prematurely.

Good options:

- [Zustand](https://github.com/pmndrs/zustand) — minimal, hooks-based
- [Jotai](https://github.com/pmndrs/jotai) — atomic, great for frequent granular updates
- [Redux Toolkit](https://redux-toolkit.js.org/) — structured, excellent DevTools
- [XState](https://xstate.js.org/) — state machines for complex workflows
- React Context + hooks — built-in, best for low-velocity data (themes, user info)

Use [use-context-selector](https://github.com/dai-shi/use-context-selector) if Context causes performance issues (most state libraries have selectors built in).

## Server Cache State

Never copy query data into `useState` — use the query result directly.

```tsx
// Don't do this
const { data } = useUsers();
const [users, setUsers] = useState(data); // stale copy

// Do this
const { data: users } = useUsers(); // always fresh
```

Good options:

- [TanStack Query](https://tanstack.com/query) — REST + GraphQL
- [SWR](https://swr.vercel.app/) — REST + GraphQL
- [Apollo Client](https://www.apollographql.com/) — GraphQL
- [URQL](https://formidable.com/open-source/urql/) — GraphQL
- [RTK Query](https://redux-toolkit.js.org/rtk-query) — REST

## Form State

Create abstracted `Form` and input field components that wrap the library and adapt to your application:

```tsx
// components/ui/form/form.tsx — wraps React Hook Form
// components/ui/form/input.tsx — wraps form input primitives
```

Integrate with validation libraries like [Zod](https://github.com/colinhacks/zod) or [Yup](https://github.com/jquense/yup).

Forms can be [controlled or uncontrolled](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components) — choose based on need.

## URL State

Use routing solutions to access and control URL parameters:

```tsx
// /app/discussions/:id
const { id } = useParams();

// /app?page=2&sort=newest
const [searchParams] = useSearchParams();
```

URL state is ideal for filters, pagination, active tabs, and shareable views.

## Key Principles

- Don't mix server and client state.
- Start local, elevate state only when necessary.
- Don't rush to Context — consider lifting state up or composition first.
- For high-frequency updates, consider atomic state libraries (Jotai) over Context.
