#!/usr/bin/env bash

# Get Node.js major version
NODE_VERSION=$(node -v | cut -c2- | cut -d. -f1)

# Set NODE_OPTIONS based on Node.js version
if [ "$NODE_VERSION" -ge 25 ]; then
  # Node.js 25+ has Web Storage enabled by default, disable it to avoid localStorage conflicts
  export NODE_OPTIONS="--no-webstorage"
else
  # Node.js 24 and below don't have Web Storage enabled, no flags needed
  export NODE_OPTIONS=""
fi

# Run fumadocs-mdx with the appropriate NODE_OPTIONS
exec pnpm exec fumadocs-mdx "$@"
