[![Deploy](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml/badge.svg)](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/tests-99%20passing-brightgreen)]()

# Module Configuration Manager

Web GUI for editing VirtoCommerce deployment manifests (`packages.json`).

Load a manifest from URL or paste it, edit module versions and sources visually, copy the result.

**Live:** [ivan-kalachikov.github.io/vc-deploy-modules](https://ivan-kalachikov.github.io/vc-deploy-modules/)

**Quick link with manifest:** `?manifest-url=https://github.com/VirtoCommerce/vc-deploy-dev/blob/vcst-dev/backend/packages.json`

---

## Features

**Loading**
- Load manifest from URL
- Paste JSON directly
- Manifest URL history (localStorage, click to reload)
- Shareable `?manifest-url=` deep links

**Editing**
- Edit platform version, image, tag, asset URL, module sources
- Edit module versions via text input or dropdown
- GitHub Releases: lazy-load version tags on click (cached 24h)
- Azure Blob: lazy-load open PRs on click, auto-parse artifact from PR description
- Move modules between sources (`↑ Blob` / `↓ Releases`)
- Auto-assign latest tag when moving to Releases

**Tracking**
- Real-time diff sidebar (version changes, source moves, additions)
- Per-module Undo button (revert to original value/source)
- Global Reset (discard all changes)
- Validation with scroll-to-error

**Output**
- JSON preview popover with syntax highlighting
- Copy JSON to clipboard
- Optional alphabetical sorting

**UI**
- Light / Dark / Auto theme (respects OS, persists to localStorage)
- Skeleton loader while fetching
- Toast notifications
- GitHub API rate limit detection with actionable messages

---

## Module Repository Mapping

Each module ID (e.g. `VirtoCommerce.Orders`) maps to a GitHub repo for tag fetching and PR loading. The mapping works in two steps:

1. **Check explicit mapping** in [`src/config/moduleRepoMapping.ts`](src/config/moduleRepoMapping.ts)
2. **Fall back to convention:** strip `VirtoCommerce.` prefix, kebab-case the rest, prepend `vc-module-`

**Example fallbacks (no mapping needed):**
| Module ID | Repo |
|---|---|
| `VirtoCommerce.Catalog` | `vc-module-catalog` |
| `VirtoCommerce.Customer` | `vc-module-customer` |
| `VirtoCommerce.Marketing` | `vc-module-marketing` |

**Explicit overrides (convention doesn't match):**
| Module ID | Repo | Why |
|---|---|---|
| `VirtoCommerce.Orders` | `vc-module-order` | Singular |
| `VirtoCommerce.Notifications` | `vc-module-notification` | Singular |
| `VirtoCommerce.Contracts` | `vc-module-contract` | Singular |
| `VirtoCommerce.AvalaraTax` | `vc-module-avatax` | Different name |
| `VirtoCommerce.PageBuilderModule` | `page-builder` | No `vc-module-` prefix |
| `VirtoCommerce.XCMS` | `vc-module-x-cms` | Acronym |
| `VirtoCommerce.Xapi` | `vc-module-x-api` | Acronym |
| ... | | [See full list](src/config/moduleRepoMapping.ts) |

### Adding a new module

If the new module follows the convention (`VirtoCommerce.Foo` -> `vc-module-foo`), it works automatically. No changes needed.

If the repo name doesn't match the convention, add an entry to `MODULE_REPO_MAPPING` in [`src/config/moduleRepoMapping.ts`](src/config/moduleRepoMapping.ts):

```ts
'VirtoCommerce.NewModule': 'vc-module-actual-repo-name',
```

---

## Development

```bash
yarn install
yarn dev          # Dev server
yarn build        # Production build
yarn test:unit    # 99 tests
yarn type-check   # TypeScript validation
```

## Project Structure

```
src/
  components/       Vue components (13 files, each <150 lines)
  composables/      Reactive logic (8 composables)
  services/         GitHub API, tag cache
  config/           Module repo mapping
  utils/            Validation, helpers, JSON highlighter
  types/            TypeScript interfaces
  assets/           Design tokens (light/dark themes)
```

## Tech Stack

Vue 3 + TypeScript + Vite. [VueUse](https://vueuse.org) for localStorage sync, URL params, theme detection. Zero other runtime dependencies.
