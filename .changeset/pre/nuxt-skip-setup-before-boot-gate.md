---
"@arkenv/nuxt": patch
---

Skip all Nuxt module setup (including boot-gate hooks) when no schema file is found, matching the warn-and-bail contract.
