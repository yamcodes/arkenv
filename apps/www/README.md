# ArkEnv site

Welcome! We are live on [arkenv.js.org](https://arkenv.js.org) :rocket:

## Local development

From the repo root:

```sh
pnpm www
```

This starts a single `next dev` server at [http://localhost:3000](http://localhost:3000).

Video processing follows [next-video](https://github.com/muxinc/next-video): add files to `videos/`, then run a one-shot `next-video sync`. `predev` runs that sync before the dev server starts so pending uploads can resume. Do not add `next-video sync -w` beside `next dev` — Next.js 16.2 treats the extra config load as a second dev server and exits on `.next/dev/lock`.

```sh
# from apps/www, after adding or replacing a file in videos/
pnpm video:sync
```

Commit the generated `videos/*.json` sidecars. Source media in `videos/` stay gitignored.
