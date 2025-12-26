import { defineComponent, h } from "betal-fe";
import { Icon } from "../utils/icons.js";

const EmptyState = defineComponent({
  render() {
    const { searchQuery, filter } = this.props;

    return h("div", { class: "text-center py-16" }, [
      h(
        "div",
        { class: "text-gray-400 dark:text-gray-500 mb-4 flex justify-center" },
        [Icon("inbox", { size: "text-6xl" })]
      ),
      h(
        "h3",
        {
          class: "text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2",
        },
        [
          searchQuery
            ? "No matching todos"
            : filter === "completed"
            ? "No completed todos yet"
            : "No active todos",
        ]
      ),
      h("p", { class: "text-gray-500 dark:text-gray-400" }, [
        searchQuery
          ? "Try a different search term"
          : "Add a new todo to get started!",
      ]),
    ]);
  },
});

export default EmptyState;
