import { createBetalApp, defineComponent, h, hFragment, HashRouter, RouterLink, RouterOutlet } from 'betal-fe';
import HomePage from './App.js';
import AboutPage from './AboutPage.js';

const router = new HashRouter([
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
]);

const Shell = defineComponent({
  render() {
    return hFragment([
      h('nav', { class: 'app-nav' }, [
        h(RouterLink, { to: '/' }, ['Home']),
        h(RouterLink, { to: '/about' }, ['About']),
      ]),
      h(RouterOutlet),
    ]);
  },
});

createBetalApp(Shell, {}, { router }).mount(document.getElementById('app'));
