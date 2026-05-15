# Project Structure

Organize by feature, not by file type. Most code lives in `src/`:

```
src/
├── app/                # Application shell
│   ├── routes/         # Route definitions and page components
│   ├── app.tsx         # Main application component
│   ├── provider.tsx    # Compose all providers (query, auth, theme, etc.)
│   └── router.tsx      # Application router configuration
├── assets/             # Static files (images, fonts, etc.)
├── components/         # Shared, reusable UI components
│   ├── ui/             # Primitives (Button, Input, Modal, etc.)
│   └── layouts/        # Layout shells (Sidebar, Header, etc.)
├── config/             # Environment variables, constants
├── features/           # Feature-based modules (see below)
├── hooks/              # Shared custom hooks
├── lib/                # Pre-configured library wrappers (axios, dayjs, etc.)
├── stores/             # Global client state (zustand, jotai, etc.)
├── testing/            # Test utilities, MSW handlers, factories
├── types/              # Shared TypeScript types
└── utils/              # Pure utility functions
```

## Feature Module Structure

Each feature is self-contained with only the folders it needs:

```
src/features/awesome-feature/
├── api/            # API request declarations and query hooks
├── assets/         # Static files for this feature
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── stores/         # State stores for this feature
├── types/          # TypeScript types for this feature
└── utils/          # Utility functions for this feature
```

Only include folders that are necessary for the feature.

## Rules

- Features should not import from other features directly.
- Shared code goes in `components/`, `hooks/`, `lib/`, or `utils/`.
- Promote code to shared directories only when reused by 2+ features.
- Compose features at the application level, not within each other.
- Prefer direct imports over barrel re-exports for better Vite tree-shaking.

## Enforce Cross-Feature Import Restrictions

Use ESLint `import/no-restricted-paths` to prevent features from importing each other:

```javascript
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      {
        target: "./src/features/auth",
        from: "./src/features",
        except: ["./auth"],
      },
      {
        target: "./src/features/comments",
        from: "./src/features",
        except: ["./comments"],
      },
      {
        target: "./src/features/discussions",
        from: "./src/features",
        except: ["./discussions"],
      },
      {
        target: "./src/features/users",
        from: "./src/features",
        except: ["./users"],
      },
      // Add one entry per feature...
    ],
  },
],
```

## Enforce Unidirectional Architecture

Code flows one direction: **shared → features → app**.

- Features can import from shared modules but not from `app/`.
- Shared modules cannot import from features or app.

```javascript
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      // features cannot import from app
      { target: "./src/features", from: "./src/app" },
      // shared modules cannot import from features or app
      {
        target: [
          "./src/components",
          "./src/hooks",
          "./src/lib",
          "./src/types",
          "./src/utils",
        ],
        from: ["./src/features", "./src/app"],
      },
    ],
  },
],
```

This architecture applies across meta-frameworks (Next.js, Remix, React Native).
