# Micro Frontend PoC — Webpack Module Federation

A production-style **micro frontend monorepo** that demonstrates how to split a web application into independently deployable packages using **Webpack 5 Module Federation**.

The PoC deliberately spans two JavaScript frameworks (**React 17** and **Vue 3**) to show that Module Federation is framework-agnostic.

---

## Table of Contents

1. [What is Module Federation?](#what-is-module-federation)
2. [Architecture Overview](#architecture-overview)
3. [Packages](#packages)
   - [container](#container-shell--host)
   - [marketing](#marketing-mfe--react)
   - [auth](#auth-mfe--react)
   - [dashboard](#dashboard-mfe--vue-3)
4. [Key Concepts Demonstrated](#key-concepts-demonstrated)
5. [Cross-Framework Integration](#cross-framework-integration)
6. [Routing Strategy](#routing-strategy)
7. [Shared Authentication State](#shared-authentication-state)
8. [CSS Isolation](#css-isolation)
9. [Getting Started](#getting-started)
10. [Running in Production](#running-in-production)
11. [CI / CD](#ci--cd)
12. [Extending the PoC](#extending-the-poc)

---

## What is Module Federation?

> **Module Federation** is a Webpack 5 feature that lets multiple, independently built JavaScript bundles expose and consume each other's modules **at runtime**, without sharing build pipelines.

Before Module Federation, sharing code between separately deployed front-end apps required one of:

| Approach | Problem |
|---|---|
| Shared npm package | Rebuild & redeploy every consumer on each change |
| `<iframe>` embedding | Heavy, no shared browser state |
| Monolith | Can't deploy parts independently |
| Server-Side Includes | Complex infrastructure |

Module Federation solves this by making each app a **remote** (producer) and/or a **host** (consumer):

```
Browser loads container/index.html
  └─ container's main bundle bootstraps
       ├─ negotiates shared libraries (react, react-dom, …)
       ├─ fetches marketing/remoteEntry.js  → loads Landing, Pricing
       ├─ fetches auth/remoteEntry.js       → loads Signin, Signup
       └─ fetches dashboard/remoteEntry.js  → loads Vue 3 Dashboard
```

Each remote is a **separate webpack build** that can be deployed independently.  When the marketing team pushes a change, only `marketing/remoteEntry.js` is updated — the container and other remotes are unaffected.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (single page)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  container  (React 17, port 8080)                          │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  <Header>  (Login / Logout button, auth state)       │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Route /           ┌─────────────────────────────────┐    │ │
│  │  ─────────────────▶│  marketing MFE  (React 17)      │    │ │
│  │                    │  Landing · Pricing               │    │ │
│  │                    │  port 8081                       │    │ │
│  │                    └─────────────────────────────────-┘    │ │
│  │                                                            │ │
│  │  Route /auth       ┌─────────────────────────────────┐    │ │
│  │  ─────────────────▶│  auth MFE  (React 17)           │    │ │
│  │                    │  Signin · Signup                 │    │ │
│  │                    │  port 8082                       │    │ │
│  │                    └──────────────────────────────────┘    │ │
│  │                                                            │ │
│  │  Route /dashboard  ┌─────────────────────────────────┐    │ │
│  │  ─────────────────▶│  dashboard MFE  (Vue 3)         │    │ │
│  │  (protected)       │  Charts · KPIs · Activity Table │    │ │
│  │                    │  port 8083                       │    │ │
│  │                    └──────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Module Federation graph

```
           ┌─────────────────┐
           │   container      │  HOST — consumes all remotes
           │   (webpack host) │
           └────────┬────────┘
                    │  imports at runtime
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  ┌──────────┐ ┌────────┐ ┌──────────┐
  │marketing │ │  auth  │ │dashboard │  REMOTES — expose modules
  │ remote   │ │ remote │ │ remote   │
  └──────────┘ └────────┘ └──────────┘
```

---

## Packages

### `container` — Shell / Host

**Port (dev):** `8080`

The container is the **host application**.  It:

- Serves `index.html` — the single HTML page the browser loads.
- Owns the top-level `<BrowserRouter>` and `<Switch>`.
- Holds the `signedIn` auth state in React's `useState`.
- Declares every other package as a Module Federation **remote**.
- Renders a thin wrapper component for each remote that:
  1. Calls the remote's `mount()` function with a DOM ref.
  2. Keeps routing histories in sync (see [Routing Strategy](#routing-strategy)).

Key files:

```
packages/container/
├── config/
│   ├── webpack.common.js   — shared babel + HtmlWebpackPlugin
│   ├── webpack.dev.js      — dev server + ModuleFederationPlugin (remotes)
│   └── webpack.prod.js     — production build + remotes via env var
├── public/index.html       — the one true HTML page
└── src/
    ├── App.js              — BrowserRouter, Switch, auth state
    ├── bootstrap.js        — async entry (required by MF)
    ├── index.js            — dynamic import of bootstrap
    └── components/
        ├── Header.js       — nav bar (Login / Logout)
        ├── MarketingApp.js — wrapper for marketing remote
        ├── AuthApp.js      — wrapper for auth remote
        └── DashboardApp.js — wrapper for dashboard remote (Vue)
```

---

### `marketing` — MFE (React)

**Port (dev):** `8081`

A public-facing marketing site.  **Exposes** `./MarketingApp` via Module Federation.

Pages:
- `/` — Landing page with a product showcase grid.
- `/pricing` — Pricing tiers (Free / Pro / Enterprise).

The app uses an **internal memory history** when embedded in the container and a **browser history** when run in isolation (see [Routing Strategy](#routing-strategy)).

```
packages/marketing/
├── config/
│   ├── webpack.common.js
│   ├── webpack.dev.js      — port 8081, exposes ./MarketingApp
│   └── webpack.prod.js
├── public/index.html       — dev isolation HTML (#_marketing-dev-root)
└── src/
    ├── App.js              — Router + Switch for /  and /pricing
    ├── bootstrap.js        — mount() + dev isolation logic
    ├── index.js
    └── components/
        ├── Landing.js
        └── Pricing.js
```

---

### `auth` — MFE (React)

**Port (dev):** `8082`

Handles authentication flows.  **Exposes** `./AuthApp` via Module Federation.

Pages:
- `/auth/signin` — Email + password sign-in form.
- `/auth/signup` — Registration form (name + email + password).

On a successful submission the auth MFE:
1. Calls `onSignIn()` → container sets `signedIn = true`.
2. Navigates its internal history to `/dashboard` → container mirrors this and renders `<DashboardApp>`.

```
packages/auth/
├── config/
│   ├── webpack.common.js
│   ├── webpack.dev.js      — port 8082, exposes ./AuthApp
│   └── webpack.prod.js
├── public/index.html       — dev isolation HTML (#_auth-dev-root)
└── src/
    ├── App.js              — Router + Switch for /auth/signin and /auth/signup
    ├── bootstrap.js        — mount() + dev isolation logic
    ├── index.js
    └── components/
        ├── Signin.js       — sign-in form, calls onSignIn on submit
        └── Signup.js       — registration form, calls onSignIn on submit
```

---

### `dashboard` — MFE (Vue 3)

**Port (dev):** `8083`

An analytics dashboard built with **Vue 3** and **Chart.js**.  **Exposes** `./DashboardApp` via Module Federation.  This package is the PoC's most distinctive feature: a Vue app rendered inside a React container with **zero React↔Vue interop library**.

Features:
- Four KPI cards (users, active sessions, revenue, churn rate).
- Bar chart — monthly signups (Chart.js).
- Doughnut chart — plan distribution (Chart.js).
- Recent activity table.

```
packages/dashboard/
├── config/
│   ├── webpack.common.js   — VueLoaderPlugin + babel + css/scss rules
│   ├── webpack.dev.js      — port 8083, exposes ./DashboardApp
│   └── webpack.prod.js
├── public/index.html       — dev isolation HTML (#_dashboard-dev-root)
└── src/
    ├── App.vue             — root Vue SFC, mounts DashboardView
    ├── bootstrap.js        — mount() using createApp() + dev isolation
    ├── index.js
    └── components/
        └── Dashboard.vue   — KPI cards, charts, activity table
```

---

## Key Concepts Demonstrated

### 1. Independent builds & deployments

Each package has its own `webpack.dev.js` / `webpack.prod.js` and its own CI workflow.  You can build and deploy **marketing alone** without touching the container.

### 2. Shared library negotiation

The container and every React remote list their `package.json` `dependencies` as `shared` in `ModuleFederationPlugin`.  Webpack ensures **only one copy** of React and ReactDOM is loaded in the browser, regardless of how many remotes declare it.

```js
// webpack.dev.js (container)
new ModuleFederationPlugin({
  shared: packageJson.dependencies,  // react, react-dom, react-router-dom, …
})
```

For the Vue dashboard, Vue is shared with `singleton: true` so that all Vue-based remotes (should you add more) use the same Vue runtime.

### 3. Framework agnosticism

The dashboard runs **Vue 3** inside a **React 17** shell.  From Webpack's perspective both are just JavaScript modules.  The `mount()` function is the only contract:

```js
// React container
import { mount } from "dashboard/DashboardApp";  // Vue 3 code!

useEffect(() => {
  mount(ref.current);   // Vue createApp().mount(el)
}, []);
```

### 4. Dev isolation

Every remote can be started **standalone** without the container.  Each `bootstrap.js` detects a dev-specific root element and mounts directly with a browser history:

```js
if (process.env.NODE_ENV === "development") {
  const devRoot = document.querySelector("#_auth-dev-root");
  if (devRoot) {
    mount(devRoot, { defaultHistory: createBrowserHistory() });
  }
}
```

This means the auth team can develop and test the sign-in page in isolation on `localhost:8082` without starting any other service.

### 5. The async bootstrap pattern

Every package has:

```
index.js     →  import("./bootstrap")   // dynamic import
bootstrap.js →  actual app code
```

This forces Webpack to treat `bootstrap.js` as a separate async chunk.  Without it, Module Federation cannot negotiate shared libraries before your code runs, leading to the classic *"Uncaught Error: Shared module is not available for eager consumption"* error.

---

## Cross-Framework Integration

The Vue dashboard is integrated into the React shell with **no special library**:

```
React shell                           Vue MFE
──────────────────────────────────    ────────────────────────────────
<div ref={ref} />            ──────▶  el (DOM node)
mount(ref.current)                    createApp(App).mount(el)
```

The `mount` function in `packages/dashboard/src/bootstrap.js` is plain JavaScript.  It doesn't know it is being called from React.

---

## Routing Strategy

The container owns a single `<BrowserRouter>` with the real URL.  Each remote uses an **internal MemoryHistory** so it cannot accidentally push to the address bar.  The two histories are kept in sync via callbacks:

```
container history          remote memory history
─────────────────          ─────────────────────
  pushes /pricing   ──────▶  onParentNavigate()  ──▶  history.push("/pricing")
                   ◀──────   onNavigate()         ◀──  history.listen()
```

```js
// Inside MarketingApp.js (container wrapper)
const { onParentNavigate } = mount(ref.current, {
  onNavigate: ({ pathname }) => {
    if (history.location.pathname !== pathname) {
      history.push(pathname);           // remote → container
    }
  },
});
history.listen(onParentNavigate);       // container → remote
```

Each remote applies the same pattern.  Auth additionally receives `initialPath` so its memory history starts at the current URL segment (e.g. `/auth/signin`).

---

## Shared Authentication State

Auth state lives in the **container** (`useState`), not in any remote.  The auth remote communicates upward via a callback prop:

```
┌───────────────────────────────────────────┐
│  container                                │
│  const [signedIn, setSignedIn] = useState │
│                                           │
│  <AuthApp onSignIn={() =>                 │
│    setSignedIn(true)} />                  │
└──────────────┬────────────────────────────┘
               │ prop
               ▼
┌──────────────────────────────────────────┐
│  auth MFE                                │
│  mount(el, { onSignIn })                 │
│  // on form submit:                      │
│  onSignIn()  ──────────────────────────▶ │  container.setSignedIn(true)
└──────────────────────────────────────────┘
```

The `/dashboard` route is **protected** in the container:

```jsx
<Route path="/dashboard">
  {signedIn ? <DashboardApp /> : <Redirect to="/auth/signin" />}
</Route>
```

---

## CSS Isolation

Material-UI (v4) generates class names at runtime.  When two apps use MUI on the same page the classes can collide.  Each app uses `createGenerateClassName` with a unique `productionPrefix`:

| Package | Prefix |
|---|---|
| container | `co` |
| marketing | `ma` |
| auth | `au` |

The Vue dashboard uses scoped `<style scoped>` in every SFC which emits `data-v-*` attributes — completely isolated from the React CSS.

---

## Getting Started

### Prerequisites

- Node.js ≥ 16
- npm ≥ 7

### Install dependencies

```bash
cd packages/container  && npm install
cd ../marketing        && npm install
cd ../auth             && npm install
cd ../dashboard        && npm install
```

### Run all apps (4 terminals)

| Terminal | Command | URL |
|---|---|---|
| 1 | `cd packages/marketing && npm start` | http://localhost:8081 |
| 2 | `cd packages/auth && npm start` | http://localhost:8082 |
| 3 | `cd packages/dashboard && npm start` | http://localhost:8083 |
| 4 | `cd packages/container && npm start` | **http://localhost:8080** |

> **Order matters** — start the remotes (marketing, auth, dashboard) before the container, otherwise the container's dev server will fail to fetch the remote entry files on first load.

### Run a single MFE in isolation

Each remote works standalone:

```bash
# Only auth — no container needed
cd packages/auth && npm start
# Visit http://localhost:8082
```

### Flow to test the full PoC

1. Open **http://localhost:8080** — you see the Marketing Landing page.
2. Click **Pricing** — navigates to `/pricing` (Marketing MFE).
3. Click **Login** in the header — navigates to `/auth/signin` (Auth MFE).
4. Enter any email + password → click **Sign In**.
5. You land on `/dashboard` — the Vue 3 Dashboard MFE with charts and KPIs.
6. Click **Logout** in the header → `signedIn = false`, redirected back to `/auth/signin`.

---

## Running in Production

Each package builds to a `dist/` folder:

```bash
PRODUCTION_DOMAIN=https://your-cdn.example.com \
  npm run build   # inside each package
```

The `PRODUCTION_DOMAIN` env var is interpolated into the container's prod webpack config to point remotes at their CDN paths:

```
/container/latest/index.html
/marketing/latest/remoteEntry.js
/auth/latest/remoteEntry.js
/dashboard/latest/remoteEntry.js
```

Serve each `dist/` from an S3 bucket + CloudFront (see [CI/CD](#ci--cd)).

---

## CI / CD

GitHub Actions workflows in `.github/workflows/` trigger on pushes to `master` in the relevant package directory.  Each workflow:

1. Installs dependencies.
2. Runs `npm run build` (with `PRODUCTION_DOMAIN` secret).
3. Syncs the `dist/` folder to an S3 bucket path.
4. Invalidates the CloudFront cache for `remoteEntry.js` / `index.html`.

| Workflow | Trigger path | S3 path |
|---|---|---|
| `container.yml` | `packages/container/**` | `s3://…/container/latest` |
| `marketing.yml` | `packages/marketing/**` | `s3://…/marketing/latest` |
| `auth.yml` | `packages/auth/**` | `s3://…/auth/latest` |
| `dashboard.yml` | `packages/dashboard/**` | `s3://…/dashboard/latest` |

Required GitHub secrets:

| Secret | Purpose |
|---|---|
| `PRODUCTION_DOMAIN` | CDN base URL (e.g. `https://d123.cloudfront.net`) |
| `AWS_S3_BUCKET_NAME` | S3 bucket name |
| `AWS_ACCESS_KEY_ID` | IAM key with S3 + CloudFront permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_DISTRIBUTION_ID` | CloudFront distribution ID |

---

## Extending the PoC

### Add a new MFE

1. Create `packages/my-app/` with the same structure as an existing remote.
2. Add `ModuleFederationPlugin` with `exposes: { "./MyApp": "./src/bootstrap" }`.
3. Add a wrapper component in `packages/container/src/components/MyApp.js`.
4. Register the remote in the container's `webpack.dev.js` and `webpack.prod.js`.
5. Add a `<Route>` in `packages/container/src/App.js`.

### Add a new page to an existing MFE

Edit only the relevant package.  Because each remote is independently deployed, no other package needs to be rebuilt or redeployed.

### Add real authentication

Replace the `onSignIn()` stub in `Signin.js` / `Signup.js` with an API call:

```js
const response = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (response.ok) {
  onSignIn();
  history.push("/dashboard");
}
```

---

*Built to demonstrate Webpack 5 Module Federation — React 17 (container, marketing, auth) + Vue 3 (dashboard) on a single page.*
