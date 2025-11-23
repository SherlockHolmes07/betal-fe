import { h } from "betal-fe";
import { TodoItem } from './todo-item.js';

export function TodoList({ todos, edit }, emit) {
  return h(
    "ul",
    {},
    todos.map((todo, i) => TodoItem({ todo, i, edit }, emit))
  );
}
