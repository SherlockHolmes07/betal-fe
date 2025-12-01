import { h, defineComponent } from "../../../packages/runtime/src/index.js";

const CreateTodo = defineComponent({
  // Child component can also have its own state
  state() {
    return { text: "" };
  },

  render() {
    const { text } = this.state;

    return h("div", {}, [
      h("label", { for: "todo-input" }, ["New TODO"]),
      h("input", {
        type: "text",
        id: "todo-input",
        value: text,
        on: {
          // Update state with current input value on user input
          input: ({ target }) => this.updateState({ text: target.value }),
          keydown: ({ key }) => {
            if (key === "Enter" && text.length >= 3) {
              this.addTodo();
            }
          },
        },
        class: "mr-2",
      }),
      h(
        "button",
        {
          disabled: text.length < 3,
          on: { click: this.addTodo },
        },
        ["Add"]
      ),
    ]);
  },

  addTodo() {
    // Emit 'add' event with the current text to parent component
    this.emit("add", this.state.text);
    this.updateState({ text: "" });
  },
});

export default CreateTodo;
