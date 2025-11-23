import { h } from "betal-fe";
import { ACTIONS } from '../constants.js';

export function ViewTodo({ todo, i }, emit) {
  return h("li", {}, [
    h(
      "span",
      {
        on: {
          dblclick: () => emit(ACTIONS.START_EDITING_TODO, i),
        },
        class: "mr-2",
      },
      [todo]
    ),
    h(
      "button",
      {
        on: {
          click: () => emit(ACTIONS.REMOVE_TODO, i),
        },
      },
      ["Done"]
    ),
  ]);
}
