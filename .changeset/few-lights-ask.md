---
"@arkenv/bun-plugin": minor
---

Include the `NODE_ENV` environment variable as one of the publicly exposed environment variables so it's possible to type it. Bun already exposes `process.env.NODE_ENV` to the frontend and now it's possible to get it correctly typed.
