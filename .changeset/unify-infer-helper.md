---
"arkenv": patch
---

#### Add `Infer<T>` helper to resolve environment variable types

Introduce the `Infer<T>` type helper, allowing developers to extract the inferred output types of their environment schemas. It supports both declarative schema shapes and compiled schemas (like Zod or ArkType types).

Usage:

```ts
import { createEnv, type Infer } from "arkenv";
import { type } from "arktype";

const schema = {
	PORT: type.number
};

export type Env = Infer<typeof schema>;
```
