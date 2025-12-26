import { h, defineComponent } from "betal-fe";
import { PRIORITY_OPTIONS, CATEGORY_OPTIONS } from "../constants/options.js";
import {
  INPUT_STYLES,
  BUTTON_STYLES,
  CARD_STYLES,
} from "../constants/styles.js";
import { renderSelect, renderDateInput } from "../utils/render-helpers.js";
import { Icon } from "../utils/icons.js";

const CreateTodo = defineComponent({
  state() {
    return {
      text: "",
      priority: "medium",
      category: "personal",
      dueDate: "",
      showAdvanced: false,
    };
  },

  render() {
    const { text, priority, category, dueDate, showAdvanced } = this.state;
    const isValid = text.trim().length >= 3;
    const addBtnClass = isValid
      ? BUTTON_STYLES.gradient
      : BUTTON_STYLES.disabled;

    return h(
      "div",
      {
        class:
          "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700",
      },
      [
        h(
          "h2",
          { class: "text-xl font-bold text-gray-900 dark:text-white mb-4" },
          ["Add New Task"]
        ),

        // Main input row
        h("div", { class: "flex gap-3 mb-4" }, [
          h("input", {
            type: "text",
            placeholder: "What needs to be done?",
            value: text,
            class: INPUT_STYLES.inputLarge,
            on: {
              input: ({ target }) => this.updateState({ text: target.value }),
              keydown: ({ key }) =>
                key === "Enter" && isValid && this.addTodo(),
            },
          }),
          h(
            "button",
            {
              disabled: !isValid,
              class: `px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${addBtnClass}`,
              on: { click: () => this.addTodo() },
            },
            [Icon("plus", { size: "text-sm" }), h("span", {}, ["Add Task"])]
          ),
        ]),

        // Toggle advanced options
        h(
          "button",
          {
            class:
              "text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-3 flex items-center gap-1",
            on: {
              click: () => this.updateState({ showAdvanced: !showAdvanced }),
            },
          },
          [
            Icon(showAdvanced ? "chevronDown" : "chevronRight", {
              size: "text-xs",
            }),
            h("span", {}, [
              showAdvanced
                ? "Hide Options"
                : "Show Options (Priority, Category, Due Date)",
            ]),
          ]
        ),

        // Advanced options
        ...(showAdvanced
          ? [
              h(
                "div",
                {
                  class:
                    "grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600",
                },
                [
                  renderSelect("Priority", PRIORITY_OPTIONS, priority, (val) =>
                    this.updateState({ priority: val })
                  ),
                  renderSelect("Category", CATEGORY_OPTIONS, category, (val) =>
                    this.updateState({ category: val })
                  ),

                  // Due date picker
                  renderDateInput("Due Date", dueDate, (val) =>
                    this.updateState({ dueDate: val })
                  ),
                ]
              ),
            ]
          : []),

        // Validation message
        ...(text.length > 0 && text.length < 3
          ? [
              h("p", { class: "text-sm text-red-500 dark:text-red-400 mt-2" }, [
                "Task must be at least 3 characters long",
              ]),
            ]
          : []),
      ]
    );
  },

  addTodo() {
    const { text, priority, category, dueDate } = this.state;
    if (text.trim().length < 3) return;

    this.emit("add", {
      text: text.trim(),
      priority,
      category,
      dueDate: dueDate || null,
    });

    // Reset form
    this.updateState({
      text: "",
      priority: "medium",
      category: "personal",
      dueDate: "",
      showAdvanced: false,
    });
  },
});

export default CreateTodo;
