---
"@arkenv/vite-plugin": patch
---

#### Fix default export autocomplete for better developer experience

The default export now properly aliases as `arkenv` instead of being anonymous, providing better autocomplete when importing.

For example, in VS Code (and other IDEs that support autocomplete), when writing the following code:

```ts
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		arke // Your cursor is here
	],
});

```

Your IDE will now show completion for `arkenv`, resulting in:

```ts
import arkenv from "@arkenv/vite-plugin";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		arkenv(), // Your cursor is here
	],
});
```

This change maintains full backward compatibility - all existing imports continue to work unchanged.
