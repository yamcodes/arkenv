---
"@arkenv/vite-plugin": patch
"arkenv": patch
---

#### Add declaration maps for better IDE experience

Enable TypeScript declaration maps so that when you use "Go to Definition" in your IDE, it navigates directly to the original source code instead of the generated type definition files. This makes it easier to explore and understand how the packages work.
