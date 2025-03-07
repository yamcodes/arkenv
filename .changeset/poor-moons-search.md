---
"ark.env": patch
---

Switch from picocolors to Chalk

Switch the CLI coloring tool from [picocolors](https://github.com/alexeyraspopov/picocolors) to [Chalk](https://github.com/chalk/chalk). Chalk is a much more popular library that is already included in our lockfile, and is more modern [by being ESM](https://github.com/chalk/chalk#install).