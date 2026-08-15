# ArkEnv site

Welcome! We are live on [arkenv.js.org](https://arkenv.js.org) :rocket:

## Local development

From the repo root:

```sh
pnpm www
```

This starts a single `next dev` server at [http://localhost:3000](http://localhost:3000). Video assets are processed once during `predev` (`next-video sync`); there is no live `videos/` watcher beside the dev server.

To add or update a docs video, place the file in `videos/` and restart `pnpm www`, or run `pnpm exec next-video sync` from this directory.
