import { EditTodo } from './edit-todo.js';
import { ViewTodo } from './view-todo.js';

export function TodoItem({ todo, i, edit }, emit) {
  const isEditing = edit.idx === i;
  return isEditing
    ? EditTodo({ todo, i, edit }, emit)
    : ViewTodo({ todo, i, edit }, emit);
}
