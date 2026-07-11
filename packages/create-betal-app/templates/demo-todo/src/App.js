import { defineComponent, h } from 'betal-fe';

const STORAGE_KEY = 'todos';

function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // localStorage unavailable (private browsing, etc.) — not fatal, just
    // means todos won't persist across a reload.
  }
}

const App = defineComponent({
  state() {
    return { todos: loadTodos(), draft: '' };
  },

  onStateChange() {
    saveTodos(this.state.todos);
  },

  addTodo() {
    const text = this.state.draft.trim();
    if (text === '') return;

    this.updateState({
      todos: [...this.state.todos, { id: crypto.randomUUID(), text, completed: false }],
      draft: '',
    });
  },

  toggleTodo(id) {
    this.updateState({
      todos: this.state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    });
  },

  removeTodo(id) {
    this.updateState({ todos: this.state.todos.filter((todo) => todo.id !== id) });
  },

  render() {
    const { todos, draft } = this.state;

    return h('div', {}, [
      h('h1', {}, ['{{PROJECT_NAME}}']),

      h('form', {
        class: 'todo-form',
        on: {
          submit: (event) => { event.preventDefault(); this.addTodo(); },
        },
      }, [
        h('input', {
          type: 'text',
          value: draft,
          placeholder: 'What needs doing?',
          on: { input: (event) => this.updateState({ draft: event.target.value }) },
        }),
        h('button', { type: 'submit' }, ['Add']),
      ]),

      todos.length === 0
        ? h('p', { class: 'todo-empty' }, ['No todos yet — add one above.'])
        : h('ul', { class: 'todo-list' }, todos.map((todo) => h('li', {
            key: todo.id,
            class: `todo-item${todo.completed ? ' completed' : ''}`,
          }, [
            h('label', {}, [
              h('input', {
                type: 'checkbox',
                checked: todo.completed,
                on: { change: () => this.toggleTodo(todo.id) },
              }),
              h('span', {}, [todo.text]),
            ]),
            h('button', { type: 'button', on: { click: () => this.removeTodo(todo.id) } }, ['Remove']),
          ]))),
    ]);
  },
});

export default App;
