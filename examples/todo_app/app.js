import { h, hFragment } from "betal-fe";
import { CreateTodo } from './components/create-todo.js';
import { TodoList } from './components/todo-list.js';

export function App(state, emit) {
  return hFragment([
    h("h1", {}, ["My TODOs"]),
    CreateTodo(state, emit),
    TodoList(state, emit),
  ]);
}