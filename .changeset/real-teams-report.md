---
"arkenv": patch
---

#### Fix "Type instantiation is excessively deep" error

Fixed "Type instantiation is excessively deep and possibly infinite" errors when using the ArkEnv with complex ArkType schemas. This was [reported](https://github.com/yamcodes/arkenv/issues/497) in the ArkEnv Vite Plugin along with [ArkType 2.1.28](https://github.com/arktypeio/arktype/blob/HEAD/ark/type/CHANGELOG.md#2128), and was fixed by an overall improvement of type stability including optimizing how generics are passed to the validation logic.
