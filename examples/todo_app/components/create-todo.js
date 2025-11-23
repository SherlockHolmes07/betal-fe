import { h } from "betal-fe";
import { ACTIONS } from '../constants.js';

export function CreateTodo({ currentTodo }, emit) {
  return h("div", {}, [
    h("label", { for: "todo-input" }, ["New TODO"]),
    h("input", {
      type: "text",
      id: "todo-input",
      value: currentTodo,
      on: {
        input: ({ target }) => emit(ACTIONS.UPDATE_CURRENT_TODO, target.value),
        keydown: ({ key }) => {
          if (key === "Enter" && currentTodo.length >= 3) {
            emit(ACTIONS.ADD_TODO);
          }
        },
      },
      class: "mr-2",
    }),
    h(
      "button",
      {
        disabled: currentTodo.length < 3,
        on: { click: () => emit(ACTIONS.ADD_TODO) },
      },
      ["Add"]
    ),
  ]);
}
