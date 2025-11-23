# bun-react-tailwind-shadcn-template

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

## Environment Variables

This example includes a section that displays the `BUN_PUBLIC_MY_VALUE` environment variable. To set it up:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your `BUN_PUBLIC_MY_VALUE`:
   ```env
   BUN_PUBLIC_MY_VALUE=Your custom value here
   ```

3. The environment variable will be displayed in the "Environment Variables" section of the app.

**Note:** In Bun, client-side environment variables must be prefixed with `BUN_PUBLIC_` to be accessible in the browser.

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

