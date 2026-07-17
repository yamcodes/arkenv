# Project standards

## Eslint

Configure rules in `.eslintrc.js` (or flat config) to identify and prevent common errors. Enforces consistency throughout the codebase and catches mistakes early.

## Prettier

Enable "format on save" in your IDE. Code is automatically formatted according to `.prettierrc`. If auto-formatting fails, it signals a potential syntax error. Integrate with ESLint for combined formatting and linting.

## TypeScript

Use TypeScript for catching issues during large refactoring that ESLint may miss. When refactoring, update type declarations first, then resolve TypeScript errors throughout the project. TypeScript checks types at build time - it does not prevent runtime failures.

Resource: [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Husky + lint-staged

Run code validations before each commit to maintain high standards:

```shell
npm install -D husky lint-staged
npx husky init
```

```jsonc
// package.json
{
    "lint-staged": {
        "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.{json,md,yml}": ["prettier --write"],
    },
}
```

## Absolute imports

Always configure absolute imports to avoid messy relative paths like `../../../component`:

```jsonc
// tsconfig.json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
        },
    },
}
```

Use `@/*` as the single alias - it's short, unambiguous, and clearly distinguishes source imports from `node_modules`.

```typescript
// Instead of this:
import { Button } from "../../../components/ui/button";

// Use this:
import { Button } from "@/components/ui/button";
```

## File naming conventions

Enforce kebab-case for files and folders using ESLint:

```javascript
"check-file/filename-naming-convention": [
  "error",
  { "**/*.{ts,tsx}": "KEBAB_CASE" },
  { ignoreMiddleExtensions: true }, // supports names like babel.config.js
],
"check-file/folder-naming-convention": [
  "error",
  { "src/**/!(__tests__)": "KEBAB_CASE" },
],
```

## Naming conventions

| Item        | Convention              | Example                   |
| ----------- | ----------------------- | ------------------------- |
| Components  | PascalCase              | `UserCard.tsx`            |
| Hooks       | camelCase, `use` prefix | `useUsers.ts`             |
| Utilities   | camelCase               | `formatDate.ts`           |
| Types       | PascalCase              | `User`, `CreateUserInput` |
| Constants   | UPPER_SNAKE_CASE        | `MAX_RETRIES`             |
| Directories | kebab-case              | `user-settings/`          |
| Files       | kebab-case              | `user-card.tsx`           |
