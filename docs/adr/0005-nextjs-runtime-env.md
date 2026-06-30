# ADR 0005: Unified runtimeEnv in Next.js integration

## Status

Accepted

## Context

To prevent environment variables from being undefined at runtime due to Next.js's build-time AST replacement of `process.env`.

## Decision

We decided to enforce strict typing on the `runtimeEnv` configuration parameter. Client-side and shared keys must be explicitly destructured and passed to `runtimeEnv`, while server-only keys remain optional and automatically fall back to the global `process.env` when omitted.

## Consequences

- Provides compile-time safety for browser-inlined variables.
- Avoids the boilerplate of manually mapping every server secret.
