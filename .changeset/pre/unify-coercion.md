---
"arkenv": patch
---

#### Unify environment variable coercion execution model

Change the coercion mechanism for the default `arkenv` (ArkType) entry point to use a pre-coercion execution model, aligning it with the `arkenv/standard` entry point. 

- Prevent in-place mutation of the input environment object (like `process.env`) by applying coercion to a shallow copy of the object before validation.
- Remove the `.pipe()` wrapper and unsafe type casting in the ArkType coercion path.
