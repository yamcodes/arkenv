---
"@arkenv/vite-plugin": patch
---

#### Fix "Type instantiation is excessively deep" error

Fix a rare issue where in some cases, using `arkenv` could cause "Type instantiation is excessively deep and possibly infinite" errors. This was [reported](https://github.com/yamcodes/arkenv/issues/497) in the ArkEnv Vite Plugin along with [ArkType 2.1.28](https://github.com/arktypeio/arktype/blob/HEAD/ark/type/CHANGELOG.md#2128), and was fixed by optimizing internal type inference in the plugin.
sor