---
"@arkenv/cli": patch
---

#### Add default values to the initial env keys

The initial env keys (`NODE_ENV`, `PORT`) now recieve default values so the code runs even if the user didn't set them up in their `.env` file.
