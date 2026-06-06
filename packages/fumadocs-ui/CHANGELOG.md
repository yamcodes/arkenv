# @ArkEnv/fumadocs-ui

## 0.0.8

### Patch changes

- #### Fix hamburger menu fade-in behavior on mobile *[`#935`](https://github.com/yamcodes/arkenv/pull/935) [`f1ee3de`](https://github.com/yamcodes/arkenv/commit/f1ee3de8c9cece2669ab4091aa992b25579a6b4e) [@yamcodes](https://github.com/yamcodes)*

## 0.0.7

### Patch changes

- Fix `arkenvComponents` typesafety issue when used in getMDXComponents *[`#835`](https://github.com/yamcodes/arkenv/pull/835) [`2b41340`](https://github.com/yamcodes/arkenv/commit/2b41340990cee90e7cc4a81b189d0be71706c847) [@renovate](https://github.com/apps/renovate)*

## 0.0.6

### Patch changes

- #### Fix transparent hamburger menu background issue on mobile *[`9237bf5`](https://github.com/yamcodes/arkenv/commit/9237bf5bc4ded6020078ffa9e231af8be9581fba) [@yamcodes](https://github.com/yamcodes)*

## 0.0.5

### Patch changes

- #### Hide esc button hint for search on mobile *[`34cf4fb`](https://github.com/yamcodes/arkenv/commit/34cf4fb9d8d97383661f85d255e4ee233d7dff96) [@yamcodes](https://github.com/yamcodes)*

## 0.0.4

### Patch changes

- #### Add `Header` component *[`#828`](https://github.com/yamcodes/arkenv/pull/828) [`e1f3183`](https://github.com/yamcodes/arkenv/commit/e1f3183f0fbdf5ea4fe5f529a061fdf451fba31c) [@yamcodes](https://github.com/yamcodes)*

  `@arkenv/fumadocs-ui` now exports a `Header` component for building site-wide navigation headers.

  ```tsx
  import { Header } from "@arkenv/fumadocs-ui/components";

  <Header
    logo={<MyLogo />}
    links={[
      { text: "Docs", url: "/docs" },
      { text: "Blog", url: "/blog" },
    ]}
    actions={[<SearchToggle />, <ThemeToggle />]}
    menuActions={[<ThemeToggle />]}
    menuSocialActions={[<GitHubLink />]}
    sidebarTrigger={<MySidebarTrigger />}
  />;
  ```

  The header is fixed to the top of the viewport and adapts its appearance as the user scrolls — transparent when at the top of the page, blurred with a semi-transparent background once the user scrolls down.

  On mobile the header renders a full-screen dropdown menu. Nav links are stacked at the top, an "Appearance" row (label + `menuActions`) sits above a centered row of `menuSocialActions`. An optional `sidebarTrigger` slot renders left of the logo for layouts that have a docs sidebar.

- #### Expand `css/theme.css` *[`#828`](https://github.com/yamcodes/arkenv/pull/828) [`e1f3183`](https://github.com/yamcodes/arkenv/commit/e1f3183f0fbdf5ea4fe5f529a061fdf451fba31c) [@yamcodes](https://github.com/yamcodes)*

  `@arkenv/fumadocs-ui/css/theme.css` now includes a complete set of fumadocs override styles so any app importing the theme gets correct defaults out of the box: nav/header height variables, sidebar drawer positioning (left-side on mobile), z-index stack (header → backdrop → sidebar drawer → search dialog → Radix poppers), search bar colors, external link icons, link underline styles, and heading anchor alignment.

## 0.0.3

### Patch changes

- #### Fix misconfigured package.json *[`a23997c`](https://github.com/yamcodes/arkenv/commit/a23997cb01b86a1e6ffd29df8279e22601864ced) [@yamcodes](https://github.com/yamcodes)*

  Fix misconfigured package.json by adding the `repository.url` field. This fixes an issue with pkg-pr-new and adheres to best practices.

## 0.0.2

### Patch changes

- #### First release *[`#775`](https://github.com/yamcodes/arkenv/pull/775) [`bb34860`](https://github.com/yamcodes/arkenv/commit/bb34860193dcb9a29026d84921b35e16a92f409b) [@yamcodes](https://github.com/yamcodes)*

  `@arkenv/fumadocs-ui` provides a theme, and components, for `fumadocs-ui` to replicate the "ArkEnv" website look.
