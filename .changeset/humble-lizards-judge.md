---
"@repo/keywords": minor
---

#### Remove unused strict parsing keywords

Removed `parsedNumber` and `parsedBoolean` strict morphs. These internal-only keywords are no longer necessary as ArkEnv now handles coercion centrally via the **Selective Path Coercion** mapper, allowing the use of standard ArkType base types.

**BREAKING**: `parsedNumber` and `parsedBoolean` have been removed from `@repo/keywords`.
