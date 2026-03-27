# <img src="src/assets/logo.png" width="48" align="top"> Module Configuration Manager

[![Deploy](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml/badge.svg)](https://github.com/ivan-kalachikov/vc-deploy-modules/actions/workflows/deploy.yml) [![Tests](https://img.shields.io/badge/tests-99%20passing-brightgreen)]()

Web GUI for editing VirtoCommerce deployment manifests (`packages.json`).
Load a manifest from URL or paste it, edit module versions and sources visually, copy the result.

[**Open app**](https://ivan-kalachikov.github.io/vc-deploy-modules/) | [**Open with vcst-dev manifest (example)**](https://ivan-kalachikov.github.io/vc-deploy-modules/?manifest-url=https://github.com/VirtoCommerce/vc-deploy-dev/blob/vcst-dev/backend/packages.json)

---

## Features

**Loading**
- Load manifest from URL or paste JSON
- URL history for quick access
- Shareable `?manifest-url=` deep links

**Editing**
- Edit platform settings and module versions
- Add or remove modules
- Version dropdown with available releases from GitHub
- Pick a PR to get pre-release artifact version
- Move modules between Azure Blob and GitHub Releases
- Update all GitHub modules to latest versions in one click

**Tracking**
- Real-time diff sidebar with change counter
- Per-module undo (inline and in sidebar)
- Global reset
- Collapsible module sections
- Validation with error count and click-to-iterate

**Output**
- JSON preview with syntax highlighting
- Copy to clipboard
- Optional alphabetical sorting

**UI**
- Light / Dark theme with animated transitions
- Toast notifications
- Rate limit handling with GitHub token support

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

## GitHub Token

Without authentication the GitHub API allows 60 requests/hour. Setting a personal token raises this to 5,000 req/hour.

**How to create a token:**
1. Go to [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta)
2. Create a **fine-grained token** scoped to your organization
3. **No extra permissions needed** — default (public read) is sufficient
4. Set expiration to 366 days or less (organization policy may enforce this)
5. Paste the token in the app sidebar

**Security notes:**
- The token is stored in your browser's `localStorage` — it never leaves your machine and is never sent to any server other than `api.github.com`
- Since no extra permissions are granted, the token only provides a higher rate limit for public API calls. Even in the unlikely event of an XSS compromise, the exposure is minimal
- You can remove the token at any time from the sidebar
- For maximum safety, use a dedicated token for this app and revoke it when no longer needed

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

[Vue 3](https://vuejs.org) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev) + [VueUse](https://vueuse.org)

## Contributing

Issues and PRs welcome. For questions or suggestions, email [ivan.kalachikov@gmail.com](mailto:ivan.kalachikov@gmail.com).

## License

[MIT](LICENSE)
