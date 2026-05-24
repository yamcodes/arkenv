# Unified runtimeEnv in Next.js integration

To prevent environment variables from being undefined at runtime due to Next.js's build-time AST replacement of `process.env`, we decided to enforce strict typing on the `runtimeEnv` configuration parameter. Client-side and shared keys must be explicitly destructured and passed to `runtimeEnv`, while server-only keys remain optional and automatically fall back to the global `process.env` when omitted. This provides compile-time safety for browser-inlined variables without the boilerplate of manually mapping every server secret.
