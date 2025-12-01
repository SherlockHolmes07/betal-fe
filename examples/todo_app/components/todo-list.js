import { h, defineComponent } from "../../../packages/runtime/src/index.js";
import TodoItem from "./todo-item";

const TodoList = defineComponent({
  render() {
    const { todos } = this.props; // Receive todos as prop from parent component

    return h(
      "ul",
      {},
      todos.map((todo, i) =>
        h(TodoItem, {
          key: todo.id, // Unique key for efficient patching
          todo: todo.text,
          i,
          on: {
            remove: (i) => this.emit("remove", i), // Bubble up 'remove' event to parent component
            edit: ({ edited, i }) => this.emit("edit", { edited, i }), // Bubble up 'edit' event to parent component  
          },
        })
      )
    );
  },
});

export default TodoList;
