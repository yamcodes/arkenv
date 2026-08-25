---
"@arkenv/fumadocs-ui": minor
---

#### Replace docs "Copy Markdown" with a Copy page control

Desktop docs pages now put a split **Copy page** button beside the title (copy plus a three-column grid menu for Markdown, AI chats, and GitHub). Narrow viewports show an inline **Copy for LLM** row under the description instead of the old bordered toolbar.

Usage:

```tsx
<AIActions
  only="desktop"
  markdownUrl={`${page.url}.mdx`}
  pageUrl={page.url}
  githubUrl={editHref}
/>
<AIActions
  only="mobile"
  markdownUrl={`${page.url}.mdx`}
  pageUrl={page.url}
  githubUrl={editHref}
/>
```
