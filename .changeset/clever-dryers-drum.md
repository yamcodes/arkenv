---
"arkenv": patch
---

#### Fix default export autocomplete for better developer experience

The default export now properly aliases as `arkenv` instead of `createEnv`, providing better autocomplete when importing. 

For example, in VS Code (and other IDEs that support autocomplete), when writing the following code:

```ts
// top of file

const env = arke
```

Your IDE will now show completion for `arkenv`, resulting in:

```ts
// top of file
import arkenv from "arkenv";

const env = arkenv();
```

This change maintains full backward compatibility - all existing imports continue to work unchanged (like `import { createEnv } from "arkenv";`).