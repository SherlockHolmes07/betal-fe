# Deploying {{PROJECT_NAME}}

This project uses `BrowserRouter` — URLs are real paths (`/about`, not `#/about`). That means your host needs to know to serve this app for *every* path, not just `/`, or a hard refresh (or a shared link) to a nested route will 404 before your JavaScript even loads.

**Local development needs none of this.** Vite's dev server (`npm run dev`) already handles this automatically.

## Vercel

If you chose Vercel when scaffolding, `vercel.json` is already sitting in the project root — Vercel reads it automatically, nothing else to do.

If you're setting this up by hand: create `vercel.json` at the project root with:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Netlify

If you chose Netlify when scaffolding, `public/_redirects` is already there — Vite copies everything in `public/` into `dist/` at build time, so it ends up exactly where Netlify looks for it.

If you're setting this up by hand: create `public/_redirects` with:

```
/*    /index.html   200
```

(A root-level `netlify.toml` with an equivalent `[[redirects]]` block works too, if you'd rather keep redirect rules alongside other build settings — Netlify auto-discovers either.)

## nginx (self-hosted)

If you chose nginx when scaffolding, see `deploy/nginx.conf.snippet` in the project — paste its `location` block into your server config. There's no auto-discovery for a self-hosted server; you always apply this by hand.

## GitHub Pages — not supported yet for BrowserRouter

GitHub Pages project sites are served from `username.github.io/repository-name/`, not the domain root. `BrowserRouter` currently assumes root-level hosting — it has no `basePath` support yet, so route matching would be wrong on a project site regardless of any redirect trick. If you need GitHub Pages today, use `HashRouter` instead (fully supported, works anywhere, no configuration needed) — or deploy `BrowserRouter` to a custom domain/root site.

## "I'll configure it myself" / another host

Any static host that lets you configure a catch-all rewrite to `/index.html` will work — that's all `BrowserRouter` actually needs.
