---
"@arkenv/core": patch
---

#### Support ArkType 3

An invalid environment no longer throws `TypeError: Cannot convert undefined or null to object` in place of its report with ArkType 3, whose `ArkErrors` is not an array and has no `byPath`. The report reads the same on ArkType 2 and 3: each line still ends with the value it got, like `PORT must be a number (was a string)`, though ArkType 3 leaves it out of its messages. `number.Infinity` and `number.NegativeInfinity` are coerced from strings on both.

The `arktype` peer dependency now accepts `^3.0.0` beside `^2.1.22`.
