# Library Utilities

This directory contains reusable utility libraries preconfigured for the arkenv application.

These are internal utilities that provide cross-platform functionality and common patterns used throughout the codebase.

## Contents

- **`style-text.ts`** - Cross-platform text styling utility that uses ANSI colors in Node environments and falls back to plain text in browsers.

## Philosophy

- **Zero dependencies** - All utilities are self-contained
- **Cross-platform** - Works in Node, browsers, Bun, Deno, etc.
- **Minimal** - Focused on specific use cases
- **Tested** - Each utility has dedicated unit tests

