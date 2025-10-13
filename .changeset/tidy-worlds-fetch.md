---
"@arkenv/vite-plugin": patch
---

#### Fix `import.meta.env` not respecting morphed environment variables

The Vite plugin now properly exposes transformed environment variables through `import.meta.env`. 

Previously, type transformations (`string → number`, `string → boolean`) and default values were lost because the plugin only called `createEnv()` without integrating the results with Vite's environment system. 

Now the plugin uses Vite's `define` option to expose the morphed values, ensuring all schema transformations are respected.
