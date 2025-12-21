---
"@repo/scope": minor
---

#### Simplify `port` to handle numbers only

Since ArkEnv now handles coercion at a global level, the `port` keyword has been simplified to the following type:

```ts
type("0 <= number.integer <= 65535")
```
