import { defineComponent, h } from "betal-fe";
import Header from "./components/header.js";
import Stats from "./components/stats.js";
import TodosSection from "./components/todos-section.js";
import Footer from "./components/footer.js";
import { DEFAULT_TODOS } from "./constants/ui.js";

const STORAGE_KEY = "betal-todos";

const App = defineComponent({
  state() {
    return {
      todos: [],
      darkMode: false,
      loading: true,
    };
  },

  onMounted() {
    this.loadTodos();
    this.loadDarkMode();
  },

  onStateChange() {
    if (this.state.todos) {
      this.saveTodos();
    }
  },

  loadTodos() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log("stored", stored);
      if (stored) {
        const todos = JSON.parse(stored);
        this.updateState({ todos, loading: false });
        console.log(`Loaded ${todos.length} todos from localStorage`);
      } else {
        this.updateState({
          todos: DEFAULT_TODOS,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
      this.updateState({ loading: false });
    }
  },

  saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.todos));
      console.log("Todos saved to localStorage");
    } catch (error) {
      console.error("Failed to save todos:", error);
    }
  },

  loadDarkMode() {
    const darkMode = localStorage.getItem("darkMode") === "true";
    this.updateState({ darkMode });
    this.applyDarkMode(darkMode);
  },

  applyDarkMode(isDark) {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  toggleDarkMode() {
    const newDarkMode = !this.state.darkMode;
    this.applyDarkMode(newDarkMode);
    this.updateState({ darkMode: newDarkMode });
    localStorage.setItem("darkMode", newDarkMode.toString());
  },

  render() {
    const { todos, darkMode, loading } = this.state;

    if (loading) {
      return h(
        "div",
        { class: "flex items-center justify-center min-h-screen" },
        [
          h("div", { class: "text-2xl text-gray-600 dark:text-gray-300" }, [
            "Loading...",
          ]),
        ]
      );
    }

    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const activeTodos = totalTodos - completedTodos;
    const completionRate =
      totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return h(
      "div",
      {
        class:
          "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200",
      },
      [
        h(Header, {
          darkMode,
          onToggleDarkMode: () => this.toggleDarkMode(),
        }),

        h("main", { class: "max-w-6xl mx-auto px-4 py-8" }, [
          h(Stats, {
            totalTodos,
            completedTodos,
            activeTodos,
            completionRate,
          }),

          h(TodosSection, {
            todos,
            on: {
              add: this.addTodo,
              remove: this.removeTodo,
              edit: this.editTodo,
              toggle: this.toggleTodo,
              clearCompleted: () => this.clearCompleted(),
            },
          }),
        ]),

        h(Footer, {
          totalTodos,
          completedTodos,
        }),
      ]
    );
  },

  addTodo(todoData) {
    const todo = {
      id: crypto.randomUUID(),
      text: todoData.text,
      completed: false,
      priority: todoData.priority || "low",
      category: todoData.category || "personal",
      dueDate: todoData.dueDate || null,
      createdAt: Date.now(),
    };
    this.updateState({ todos: [...this.state.todos, todo] });
  },

  removeTodo(id) {
    const newTodos = this.state.todos.filter((todo) => todo.id !== id);
    this.updateState({ todos: newTodos });
  },

  editTodo({ id, text, priority, category, dueDate }) {
    const newTodos = this.state.todos.map((todo) =>
      todo.id === id ? { ...todo, text, priority, category, dueDate } : todo
    );
    this.updateState({ todos: newTodos });
  },

  toggleTodo(id) {
    const newTodos = this.state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.updateState({ todos: newTodos });
  },

  clearCompleted() {
    const newTodos = this.state.todos.filter((todo) => !todo.completed);
    this.updateState({ todos: newTodos });
  },
});

export default App;
