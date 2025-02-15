---
"ark.env": minor
---

Rename main function to `env` and use support a default export

This change allows importing and using the library in the following way:

```ts
import ark from 'ark.env';

const env = ark.env({
  HOST: host,
  PORT: port,
});
```

You can also import the `env` function (and any other exports) directly:

```ts
import { env } from 'ark.env';
```

