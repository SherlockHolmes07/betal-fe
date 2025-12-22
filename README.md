# Betal-FE

[![npm version](https://img.shields.io/npm/v/betal-fe.svg)](https://www.npmjs.com/package/betal-fe)

A lightweight, modern frontend framework implementing Virtual DOM, reactive components, routing, and slots from the ground up.

## 📦 Installation

```bash
npm install betal-fe
```

## ✨ Features

- **Virtual DOM** - Efficient DOM updates through reconciliation
- **Component-Based** - Reusable UI components with props and state
- **Reactive State** - Automatic re-rendering on state changes
- **Lifecycle Hooks** - `onMounted`, `onUnmounted`, `onPropsChange`, `onStateChange`
- **Slots** - Content projection for flexible component composition (Vue-style)
- **Hash Router** - Built-in SPA routing with route guards and params
- **Event System** - Parent-child communication via emit/subscribe
- **Scheduler** - Async lifecycle execution with microtask batching

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

```javascript
import { createBetalApp, HashRouter, RouterLink, RouterOutlet, hFragment, h } from 'betal-fe';

const router = new HashRouter([
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/user/:id', component: UserPage },
]);

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
│   └── runtime/          # Core framework code (Virtual DOM, components, router, slots)
└── examples/             # Example applications (counter, todo app)
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

```javascript
// Child component with slot
const Card = defineComponent({
  render() {
    return h("div", { class: "card" }, [
      h("h3", {}, [this.props.title]),
      hSlot([h("p", {}, ["Default content"])]), // Slot with default
    ]);
  }
});

// Parent provides content
h(Card, { title: "My Card" }, [
  h("p", {}, ["Custom content!"]) // Replaces slot
]);
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
- **Smart Routing** - Pattern matching with params/query extraction and route guards
- **Slot System** - Vue-style content projection with default fallbacks

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE) - Feel free to fork, modify, and build upon this project!

## 🙏 Acknowledgments

Built with inspiration from modern frontend frameworks to explore framework architecture and design patterns.
