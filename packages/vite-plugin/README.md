# `@arkenv/vite-plugin`

[Vite](https://vite.dev/) plugin to validate environment variables at build-time with ArkEnv.

<br/>
<br/>
<br/>

## [Read the docs →](https://arkenv.js.org/docs/vite-plugin)

<br/>
<br/>

## Features

- Build-time validation - app won't start if environment variables are invalid
- Typesafe environment variables backed by TypeScript
- Access to ArkType's powerful type system

## Installation

<details open>
<summary>npm</summary>

```sh
npm install @arkenv/vite-plugin arktype
```
</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add @arkenv/vite-plugin arktype
```
</details>

<details>
<summary>Yarn</summary>

```sh
yarn add @arkenv/vite-plugin arktype
```
</details>

<details>
<summary>Bun</summary>

```sh
bun add @arkenv/vite-plugin arktype
```
</details>

## FAQ

### Why is this a Vite only plugin? (And not a Rollup plugin?)

This plugin uses [the Vite specific `config` hook](https://vite.dev/guide/api-plugin.html#config), which is not available in Rollup.

## Examples

* [with-vite-react-ts](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts)

## Related

- [ArkEnv](https://arkenv.js.org) - Core library and docs
- [ArkType](https://arktype.io/) - Underlying validator / type system
