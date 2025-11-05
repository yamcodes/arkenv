#!/bin/bash

# Update Playwright and download new browser binaries and their dependencies:
pnpm install --save-dev @playwright/test@latest
pnpm exec playwright install --with-deps

# Check your installed version:
pnpm exec playwright --version

# Source: https://playwright.dev/docs/intro#updating-playwright
