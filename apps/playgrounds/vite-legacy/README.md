# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting, enforced via the monorepo root configuration.

### Configuration

The configuration is located in the root `biome.jsonc` file. It includes:

- **Formatter**: Indentation with tabs, double quotes.
- **Linter**: Recommended rules enabled, with some customizations (e.g., `noConsole` is off for playgrounds).
- **Organize Imports**: Enabled.

### Commands

To run linting and formatting, use the following commands from the root or within the workspace:

```bash
# Check for lint errors and formatting differences
pnpm check

# Fix auto-fixable lint errors and format code
pnpm fix
```

