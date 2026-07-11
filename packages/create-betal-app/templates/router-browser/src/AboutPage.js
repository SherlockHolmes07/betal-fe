import { defineComponent, h } from 'betal-fe';

const AboutPage = defineComponent({
  render() {
    return h('div', {}, [
      h('h1', {}, ['About']),
      h('p', {}, [
        'This page is routed with BrowserRouter — the URL is a real path, ',
        'no "#". That means the server needs to know to serve this app for ',
        'every path, or a refresh on this page 404s. See DEPLOYING.md in the ',
        'project root for how that’s handled for your host.',
      ]),
    ]);
  },
});

export default AboutPage;
