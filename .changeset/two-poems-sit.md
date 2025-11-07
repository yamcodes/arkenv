---
"arkenv": patch
---

#### Fix browser compatibility by replacing `util.styleText` with cross-platform ANSI codes

Replace Node.js `util.styleText` with cross-platform ANSI color codes to fix the "Module 'node:util' has been externalized for browser compatibility" error in browser environments. The library still maintains zero dependencies!

**Changes:**

- Replaced `node:util.styleText` with custom ANSI implementation
- Added environment detection (uses ANSI in Node, plain text in browsers)
- Organized utilities into `lib/` folder with comprehensive tests

```ts
// No longer throws "node:util has been externalized" error
import { createEnv } from "arkenv";

const env = createEnv({
  VITE_API_URL: "string",
  VITE_PORT: "number.port",
});
```
