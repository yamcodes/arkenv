---
"arkenv": minor
---

#### Export `createEnv` as the default export

You can now import `createEnv` as the default export:

```ts
import arkenv from "arkenv";
```

This enables syntax highlighting along with the [ArkType VS Code extension](https://marketplace.visualstudio.com/items?itemName=arktypeio.arkdark):

![ArkType syntax highlighting in VS Code](https://raw.githubusercontent.com/yamcodes/arkenv/main/assets/dx.png)

Note that named imports still work:

```ts
import { createEnv } from "arkenv";
```

**BREAKING CHANGE:** The default export now directly exports `createEnv` instead of an object containing all exports. If you previously used:

```ts
import arkenv from "arkenv";
const env = arkenv.createEnv({ ... });
```

Update to:

```ts
import arkenv from "arkenv";
const env = arkenv({ ... });
```