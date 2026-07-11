# Betal-FE

[![CI](https://github.com/SherlockHolmes07/betal-fe/actions/workflows/ci.yml/badge.svg)](https://github.com/SherlockHolmes07/betal-fe/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/betal-fe.svg)](https://www.npmjs.com/package/betal-fe)

A lightweight, modern frontend framework implementing Virtual DOM, reactive components, routing, and slots from the ground up.

**🌐 [Live Documentation](https://betalfe.com/#/docs)**

## 🏗️ Create a New Project

The fastest way to start — scaffold a full project in one command:

```bash
npm create betal-app@latest
```

This walks you through a few choices — project name, a starter demo (`counter` or `todo`), a router (`none`, `hash`, or `browser`), and, if you pick `browser`, a deployment target — and generates a ready-to-run Vite + betal-fe project. Non-interactive usage:

```bash
npm create betal-app@latest my-app -- --template todo --router browser --deploy vercel
```

| Flag | Values | Notes |
|---|---|---|
| `--template` | `counter`, `todo` | Starter demo app |
| `--router` | `none`, `hash`, `browser` | Routing setup |
| `--deploy` | `vercel`, `netlify`, `nginx`, `manual` | Only asked when `--router browser` |
| `--force` | *(flag)* | Scaffold into a non-empty directory anyway |

### Deployment note (BrowserRouter)

Real-path routing requires the host to serve `index.html` for any path it doesn't otherwise recognize (a refresh on `/about` is a real request to the server, not just client-side JS). Picking `--deploy vercel`/`netlify`/`nginx` generates that host's rewrite config for you (`vercel.json`, `public/_redirects`, or an nginx `location` snippet, respectively); pick `manual` and `DEPLOYING.md` in the generated project explains how to set it up yourself. `HashRouter` needs none of this, since the fragment never reaches the server at all.

## 📦 Installation

Already have a project and just want the library?

```bash
npm install betal-fe
```

## ✨ Features

- **Virtual DOM** - Efficient DOM updates through reconciliation
- **Component-Based** - Reusable UI components with props and state
- **Reactive State** - Automatic re-rendering on state changes
- **Lifecycle Hooks** - `onMounted`, `onUnmounted`, `onPropsChange`, `onStateChange`
- **Slots** - Content projection for flexible component composition (Vue-style)
- **Routing** - `HashRouter` and `BrowserRouter`, with route guards, params, redirects, and scroll behavior
- **Event System** - Parent-child communication via emit/subscribe
- **Scheduler** - Async lifecycle execution with microtask batching
- **Project Scaffolding** - `npm create betal-app` generates a ready-to-run project with your choice of demo, router, and deployment config

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Examples

```bash
npm run serve:examples
```

### Basic Example

```javascript
import { createBetalApp, defineComponent, h } from 'betal-fe';

const Counter = defineComponent({
  state() {
    return { count: 0 };
  },

  render() {
    return h("div", {}, [
      h("p", {}, [`Count: ${this.state.count}`]),
      h("button", {
        on: { click: () => this.updateState({ count: this.state.count + 1 }) }
      }, ["Increment"]),
    ]);
  },
});

createBetalApp(Counter).mount(document.getElementById('app'));
```

### With Routing

`HashRouter` (`#/path`) works on any static host with no server configuration. `BrowserRouter` (`/path`, no `#`) gives clean URLs but needs the server to rewrite unmatched paths to `index.html` in production — see [Deployment note](#deployment-note-browserrouter) below. Both share the same API.

```javascript
import { createBetalApp, HashRouter, BrowserRouter, RouterLink, RouterOutlet, hFragment, h } from 'betal-fe';

const router = new HashRouter([ // or: new BrowserRouter([...])
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/user/:id', component: UserPage },
], {
  scrollBehavior: 'top'  // 'top', false, or custom function
});

const App = defineComponent({
  render() {
    return hFragment([
      h("nav", {}, [
        h(RouterLink, { to: '/' }, ['Home']),
        h(RouterLink, { to: '/about' }, ['About']),
      ]),
      h(RouterOutlet),
    ]);
  }
});

createBetalApp(App, {}, { router }).mount(document.getElementById('app'));
```

## 📂 Project Structure

```
betal-fe/
├── packages/
│   ├── runtime/           # Core framework code (Virtual DOM, components, router, slots)
│   └── create-betal-app/  # `npm create betal-app` scaffolding CLI
└── examples/              # Example applications (counter, todo app)
```

## 🎯 Core Concepts

### Components

```javascript
const MyComponent = defineComponent({
  state(props) {
    return { message: 'Hello' };
  },

  onMounted() {
    // Runs after component is mounted
  },

  onPropsChange(newProps, oldProps) {
    // Runs when props change
  },

  onStateChange() {
    // Runs when state changes
  },

  render() {
    return h("div", {}, [this.state.message]);
  },
});
```

### Slots

Components can expose a single default slot, or several independently named slots.

```javascript
// Child component with named slots
const Card = defineComponent({
  render() {
    return h("div", { class: "card" }, [
      h("header", {}, [hSlot("header", [h("h3", {}, [this.props.title])])]),
      h("main", {}, [hSlot()]), // unnamed slot is always "default"
      h("footer", {}, [hSlot("footer")]),
    ]);
  }
});

// Parent targets each named slot with a plain object
h(Card, { title: "My Card" }, {
  header: [h("h2", {}, ["Custom Title"])],
  default: [h("p", {}, ["Custom content!"])],
  footer: [h("button", {}, ["OK"])],
});
```

### Routing

```javascript
// Access route data in any component
const UserPage = defineComponent({
  render() {
    const { id } = this.appContext.router.params;  // Route params
    const { tab } = this.appContext.router.query;  // Query params
    return h("h1", {}, [`User: ${id}, Tab: ${tab}`]);
  }
});

// Programmatic navigation
this.appContext.router.navigateTo('/user/123?tab=profile');
```

## 🧪 Development

### Run Tests

```bash
cd packages/runtime
npm test
```

Or for the scaffolding CLI:

```bash
cd packages/create-betal-app
npm test
```

### Build

```bash
cd packages/runtime
npm run build
```

## 🛠️ Technical Highlights

- **Virtual DOM Algorithm** - Efficient diffing and patching with minimal DOM operations
- **Component Lifecycle** - Full lifecycle management with mount/unmount and change hooks
- **Reactive State** - Automatic re-rendering on state/props changes
- **Event System** - Pub/sub dispatcher for component communication
- **Async Scheduler** - Microtask-based job queue for lifecycle hooks
- **Smart Routing** - Pattern matching with params/query extraction, route guards, and scroll behavior
- **Slot System** - Vue-style content projection with default fallbacks

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE) - Feel free to fork, modify, and build upon this project!
