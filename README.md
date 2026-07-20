# Joint Account Manager — frontend

Single-page Next.js UI for tracking a shared account balance and the upcoming
payments drawn against it. Built as a **static export** (`output: 'export'`) and
served by Nginx; all data comes from the backend API at runtime.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

To point at a local backend instead of production, create `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Defaults to `https://joint.hxwang.xyz` when unset.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static export into `out/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Toolchain notes

**TypeScript is pinned to `~6.0.x` on purpose.** TypeScript 7 is the Go-native
compiler rewrite, and the `typescript-eslint` stack bundled by
`eslint-config-next` declares a peer range of `>=4.8.4 <6.1.0`. On TS 7 both
`npm run lint` and `npm run build` fail outright, so the pin holds at the newest
release the rest of the toolchain actually supports. Revisit once
`eslint-config-next` ships a TS 7-compatible `typescript-eslint`.

## Project layout

```
src/
├── app/
│   ├── layout.tsx           Root layout, fonts, metadata
│   ├── page.tsx             Composes the page; owns modal open/close state
│   └── globals.css
├── components/
│   ├── BalanceCard.tsx      Balance figure + deposit/withdraw/history buttons
│   ├── RecordsTable.tsx     Table shell; owns which row is being edited
│   ├── RecordRow.tsx        One record row (presentational)
│   ├── TransactionModal.tsx Deposit / withdraw form
│   ├── HistoryModal.tsx     Balance history, fetches its own data
│   ├── ModalShell.tsx       Shared backdrop, scroll lock, Escape-to-close
│   ├── ActionButton.tsx     Icon + label button used across rows
│   └── icons.tsx            Inline SVG icons
├── hooks/
│   ├── useAccountData.ts    Records + balance, fetched together
│   └── useLockBodyScroll.ts
└── lib/
    ├── api.ts               Every backend call, one place
    ├── format.ts            Currency formatting, running-balance projection
    └── types.ts             Shared interfaces
```

Data flows one way: `useAccountData` owns records and balance, and passes a
`refresh` callback down. Any component that mutates the server calls its API
function, then `refresh()` — the two values are always refetched together
because a change to either can affect the other.

## Deployment

Pushes to `main` build and deploy automatically via GitHub Actions. See
[DEPLOYMENT.md](DEPLOYMENT.md) for server setup, required secrets, and rollback.
