---
"arkenv": minor
---

#### Refactor error system to use normalized `EnvIssue` and add `safeArkenv` API

Unify validation error formatting across ArkType and Standard Schema engines, introduce the `EnvIssue` type for programmatic access via `ArkEnvError.issues`, add the non-throwing `safeArkenv` API, and default to redacting credentials in stringified error reports.

**BREAKING CHANGE**: The exact text format of the `message` property on thrown `ArkEnvError` instances has changed: the bullet-point prefix (`- `) was removed from inline error formatting, and ANSI color styles (red for header, yellow for variable paths, cyan for received values) were introduced. Check and update any test suites that assert on exact error message text.

