import { defineComponent, h, hFragment } from "../../packages/runtime/src/index.js";
import CreateTodo from "./components/create-todo.js";
import TodoList from "./components/todo-list.js";

// Define a component using betal-fe's defineComponent function.
// defineComponent takes an object with:
// - state: A function that returns the initial state.
// - render: A function that returns the virtual DOM tree using h(), hFragment(), hString().
// - Additional methods: Custom functions for handling events and updating state.
// The component manages its own state and re-renders when state changes.
const App = defineComponent({
  state() {
    return {
      todos: [
        { id: crypto.randomUUID(), text: "Learn betal-fe" },
        { id: crypto.randomUUID(), text: "Build a TODO app" },
        { id: crypto.randomUUID(), text: "Profit!" },
      ],
    };
  },

  // render() defines the component's UI using virtual DOM functions.
  // h(tag, props, children) creates elements; hFragment(children) groups multiple elements.
  // Props include attributes, styles, and event handlers (under 'on').
  // 'this' refers to the component instance, giving access to state, props and public methods.
  render() {
    const { todos } = this.state;

    return hFragment([
      h("h1", {}, ["My TODOs"]),
      h(CreateTodo, {
        // Pass event handler for 'add' event emitted by CreateTodo component.
        on: {
          add: this.addTodo,
        },
      }),
      h(TodoList, {
        todos, // Pass current todos as prop to TodoList component.
        // Pass event handlers for 'remove' and 'edit' events emitted by TodoList component.
        on: {
          remove: this.removeTodo,
          edit: this.editTodo,
        },
      }),
    ]);
  },

  addTodo(text) {
    const todo = { id: crypto.randomUUID(), text };
    this.updateState({ todos: [...this.state.todos, todo] }); // Update state to trigger re-render
  },

  removeTodo(idx) {
    const newTodos = [...this.state.todos];
    newTodos.splice(idx, 1);
    this.updateState({ todos: newTodos });
  },

  editTodo({ edited, i }) {
    const newTodos = [...this.state.todos];
    newTodos[i] = { ...newTodos[i], text: edited };
    this.updateState({ todos: newTodos });
  },
});

export default App;
