---
"@arkenv/nextjs": major
---

#### Remove `ArkEnvScript` and `globalThis.__arkenv_env__`

`<ArkEnvScript />` is no longer exported. Codegen `runtimeEnv` no longer
reads `globalThis.__arkenv_env__`; client public values follow Next.js
build-time inlining of `process.env.NEXT_PUBLIC_*`.

**BREAKING CHANGE**: Delete any `<ArkEnvScript />` usage from your root
layout. Rebuild (or retag) images when public client values change. For
runtime public-env injection without a rebuild, use a dedicated
ecosystem tool such as `next-runtime-env`, or keep dynamic public config
on the server and pass it as props. See the Next.js and Docker guide.
