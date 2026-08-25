---
"@arkenv/nextjs": minor
---

#### Add virtual `.arkenv/` artifact placement and hybrid barrel resolution

The Next.js integration now emits its generated runtime factory into a hidden `.arkenv/` directory at the project root rather than writing into your editable `src/` source tree. A companion `index.ts` barrel export allows clean directory-level imports without deep subpath traversal.

The `withArkEnv` configuration wrapper now automatically registers `turbopack.resolveAlias` and Webpack resolve aliases for `@/.arkenv`, `.arkenv`, and `#arkenv/env`. In strict layout, an ambient `.d.ts` declaration is also generated so server schemas automatically inherit client variables without manual `extends` configuration.

Existing projects specifying a custom `outputPath` in `withArkEnv` continue to work unchanged.

Usage:

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withArkEnv } from "@arkenv/nextjs/config";

const nextConfig: NextConfig = {};

export default withArkEnv(nextConfig);
```

```ts
// src/env.ts
import arkenv from "@/.arkenv";

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string",
});
```

```tsx
// src/app/page.tsx
import { env } from "@/env";

export default function Page() {
  return <h1>API URL: {env.NEXT_PUBLIC_API_URL}</h1>;
}
```
