# Betal-FE

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
- **Hash Router** - Built-in SPA routing with route guards, params, and scroll behavior
- **Event System** - Parent-child communication via emit/subscribe
- **Scheduler** - Async lifecycle execution with microtask batching

## 🚀 Quick Start

### Basic Counter Example

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
import { createBetalApp, defineComponent, HashRouter, RouterLink, RouterOutlet, hFragment, h } from 'betal-fe';

const HomePage = defineComponent({
  render() {
    return h("h1", {}, ["Home Page"]);
  }
});

const AboutPage = defineComponent({
  render() {
    return h("h1", {}, ["About Page"]);
  }
});

const router = new HashRouter([
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

## 📚 API Reference

### Core Functions

#### `createBetalApp(RootComponent, props, context)`

Creates and returns an application instance.

```javascript
const app = createBetalApp(MyApp, { title: 'Hello' }, { router });
app.mount(document.getElementById('app'));
```

#### `defineComponent(config)`

Defines a component with state, lifecycle hooks, and render method.

```javascript
const MyComponent = defineComponent({
  state(props) {
    return { count: 0 };
  },

  onMounted() {
    // Called after component is mounted
  },

  onUnmounted() {
    // Called before component is unmounted
  },

  onPropsChange(newProps, oldProps) {
    // Called when props change
  },

  onStateChange(newState, oldState) {
    // Called after state changes
  },

  render() {
    return h("div", {}, [/* children */]);
  }
});
```

#### `h(tag, props, children)`

Creates a virtual DOM element.

```javascript
h("div", { class: "container", id: "app" }, [
  h("h1", {}, ["Hello World"]),
  h("button", { on: { click: handleClick } }, ["Click Me"])
]);
```

#### `hFragment(children)`

Creates a fragment node (renders children without wrapper element).

```javascript
hFragment([
  h("h1", {}, ["Title"]),
  h("p", {}, ["Content"])
]);
```

#### `hSlot(defaultContent)`

Creates a slot for content projection.

```javascript
const Card = defineComponent({
  render() {
    return h("div", { class: "card" }, [
      h("h3", {}, [this.props.title]),
      hSlot([h("p", {}, ["Default content"])])
    ]);
  }
});

// Usage
h(Card, { title: "My Card" }, [
  h("p", {}, ["Custom content!"])
]);
```

### Component Instance Methods

#### `this.updateState(newState)`

Updates component state and triggers re-render.

```javascript
this.updateState({ count: this.state.count + 1 });
```

#### `this.emit(eventName, payload)`

Emits an event to parent component.

```javascript
this.emit('itemAdded', { id: 123, name: 'New Item' });
```

### Router

#### `new HashRouter(routes, options)`

Creates a hash-based router.

```javascript
const router = new HashRouter([
  { path: '/', component: HomePage },
  { path: '/user/:id', component: UserPage },
  { 
    path: '/admin', 
    component: AdminPage,
    beforeEnter: (from, to) => {
      // Route guard - return false to cancel, string to redirect
      return isLoggedIn() ? true : '/login';
    }
  }
], {
  scrollBehavior: 'top'  // 'top' (default), false, or custom function
});
```

#### Scroll Behavior Options

```javascript
// Default: scroll to top
new HashRouter(routes);

// Disable scroll
new HashRouter(routes, { scrollBehavior: false });

// Custom function for route-specific behavior
new HashRouter(routes, {
  scrollBehavior: (from, to) => {
    // Don't scroll when navigating within the same section
    if (from?.path?.startsWith('/docs') && to?.path?.startsWith('/docs')) {
      return null;  // Prevent scrolling
    }
    return { x: 0, y: 0, behavior: 'smooth' };
  }
});
```

#### Router Context (in components)

```javascript
this.appContext.router.params     // { id: '123' }
this.appContext.router.query      // { tab: 'profile' }
this.appContext.router.navigateTo('/path')
```

#### `RouterLink` Component

```javascript
h(RouterLink, { to: '/about' }, ['About'])

// With anchor fragments
h(RouterLink, { to: '/about#team' }, ['Meet the Team'])
h(RouterLink, { to: '#features' }, ['Jump to Features'])

// With custom classes and attributes
h(RouterLink, { to: '/about', class: 'nav-link active' }, ['About'])
```

#### `RouterOutlet` Component

Renders the current route component.

```javascript
h(RouterOutlet)
```

### Event Dispatcher

#### Subscribe to Events

```javascript
this.appContext.dispatcher.subscribe('eventName', (payload) => {
  console.log('Event received:', payload);
});
```

#### Dispatch Events

```javascript
this.emit('eventName', { data: 'value' });
```

## 🎯 Component Lifecycle

1. **Constructor** → Component instance created
2. **state()** → Initial state computed
3. **render()** → Virtual DOM created
4. **Mount** → DOM elements created and inserted
5. **onMounted()** → Component is now in the DOM
6. **Props/State Change** → Re-render triggered
7. **onPropsChange() / onStateChange()** → After update
8. **onUnmounted()** → Before removal from DOM
9. **Unmount** → DOM cleanup

## 🔧 Props & Attributes

### Event Handlers

```javascript
h("button", {
  on: {
    click: (event) => console.log('clicked'),
    input: (event) => this.updateState({ value: event.target.value })
  }
}, ["Click Me"]);
```

### Class Binding

```javascript
h("div", {
  class: "container active",
  // or
  className: "container active"
}, [/* children */]);
```

### Style Binding

```javascript
h("div", {
  style: "color: red; font-size: 16px;"
}, [/* children */]);
```

### Other Attributes

```javascript
h("input", {
  type: "text",
  value: this.state.inputValue,
  placeholder: "Enter text",
  disabled: true
});
```

## 📖 Examples

Check out the [GitHub repository](https://github.com/SherlockHolmes07/betal-fe) for complete examples including:
- Todo app

## 🤝 Contributing

Contributions are welcome! Visit the [GitHub repository](https://github.com/SherlockHolmes07/betal-fe) for contribution guidelines.

## 📄 License

MIT - Feel free to fork, modify, and build upon this project!

## 🔗 Links

- [GitHub Repository](https://github.com/SherlockHolmes07/betal-fe)
- [npm Package](https://www.npmjs.com/package/betal-fe)
- [Report Issues](https://github.com/SherlockHolmes07/betal-fe/issues)
