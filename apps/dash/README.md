# Dash

Maintainer dashboard for ArkEnv. It is a private workspace app, not part of
CI, and not published to npm.

The UI is Dashfy ([dashfy.dev](https://dashfy.dev)): GitHub widgets for
`yamcodes/arkenv`, plus JSON widgets for npm dist-tags and download counts.
The Dashfy server validates `HOST`, `PORT`, and `GITHUB_TOKEN` with
`@arkenv/core`.

This app is AGPL-3.0-or-later because of Dashfy. The rest of the repository
stays MIT.

## Run

1. Copy `.env.example` to `.env` and set `GITHUB_TOKEN` (optional, but GitHub
   widgets rate-limit quickly without one).
2. From the repo root, run `pnpm dash`.

That builds `@arkenv/core` if needed, then starts the Dashfy server on
[http://127.0.0.1:5001](http://127.0.0.1:5001) and the Vite client on
[http://localhost:3001](http://localhost:3001). Open the client URL. The
client is on **3001** so it does not collide with `pnpm www` on 3000.

Scripts are named `dash` / `dash:client` / `dash:server` on purpose: they are
not `dev`, `build`, or `test`, so `pnpm dev` / `pnpm build` / `pnpm typecheck`
do not start this app.

## Boards

Dashfy rotates these two dashboards:

- **ArkEnv repo** — badge, PRs, branches, commit activity, latest Actions run
- **Release** — `arkenv` / `@arkenv/core` / `@arkenv/nextjs` npm tags and
  weekly downloads

Edit `dashfy.config.yml` to change widgets. The server watches that file.

## Extensions

Add more with the Dashfy CLI from this directory:

```sh
pnpm dlx dashfy@latest add
```
