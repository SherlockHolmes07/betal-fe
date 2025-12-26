import { defineComponent, h } from "betal-fe";
import {
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_COLORS,
  CATEGORY_ICONS,
} from "../constants/options.js";
import {
  INPUT_STYLES,
  BUTTON_STYLES,
  CARD_STYLES,
} from "../constants/styles.js";
import { renderSelect, renderDateInput } from "../utils/render-helpers.js";
import { Icon } from "../utils/icons.js";

const TodoItem = defineComponent({
  state({ todo }) {
    return {
      todo,
      isEditing: false,
      editedText: todo.text,
      editedPriority: todo.priority,
      editedCategory: todo.category,
      editedDueDate: todo.dueDate || "",
    };
  },

  onPropsChange(newProps, oldProps) {
    if (newProps.todo !== oldProps.todo) {
      this.updateState({
        todo: newProps.todo,
        editedText: newProps.todo.text,
        editedPriority: newProps.todo.priority,
        editedCategory: newProps.todo.category,
        editedDueDate: newProps.todo.dueDate || "",
      });
    }
  },

  render() {
    const { isEditing } = this.state;
    return isEditing ? this.renderEditMode() : this.renderViewMode();
  },

  renderViewMode() {
    const { todo } = this.state;
    const { text, completed, priority, category, dueDate, createdAt } = todo;

    const isOverdue = dueDate && new Date(dueDate) < new Date() && !completed;
    const createdDate = new Date(createdAt).toLocaleDateString();

    // Determine border color based on priority
    const borderColor = completed
      ? "border-green-500"
      : priority === "high"
      ? "border-red-500"
      : priority === "medium"
      ? "border-yellow-500"
      : "border-green-500";

    return h(
      "div",
      {
        class: `group ${
          CARD_STYLES.base
        } hover:shadow-xl transition-all border-l-4 ${
          completed ? "opacity-60" : ""
        } ${borderColor}`,
      },
      [
        h("div", { class: "flex items-start gap-4" }, [
          // Checkbox
          h("div", { class: "flex-shrink-0 pt-1" }, [
            h(
              "button",
              {
                class: `w-6 h-6 rounded-full border-2 ${
                  completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-indigo-500"
                } flex items-center justify-center transition-all`,
                on: { click: () => this.emit("toggle", todo.id) },
              },
              [
                ...(completed
                  ? [Icon("check", { size: "text-xs", class: "text-white" })]
                  : []),
              ]
            ),
          ]),

          // Content
          h("div", { class: "flex-1 min-w-0" }, [
            h("div", { class: "flex items-center gap-2 flex-wrap mb-2" }, [
              h(
                "p",
                {
                  class: `text-lg font-medium ${
                    completed
                      ? "line-through text-gray-500 dark:text-gray-500"
                      : "text-gray-900 dark:text-white"
                  }`,
                  on: { dblclick: () => this.startEdit() },
                },
                [text]
              ),
            ]),

            h("div", { class: "flex flex-wrap gap-2 mb-2" }, [
              // Priority badge
              h(
                "span",
                {
                  class: `px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[priority]}`,
                },
                [priority.toUpperCase()]
              ),

              // Category badge
              h(
                "span",
                {
                  class:
                    "px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1",
                },
                [
                  Icon(CATEGORY_ICONS[category], { size: "text-xs" }),
                  h("span", {}, [category]),
                ]
              ),

              // Due date badge
              ...(dueDate
                ? [
                    h(
                      "span",
                      {
                        class: `px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                          isOverdue
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        }`,
                      },
                      [
                        Icon("calendar", { size: "text-xs" }),
                        h("span", {}, [
                          `${dueDate}${isOverdue ? " (Overdue!)" : ""}`,
                        ]),
                      ]
                    ),
                  ]
                : []),
            ]),

            h("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, [
              `Created: ${createdDate}`,
            ]),
          ]),

          // Actions
          h(
            "div",
            {
              class:
                "flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
            },
            [
              h(
                "button",
                {
                  class:
                    "p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors",
                  on: { click: () => this.startEdit() },
                  title: "Edit",
                },
                [Icon("edit", { size: "text-sm" })]
              ),
              h(
                "button",
                {
                  class:
                    "p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors",
                  on: { click: () => this.emit("remove", todo.id) },
                  title: "Delete",
                },
                [Icon("trash", { size: "text-sm" })]
              ),
            ]
          ),
        ]),
      ]
    );
  },

  renderEditMode() {
    const { editedText, editedPriority, editedCategory, editedDueDate } =
      this.state;

    return h(
      "div",
      { class: `${CARD_STYLES.elevated} border-2 border-indigo-500` },
      [
        h("div", { class: "space-y-3" }, [
          // Text input
          h("input", {
            type: "text",
            value: editedText,
            class: INPUT_STYLES.input,
            on: {
              input: ({ target }) =>
                this.updateState({ editedText: target.value }),
            },
          }),

          // Priority, Category, Due Date
          h("div", { class: "grid grid-cols-3 gap-3" }, [
            renderSelect(
              null,
              PRIORITY_OPTIONS,
              editedPriority,
              (val) => this.updateState({ editedPriority: val }),
              { showLabel: false, selectClass: INPUT_STYLES.selectCompact }
            ),
            renderSelect(
              null,
              CATEGORY_OPTIONS,
              editedCategory,
              (val) => this.updateState({ editedCategory: val }),
              { showLabel: false, selectClass: INPUT_STYLES.selectCompact }
            ),
            renderDateInput(
              null,
              editedDueDate,
              (val) => this.updateState({ editedDueDate: val }),
              { showLabel: false, inputClass: INPUT_STYLES.selectCompact }
            ),
          ]),

          // Action buttons
          h("div", { class: "flex gap-2 justify-end" }, [
            h(
              "button",
              {
                class: `${BUTTON_STYLES.primary} flex items-center gap-2`,
                on: { click: () => this.saveEdit() },
              },
              [Icon("save", { size: "text-sm" }), h("span", {}, ["Save"])]
            ),
            h(
              "button",
              {
                class: `${BUTTON_STYLES.secondary} flex items-center gap-2`,
                on: { click: () => this.cancelEdit() },
              },
              [Icon("x", { size: "text-sm" }), h("span", {}, ["Cancel"])]
            ),
          ]),
        ]),
      ]
    );
  },

  startEdit() {
    const { todo } = this.state;
    this.updateState({
      isEditing: true,
      editedText: todo.text,
      editedPriority: todo.priority,
      editedCategory: todo.category,
      editedDueDate: todo.dueDate || "",
    });
  },

  saveEdit() {
    const { todo, editedText, editedPriority, editedCategory, editedDueDate } =
      this.state;

    if (editedText.trim().length < 3) return;

    this.emit("edit", {
      id: todo.id,
      text: editedText.trim(),
      priority: editedPriority,
      category: editedCategory,
      dueDate: editedDueDate || null,
    });

    this.updateState({ isEditing: false });
  },

  cancelEdit() {
    this.updateState({ isEditing: false });
  },
});

export default TodoItem;
