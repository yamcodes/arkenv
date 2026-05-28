---
"@arkenv/cli": minor
---

#### Scaffold scanned environment variables as optional types during bootstrap

The CLI now generates optional schemas without default fallback values for custom/scanned environment keys during bootstrap:
- **ArkType**: Scaffolds fields with `"string?"` instead of `"string = ''"`
- **Zod**: Scaffolds fields with `z.string().optional()` instead of `z.string().default("")`
- **Valibot**: Scaffolds fields with `v.optional(v.string())` instead of `v.optional(v.string(), "")`
