# Testing

Focus on integration and e2e tests for the highest confidence. Unit tests are useful for shared components and complex logic, but the real value comes from testing how parts work together.

## Types of Tests

### Unit Tests

Test individual parts in isolation. Best for shared components, utility functions, and complex logic in single components.

```tsx
// components/ui/dialog/confirmation-dialog/__tests__/confirmation-dialog.test.tsx
test("renders confirmation dialog with message", () => {
    render(<ConfirmationDialog title="Delete?" confirmButton={<Button>Yes</Button>} />);
    expect(screen.getByText("Delete?")).toBeInTheDocument();
});
```

### Integration Tests

Test how different parts of your application work together. Focus most of your testing effort here.

```tsx
// app/routes/app/discussions/__tests__/discussion.test.tsx
test("user can create and view a discussion", async () => {
    render(<DiscussionPage />);

    await userEvent.click(screen.getByRole("button", { name: /create/i }));
    await userEvent.type(screen.getByLabelText(/title/i), "New Discussion");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("New Discussion")).toBeInTheDocument();
});
```

### End-to-End (E2E) Tests

Evaluate the entire application (frontend + backend) by simulating real user interactions.

```typescript
// e2e/tests/smoke.spec.ts
test("user can log in and view dashboard", async ({ page }) => {
    await page.goto("/");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button:has-text("Sign in")');
    await expect(page.locator("h1")).toContainText("Dashboard");
});
```

## Test Strategy

| Layer       | Tool                  | What to Test                                    |
| ----------- | --------------------- | ----------------------------------------------- |
| Components  | Testing Library       | Render output, user interactions, a11y          |
| Hooks       | renderHook            | State changes, side effects                     |
| API         | MSW                   | Request/response handling, error states         |
| Integration | Testing Library + MSW | Full feature flows (render → interact → verify) |
| E2E         | Playwright            | Critical user journeys                          |

## Recommended Tooling

### Vitest

Powerful testing framework similar to Jest, works well with modern tooling (Vite). Highly customizable and flexible.

### Testing Library

Test your app the way a real user would use it — test rendered output, not implementation details. If you refactor internal state management, tests should still pass as long as the UI behavior is the same.

### Playwright

Run e2e tests in automated fashion:

- **Browser mode** — opens a real browser with visualization tools. Use locally during development.
- **Headless mode** — runs without UI. Use in CI/CD on every deploy.

### MSW (Mock Service Worker)

Mock API at the network level inside a service worker. Intercepts HTTP requests and returns desired responses based on handlers.

```typescript
// testing/mocks/handlers/auth.ts
import { http, HttpResponse } from "msw";

export const authHandlers = [
    http.post("/api/login", async ({ request }) => {
        const { email } = await request.json();
        return HttpResponse.json({ user: { email, role: "USER" } });
    }),
];
```

Benefits:

- No hardcoded response data in components.
- Use real HTTP calls during testing.
- Prototype frontends without a backend.
- Design API endpoints and business logic in handlers.

### Data Models

Define mock data models for consistent test data:

```typescript
// testing/mocks/db.ts
import { factory, primaryKey } from "@mswjs/data";

export const db = factory({
    user: {
        id: primaryKey(String),
        email: String,
        role: () => "USER",
    },
    discussion: {
        id: primaryKey(String),
        title: String,
        body: String,
    },
});
```

## Testing Principles

- Test behavior, not implementation.
- Mock at the network boundary (MSW), not at the hook/component level.
- Keep test files colocated with the code they test.
- Use test factories to generate consistent test data.
