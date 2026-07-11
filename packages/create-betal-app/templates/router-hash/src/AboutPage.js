import { defineComponent, h } from 'betal-fe';

const AboutPage = defineComponent({
  render() {
    return h('div', {}, [
      h('h1', {}, ['About']),
      h('p', {}, [
        'This page is routed with HashRouter — the URL uses a "#", which needs ',
        'no server configuration at all: it works from a plain file, a static ',
        'host, anywhere.',
      ]),
    ]);
  },
});

export default AboutPage;
