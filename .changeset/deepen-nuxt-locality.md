---
"@arkenv/nuxt": patch
---

#### Deepen Nuxt boot gate and thin accessor locality

Consolidated legacy and flat schema-shape detection into a single cycle-safe helper shared between schema capture and runtime accessors. Schema loading and boot-gate coercion/application are now separable modules, and flat `arkenv()` entries share dispatch locality with strict client/server entries.
