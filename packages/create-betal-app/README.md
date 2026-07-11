# create-betal-app

Scaffold a new [betal-fe](https://www.npmjs.com/package/betal-fe) project with a single command — pick a starter demo, a router, and (if you need one) a deployment config, and get a ready-to-run [Vite](https://vitejs.dev/) project.

## Usage

```bash
npm create betal-app@latest
```

Answer the prompts — project name, demo, router, and (for `BrowserRouter`) a deployment target — and you're done:

```bash
cd my-app
npm install
npm run dev
```

### Non-interactive usage

Every prompt has a matching flag, so the whole thing can run unattended (CI, scripts, docs examples):

```bash
npm create betal-app@latest my-app -- --template todo --router browser --deploy vercel
```

| Flag | Values | Default | Notes |
|---|---|---|---|
| `--template` | `counter`, `todo` | *(prompted)* | Starter demo app |
| `--router` | `none`, `hash`, `browser` | *(prompted)* | Routing setup |
| `--deploy` | `vercel`, `netlify`, `nginx`, `manual` | *(prompted)* | Only asked when `--router browser` |
| `--force` | *(flag, no value)* | `false` | Scaffold into a non-empty directory anyway |

The project name can also be given as a plain positional argument (as above); if omitted, you'll be prompted for it.

## What you get

- A working [Vite](https://vitejs.dev/) + `betal-fe` project, pinned to the latest published versions of both at scaffold time.
- `npm run dev` / `npm run build` / `npm run preview` scripts, already wired up.
- Your chosen demo (`counter` or `todo`) as a working starting point, not a placeholder.
- If you chose a router, a nav + `RouterOutlet` shell and a second page already wired up, so routing works out of the box instead of being something you have to bolt on yourself.

## Choosing a router

- **`none`** — a plain single-view app, no router.
- **`hash`** — `HashRouter`, URLs look like `/#/about`. Works on any static host, no server configuration needed.
- **`browser`** — `BrowserRouter`, URLs look like `/about`. Cleaner, but the host needs to serve `index.html` for any path it doesn't otherwise recognize (a refresh on `/about` is a real request to the server — see [Deployment](#deployment) below).

## Deployment

`BrowserRouter` needs one thing from your host: an unmatched path should fall back to `index.html`, so the app's own router can take over and resolve it client-side. Picking a `--deploy` target generates the right config for that host, in the location it actually looks for it:

| Target | What's generated | Where |
|---|---|---|
| `vercel` | `vercel.json` with a catch-all rewrite | project root |
| `netlify` | `_redirects` with a catch-all rule | `public/` (Vite copies it into `dist/` on build) |
| `nginx` | a `location` block for your server config | `deploy/nginx.conf.snippet` (applied manually) |
| `manual` | nothing — `DEPLOYING.md` in the project explains how to configure your host yourself | — |

`HashRouter` needs none of this — the `#` fragment never reaches the server, so there's nothing to configure.

## Requirements

Node.js >= 18.
