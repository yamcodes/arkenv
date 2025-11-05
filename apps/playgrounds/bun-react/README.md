# bun-react-template

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

This app lets you check environment variables by name. To test this feature:

1. Create a `.env` file in this directory with variables prefixed with `BUN_PUBLIC_*`:

```env
BUN_PUBLIC_API_URL=http://localhost:3000
BUN_PUBLIC_API_KEY=demo_key_12345
BUN_PUBLIC_FEATURE_ANALYTICS=true
BUN_PUBLIC_APP_NAME=Bun React App
```

2. Restart the dev server (`bun dev`)
3. Enter a variable name (e.g., `BUN_PUBLIC_API_URL`) in the input field and click "Check" to see its value and type

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
