import { defineComponent, h } from 'betal-fe';

const App = defineComponent({
  state() {
    return { count: 0 };
  },

  render() {
    return h('div', {}, [
      h('h1', {}, ['{{PROJECT_NAME}}']),
      h('div', { class: 'counter-card' }, [
        h('p', { class: 'counter-count' }, [`${this.state.count}`]),
        h('button', {
          on: { click: () => this.updateState({ count: this.state.count + 1 }) },
        }, ['Increment']),
      ]),
    ]);
  },
});

export default App;
