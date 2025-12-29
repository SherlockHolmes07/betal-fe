import { defineComponent } from "./component.js";
import { h, hSlot } from "./h.js";

export const RouterLink = defineComponent({
  render() {
    const { to, ...rest } = this.props;

    return h(
      "a",
      {
        href: to,
        ...rest,
        on: {
          click: (e) => {
            e.preventDefault();
            this.handleNavigation(to);
          },
        },
      },
      [hSlot()]
    );
  },

  handleNavigation(to) {
    const anchorIndex = to.indexOf('#');
    
    if (anchorIndex !== -1 && anchorIndex > 0) {
      // Case: /path#anchor
      const path = to.substring(0, anchorIndex);
      const anchor = to.substring(anchorIndex + 1);
      this.appContext.router.navigateTo(path);
      
      // Wait for next tick to ensure DOM is updated
      setTimeout(() => {
        this.scrollToAnchor(anchor);
      }, 0);
    } else if (anchorIndex === 0) {
      // Case: #anchor
      const anchor = to.substring(1);
      this.scrollToAnchor(anchor);
    } else {
      // Case: /path
      this.appContext.router.navigateTo(to);
    }
  },

  scrollToAnchor(anchorId) {
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn(`[RouterLink] Element with id "${anchorId}" not found`);
    }
  },
});

export const RouterOutlet = defineComponent({
  state() {
    return {
      matchedRoute: null,
      subscription: null,
    };
  },

  onMounted() {
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
