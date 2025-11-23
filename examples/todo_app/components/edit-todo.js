import { h } from "betal-fe";
import { ACTIONS } from '../constants.js';

export function EditTodo({ edit }, emit) {
  return h("li", {}, [
    h("input", {
      value: edit.editedText,
      on: {
        input: ({ target }) => emit(ACTIONS.EDIT_TODO, target.value),
      },
      class: "mr-2",
    }),
    h(
      "button",
      {
        on: {
          click: () => emit(ACTIONS.SAVE_EDITED_TODO),
        },
        class: "mr-2",
      },
      ["Save"]
    ),
    h(
      "button",
      {
        on: {
          click: () => emit(ACTIONS.CANCEL_EDITING_TODO),
        },
      },
      ["Cancel"]
    ),
  ]);
}
