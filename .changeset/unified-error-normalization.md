---
"arkenv": minor
---

#### Refactor error system to use normalized `EnvIssue` and add `safeArkEnv` API

Introduce a unified `EnvIssue` type for programmatic access to validation issues via `ArkEnvError.issues`, and add the non-throwing `safeArkEnv` API.

Error messages now use ANSI colors instead of a bullet-point prefix:

```diff
- - [PORT] must be a valid port number (was "invalid-port")
+ PORT must be a valid port number (was "invalid-port")
```

Note: Header (red), variable path (yellow), and received value (cyan) are now styled with ANSI escape codes. Update any test suites asserting on exact error text.
