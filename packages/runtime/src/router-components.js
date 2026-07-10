import { defineComponent } from "./component.js";
import { h, hSlot } from "./h.js";

/**
 * A link that navigates via the router instead of doing a full page load.
 *
 * @prop {string} to - The target path, e.g. `'/user/42'`.
 *
 * Any other prop (`class`, `target`, etc.) is passed through to the
 * rendered `<a>` unchanged, and children become the link's content.
 * The rendered `<a>` has a real, working `href`, so it still behaves
 * correctly on right-click, middle-click, or "open in new tab."
 */
export const RouterLink = defineComponent({
  render() {
    const { to, ...rest } = this.props;

    return h(
      "a",
      {
        href: this.appContext.router.linkHref(to),
        ...rest,
        on: {
          // Take over normal link navigation and route through the SPA
          // router instead, so the page never actually reloads. 
          click: (e) => {
            e.preventDefault();
            this.appContext.router.navigateTo(to);
          },
        },
      },
      [hSlot()]
    );
  },
});

/**
 * Renders whichever component the current route matches, inside a
 * `<div id="router-outlet">`.
 */
export const RouterOutlet = defineComponent({
  state() {
    return {
      matchedRoute: null,
      subscription: null,
    };
  },

  onMounted() {
    // Subscribe to the router so we can update our state whenever the route changes.
    const subscription = this.appContext.router.subscribe(({ to }) => {
      this.handleRouteChange(to);
    });

    this.updateState({ subscription });
  },

  onUnmounted() {
    const { subscription } = this.state;
    this.appContext.router.unsubscribe(subscription);
  },

  handleRouteChange(matchedRoute) {
    this.updateState({ matchedRoute });
  },

  render() {
    const { matchedRoute } = this.state;

    return h("div", { id: "router-outlet" }, [
      matchedRoute ? h(matchedRoute.component) : null,
    ]);
  },
});
