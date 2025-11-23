import { ACTIONS } from './constants.js';

export const reducers = {
  [ACTIONS.UPDATE_CURRENT_TODO]: (state, currentTodo) => ({
    ...state,
    currentTodo,
  }),
  [ACTIONS.ADD_TODO]: (state) => ({
    ...state,
    currentTodo: "",
    todos: [...state.todos, state.currentTodo],
  }),
  [ACTIONS.START_EDITING_TODO]: (state, idx) => ({
    ...state,
    edit: {
      idx: idx,
      originalText: state.todos[idx],
      editedText: state.todos[idx],
    },
  }),
  [ACTIONS.EDIT_TODO]: (state, editedText) => ({
    ...state,
    edit: {
      ...state.edit,
      editedText,
    },
  }),
  [ACTIONS.SAVE_EDITED_TODO]: (state) => {
    const newTodos = [...state.todos];
    newTodos[state.edit.idx] = state.edit.editedText;
    return {
      ...state,
      todos: newTodos,
      edit: {
        idx: null,
        originalText: "",
        editedText: "",
      },
    };
  },
  [ACTIONS.CANCEL_EDITING_TODO]: (state) => ({
    ...state,
    edit: {
      idx: null,
      originalText: "",
      editedText: "",
    },
  }),
  [ACTIONS.REMOVE_TODO]: (state, idx) => ({
    ...state,
    todos: state.todos.filter((_, i) => i !== idx),
  }),
};
