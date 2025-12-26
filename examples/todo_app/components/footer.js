import { defineComponent, h } from "betal-fe";
import { Icon } from "../utils/icons.js";

const Footer = defineComponent({
  render() {
    const { totalTodos, completedTodos } = this.props;

    return h(
      "footer",
      {
        class:
          "max-w-6xl mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400",
      },
      [
        h("p", { class: "flex items-center justify-center gap-1" }, [
          h("span", {}, ["Built with"]),
          Icon("heart", { size: "text-sm", class: "text-red-500" }),
          h("span", {}, ["using"]),
          h(
            "a",
            {
              href: "https://betalfe.com",
              target: "_blank",
              rel: "noopener noreferrer",
              class: "text-primary hover:underline font-medium",
            },
            ["Betal-FE"]
          ),
          h("span", {}, ["framework"]),
        ]),
        h("p", { class: "text-sm mt-2" }, [
          `${totalTodos} total todos • ${completedTodos} completed • Auto-saved to localStorage`,
        ]),
      ]
    );
  },
});

export default Footer;
