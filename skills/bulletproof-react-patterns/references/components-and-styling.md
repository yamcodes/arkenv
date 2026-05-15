# Components and Styling

## Component Best Practices

### Colocate Things Close to Usage

Keep components, functions, styles, and state as close as possible to where they are used. This improves readability and reduces unnecessary re-renders on state updates.

### Avoid Nested Rendering Functions

Extract inline rendering functions into separate components:

```tsx
// Avoid — gets out of control quickly
function Component() {
    function renderItems() {
        return <ul>...</ul>;
    }
    return <div>{renderItems()}</div>;
}

// Prefer — extract to a separate component
function Items() {
    return <ul>...</ul>;
}

function Component() {
    return (
        <div>
            <Items />
        </div>
    );
}
```

### Limit Props

If a component accepts too many props, split it into multiple components or use composition via `children` or slots.

### Wrapping 3rd Party Components

Wrap third-party components to adapt them to your application's API. This isolates the dependency so swapping the underlying library only requires changing one file:

```tsx
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router";

interface LinkProps extends Omit<RouterLinkProps, "className"> {
    variant?: "default" | "muted";
}

export function Link({ variant = "default", ...props }: LinkProps) {
    return <RouterLink className={linkStyles({ variant })} {...props} />;
}
```

### Component Library

Build abstractions around shared components for consistency and maintainability. Identify repetitions before creating components to avoid wrong abstractions.

## Component Hierarchy

```
Page Components          → route-level, compose features, handle layout
  └── Feature Components → feature-specific, business logic
        └── UI Components      → shared primitives, no business logic
```

### UI Components

- **Stateless** where possible — accept data and callbacks via props.
- **Composable** — use compound component patterns for complex UI.
- **Polymorphic** when needed — use `as` or `asChild` for flexible rendering.

### Feature Components

Feature components can:

- Fetch and mutate data (via query hooks).
- Access feature-specific state.
- Compose UI components with business logic.
- Handle feature-specific error and loading states.

## Component Libraries

### Fully Featured (pre-styled)

- [Chakra UI](https://chakra-ui.com/) — great DX, fast prototyping, accessible out of the box
- [AntD](https://ant.design/) — extensive components, best for admin dashboards
- [MUI](https://mui.com/) — most popular, Material Design or headless
- [Mantine](https://mantine.dev/) — modern, customizable, many built-in hooks

### Headless (unstyled)

Best when implementing a custom design system:

- [Radix UI](https://www.radix-ui.com/)
- [Headless UI](https://headlessui.dev/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)
- [Ark UI](https://ark-ui.com/)
- [Reakit](https://reakit.io/)

### Code-Based (copy-paste, styleable)

Pre-built components provided as source code, not packages:

- [ShadCN UI](https://ui.shadcn.com/)
- [Park UI](https://park-ui.com/)

## Styling Solutions

- [Tailwind CSS](https://tailwindcss.com/) — utility-first, zero runtime
- [vanilla-extract](https://github.com/seek-oss/vanilla-extract) — type-safe, zero runtime
- [Panda CSS](https://panda-css.com/) — type-safe, zero runtime
- [CSS Modules](https://github.com/css-modules/css-modules) — scoped, zero runtime
- [styled-components](https://styled-components.com/) — runtime CSS-in-JS
- [emotion](https://emotion.sh/) — runtime CSS-in-JS

Keep React Server Components in mind — they require zero-runtime styling solutions.

## Storybook

Use [Storybook](https://storybook.js.org/) for developing and testing components in isolation. It serves as a component catalogue for development and discoverability.
