## 1. Break the Symlink and Rewrite Root README

- [ ] 1.1 Remove the symlink: `rm README.md` and create a new standalone `README.md` at the root
- [ ] 1.2 Populate the new root `README.md` with: logo, badges, tagline, demo GIF, and a prominent "Read the docs →" CTA link — nothing else
- [ ] 1.3 Verify the root README renders correctly on GitHub (preview locally or via a markdown renderer)

## 2. Rewrite Package README

- [ ] 2.1 Rewrite `packages/arkenv/README.md` to match the plugin README pattern: package name heading, one-sentence description, "Read the docs →" link, npm install snippet, and a "Related" section
- [ ] 2.2 Confirm the package README no longer duplicates any prose from the root README
- [ ] 2.3 Verify the package README renders correctly on npm (check markdown preview)

## 3. Verify

- [ ] 3.1 Diff both rewritten READMEs against each other — confirm there are no shared prose sections
- [ ] 3.2 Spot-check that all links in both READMEs resolve (docsite link, badges, etc.)
