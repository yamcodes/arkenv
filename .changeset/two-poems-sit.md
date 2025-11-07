---
"arkenv": patch
---

#### Fix browser compatibility by replacing `util.styleText` with cross-platform ANSI codes

Replace Node.js `util.styleText` with cross-platform ANSI color codes to enable browser compatibility. The library now works in Vite, Bun frontend, and other browser environments while maintaining zero dependencies.

**Changes:**

- Replaced `node:util.styleText` with custom ANSI color implementation
- Added `lib/style-text.ts` utility with environment detection (Node vs browser)
- Uses ANSI color codes in Node environments, plain text in browsers
- Organized reusable utilities into `lib/` folder with dedicated README
- Added comprehensive unit tests covering Node, browser, and edge cases

**Browser Support:**

ArkEnv now works seamlessly in browser environments where Node.js built-ins are unavailable:

```ts
// ✅ Works in Vite
import { createEnv } from "arkenv";

const env = createEnv({
  VITE_API_URL: "string",
  VITE_PORT: "number.port",
});
```

Error messages maintain colored output in Node.js terminals while gracefully falling back to plain text in browsers.
