import { defineComponent, h } from "betal-fe";
import CreateTodo from "./create-todo.js";
import TodoList from "./todo-list.js";
import EmptyState from "./empty-state.js";
import { FILTER_BTN_CLASSES } from "../constants/ui.js";

const TodosSection = defineComponent({
  state() {
    return {
      filter: "all",
      searchQuery: "",
    };
  },

  render() {
    const { todos } = this.props;
    const { filter, searchQuery } = this.state;

    // Filter todos based on current filter and search
    const filteredTodos = todos.filter((todo) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
          ? !todo.completed
          : filter === "completed"
          ? todo.completed
          : true;

      const matchesSearch =
        searchQuery === "" ||
        todo.text.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });

    return h("div", {}, [
      // Filter tabs
      h("div", { class: "flex flex-wrap gap-2 mb-6" }, [
        h(
          "button",
          {
            class:
              filter === "all"
                ? FILTER_BTN_CLASSES.all.active
                : FILTER_BTN_CLASSES.all.inactive,
            on: { click: () => this.updateState({ filter: "all" }) },
          },
          ["All"]
        ),
        h(
          "button",
          {
            class:
              filter === "active"
                ? FILTER_BTN_CLASSES.active.active
                : FILTER_BTN_CLASSES.active.inactive,
            on: { click: () => this.updateState({ filter: "active" }) },
          },
          ["Active"]
        ),
        h(
          "button",
          {
            class:
              filter === "completed"
                ? FILTER_BTN_CLASSES.completed.active
                : FILTER_BTN_CLASSES.completed.inactive,
            on: { click: () => this.updateState({ filter: "completed" }) },
          },
          ["Completed"]
        ),

        h("input", {
          type: "text",
          placeholder: "Search todos...",
          value: searchQuery,
          class:
            "flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none",
          on: {
            input: (e) => this.updateState({ searchQuery: e.target.value }),
          },
        }),

        h(
          "button",
          {
            class:
              "px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors",
            on: { click: () => this.emit("clearCompleted") },
          },
          ["Clear Completed"]
        ),
      ]),

      h(CreateTodo, {
        on: {
          add: (todoData) => this.emit("add", todoData),
        },
      }),

      h(TodoList, {
        todos: filteredTodos,
        on: {
          remove: (id) => this.emit("remove", id),
          edit: (data) => this.emit("edit", data),
          toggle: (id) => this.emit("toggle", id),
        },
      }),

      ...(filteredTodos.length === 0
        ? [
            h(EmptyState, {
              searchQuery,
              filter,
            }),
          ]
        : []),
    ]);
  },
});

export default TodosSection;
