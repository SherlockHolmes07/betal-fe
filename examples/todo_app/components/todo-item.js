import { defineComponent, h } from "../../../packages/runtime/src/index.js";

const TodoItem = defineComponent({
  // Component state to manage editing
  state({ todo }) {
    return {
      original: todo,
      edited: todo,
      isEditing: false,
    };
  },

  render() {
    const { isEditing, original, edited } = this.state;
    // Render different views based on editing state, We can also define helper methods for rendering.
    return isEditing
      ? this.renderInEditMode(edited)
      : this.renderInViewMode(original);
  },

  renderInEditMode(edited) {
    return h("li", {}, [
      h("input", {
        value: edited,
        on: {
          input: ({ target }) => this.updateState({ edited: target.value }),
        },
        class: "mr-2",
      }),
      h(
        "button",
        {
          on: {
            click: this.saveEdition,
          },
          class: "mr-2",
        },
        ["Save"]
      ),
      h("button", { on: { click: this.cancelEdition } }, ["Cancel"]),
    ]);
  },

  saveEdition() {
    this.updateState({ original: this.state.edited, isEditing: false });
    this.emit("edit", { edited: this.state.edited, i: this.props.i });
  },

  cancelEdition() {
    this.updateState({ edited: this.state.original, isEditing: false });
  },

  renderInViewMode(original) {
    return h("li", {}, [
      h(
        "span",
        {
          on: { dblclick: () => this.updateState({ isEditing: true }) },
          class: "mr-2",
        },
        [original]
      ),
      h("button", { on: { click: () => this.emit("remove", this.props.i) } }, [
        "Done",
      ]),
    ]);
  },
});

export default TodoItem;
