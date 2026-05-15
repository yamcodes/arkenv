# Security

## Authentication

Client-side authentication enhances UX and complements server-side security — both are essential.

### Token Storage

| Method             | Pros                              | Cons                       |
| ------------------ | --------------------------------- | -------------------------- |
| Application state  | Most secure                       | Lost on refresh            |
| `HttpOnly` cookies | Inaccessible to JS, XSS-resistant | Requires server-side setup |
| `localStorage`     | Persists across sessions          | Vulnerable to XSS          |

**Recommended:** Store tokens in `HttpOnly` cookies configured by the server. The client should not have direct access to the token.

### XSS Prevention

Sanitize all user inputs before displaying them:

```tsx
import DOMPurify from "dompurify";

function MarkdownPreview({ content }: { content: string }) {
    const sanitized = DOMPurify.sanitize(content);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

Avoid `dangerouslySetInnerHTML` unless content is sanitized. React escapes JSX by default, but raw HTML insertion bypasses this.

### User Data Management

Treat user info as global state accessible throughout the application. Options:

- TanStack Query (if already using it) — via [react-query-auth](https://github.com/alan2207/react-query-auth)
- React Context + hooks
- Third-party state management (Zustand, Redux)

The application assumes the user is authenticated if a user object is present.

## Authorization

### RBAC (Role-Based Access Control)

Restrict access based on user roles (`ADMIN`, `USER`, etc.):

```tsx
function RBACGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: React.ReactNode }) {
    const { user } = useAuth();
    if (!user || !allowedRoles.includes(user.role)) return null;
    return children;
}

// Usage
<RBACGuard allowedRoles={["ADMIN"]}>
    <AdminPanel />
</RBACGuard>;
```

### PBAC (Permission-Based Access Control)

For finer-grained control where access depends on resource ownership:

```tsx
function PBACGuard({ check, children }: { check: boolean; children: React.ReactNode }) {
    if (!check) return null;
    return children;
}

// Only the comment author can delete it
<PBACGuard check={comment.authorId === currentUser.id}>
    <DeleteCommentButton commentId={comment.id} />
</PBACGuard>;
```

### Combined Usage

Use the same guard component with either role-based or policy-based checks:

```tsx
// Role-based
<Authorization allowedRoles={["ADMIN"]}>
  <DeleteUserButton />
</Authorization>

// Policy-based
<Authorization policyCheck={comment.authorId === user.id}>
  <DeleteCommentButton />
</Authorization>
```

Use RBAC for broad role-level access. Use PBAC for resource-level ownership checks.

## Security Resources

For a full list of client-side security risks, see [OWASP Top 10 Client-Side Security Risks](https://owasp.org/www-project-top-10-client-side-security-risks/).
