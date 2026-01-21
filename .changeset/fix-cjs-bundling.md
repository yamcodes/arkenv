---
"arkenv": patch
---

#### Fix CommonJS bundling compatibility

Fixed a crash when ArkEnv is bundled into a CommonJS format using tools like esbuild. This improves compatibility with environments like AWS Lambda and ensures correct interoperability when ArkEnv is used as an external dependency in CommonJS bundles.
