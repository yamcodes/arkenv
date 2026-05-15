# Error Handling

## API Errors

Implement an interceptor on the API client to manage errors centrally:

- Trigger notification toasts for user-facing errors.
- Log out unauthorized users (401 responses).
- Refresh tokens automatically.
- Never expose raw error objects to users.

```typescript
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 401) {
            // Log out or refresh token
        }

        // Show user-friendly notification
        addNotification({ type: "error", title: "Error", message });

        return Promise.reject(error);
    },
);
```

## Error Boundaries

Use multiple error boundaries placed at different levels rather than a single one for the entire app. If an error occurs, it is contained locally without disrupting the whole application.

### Error Hierarchy

```
App Error Boundary          → catches unrecoverable crashes
  └── Route Error Boundary     → catches route-level failures, shows retry
        └── Feature Error Boundary   → catches feature-specific errors
```

### Usage Pattern

```tsx
<ErrorBoundary fallback={<FeatureError />}>
    <Suspense fallback={<FeatureSkeleton />}>
        <UserDashboard />
    </Suspense>
</ErrorBoundary>
```

Wrap each route and major feature section in its own boundary with meaningful fallback UI.

## Error Tracking

Use tools like [Sentry](https://sentry.io/) to track production errors. Don't build custom solutions — purpose-built tools provide:

- Platform and browser context
- Stack traces with source maps
- Error grouping and deduplication
- Alerting and dashboards

Upload source maps to Sentry to see exactly where in your source code the error occurred.

## Typed Error Responses

Define consistent error response types:

```typescript
type ApiError = {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
};
```

Use these types in error handling to provide structured, user-friendly messages.
