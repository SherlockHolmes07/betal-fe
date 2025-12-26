import { h, defineComponent } from "betal-fe";
import TodoItem from "./todo-item.js";

const TodoList = defineComponent({
  render() {
    const { todos } = this.props;

    return h(
      "div",
      { class: "space-y-4" },
      todos.map((todo) =>
        h(TodoItem, {
          key: todo.id,
          todo,
          on: {
            remove: (id) => this.emit("remove", id),
            edit: (data) => this.emit("edit", data),
            toggle: (id) => this.emit("toggle", id),
          },
        })
      )
    );
  },
});

export default TodoList;
