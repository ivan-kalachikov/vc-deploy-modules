[![Deploy](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml/badge.svg)](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml)
[![Tests](https://img.shields.io/badge/tests-99%20passing-brightgreen)]()

# Module Configuration Manager

Web GUI for editing VirtoCommerce deployment manifests (`packages.json`).

Load a manifest from URL or paste it, edit module versions and sources visually, copy the result.

**Live:** [ivan-kalachikov.github.io/vc-deploy-modules](https://ivan-kalachikov.github.io/vc-deploy-modules/)

**Quick link with manifest:** [open with vcst-dev manifest](https://ivan-kalachikov.github.io/vc-deploy-modules/?manifest-url=https://github.com/VirtoCommerce/vc-deploy-dev/blob/vcst-dev/backend/packages.json)

---

## Features

**Loading**
- Load manifest from URL or paste JSON
- URL history for quick access
- Shareable `?manifest-url=` deep links

**Editing**
- Edit platform settings and module versions
- Version dropdown with available releases from GitHub
- Pick a PR to get pre-release artifact version
- Move modules between Azure Blob and GitHub Releases
- Update all GitHub modules to latest versions in one click
- Auto-assign latest tag when moving to Releases

**Tracking**
- Real-time diff sidebar
- Per-module undo
- Global reset
- Validation with scroll-to-error

**Output**
- JSON preview with syntax highlighting
- Copy to clipboard
- Optional alphabetical sorting

**UI**
- Light / Dark / Auto theme
- Toast notifications
- Rate limit handling

---

## Module Repository Mapping

Each module ID (e.g. `VirtoCommerce.Orders`) maps to a GitHub repo for fetching tags and PRs:

1. **Check explicit mapping** in [`src/config/moduleRepoMapping.ts`](src/config/moduleRepoMapping.ts)
2. **Fall back to convention:** `VirtoCommerce.Foo` -> `vc-module-foo`

**Convention examples (no mapping needed):**
| Module ID | Repo |
|---|---|
| `VirtoCommerce.Catalog` | `vc-module-catalog` |
| `VirtoCommerce.Customer` | `vc-module-customer` |
| `VirtoCommerce.Marketing` | `vc-module-marketing` |

**Explicit overrides:**
| Module ID | Repo | Why |
|---|---|---|
| `VirtoCommerce.Orders` | `vc-module-order` | Singular |
| `VirtoCommerce.Notifications` | `vc-module-notification` | Singular |
| `VirtoCommerce.AvalaraTax` | `vc-module-avatax` | Different name |
| `VirtoCommerce.PageBuilderModule` | `page-builder` | No prefix |
| `VirtoCommerce.XCMS` | `vc-module-x-cms` | Acronym |
| ... | | [Full list](src/config/moduleRepoMapping.ts) |

### Adding a new module

If it follows the convention (`VirtoCommerce.Foo` -> `vc-module-foo`) — works automatically.

Otherwise add one line to [`src/config/moduleRepoMapping.ts`](src/config/moduleRepoMapping.ts):

```ts
'VirtoCommerce.NewModule': 'vc-module-actual-repo-name',
```

---

## Development

```bash
yarn install
yarn dev          # Dev server
yarn build        # Production build
yarn test:unit    # Run tests
yarn type-check   # TypeScript check
```

## Project Structure

```
src/
  components/       Vue components
  composables/      Reactive logic
  services/         GitHub API, tag cache
  config/           Module repo mapping
  utils/            Validation, helpers
  types/            TypeScript interfaces
  assets/           Design tokens (themes)
```

## Tech Stack

Vue 3 + TypeScript + Vite + [VueUse](https://vueuse.org).
