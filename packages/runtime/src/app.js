import { destroyDOM } from './destroy-dom.js';
import { Dispatcher } from './dispatcher.js';
import { mountDOM } from './mount-dom.js';
import { patchDOM } from './patch-dom.js';

export function createApp({ state, view, reducers = {} }) {
  let parentEl = null;
  let vdom = null;

  const dispatcher = new Dispatcher();
  const subscriptions = [dispatcher.afterEveryCommand(renderApp)];

  function emit(eventName, payload) {
    dispatcher.dispatch(eventName, payload);
  }

  for (const actionName in reducers) {
    const reducer = reducers[actionName];
    // the subscription returns an unsubscribe function
    const subs = dispatcher.subscribe(actionName, (payload) => {
      state = reducer(state, payload);
    });
    subscriptions.push(subs);
  }

  function renderApp() {
    const newVdom = view(state, emit);
    vdom = patchDOM(vdom, newVdom, parentEl);
  }

  return {
    mount(_parentEl) {
      if (vdom) {
        throw new Error('App is already mounted');
      }
      parentEl = _parentEl;
      vdom = view(state, emit);
      mountDOM(vdom, parentEl);
    },
    unmount() {
      destroyDOM(vdom);
      vdom = null;
      subscriptions.forEach((unsub) => unsub());
    }
  }
}