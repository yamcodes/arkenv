---
"arkenv": patch
---

#### Handle pre-parsed primitives gracefully in coercion logic

Updated the core coercion logic to defensively skip values that are not strings. This ensures ArkEnv won't crash or behave unpredictably when passed configuration objects that have already been parsed into numbers, booleans, or complex objects by other systems (such as Nuxt's `runtimeConfig`).
