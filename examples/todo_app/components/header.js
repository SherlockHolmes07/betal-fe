import { defineComponent, h } from "betal-fe";
import { Icon } from "../utils/icons.js";

const Header = defineComponent({
  render() {
    const { darkMode, onToggleDarkMode } = this.props;

    return h(
      "header",
      {
        class:
          "bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700",
      },
      [
        h("div", { class: "max-w-6xl mx-auto px-4 py-6" }, [
          h(
            "div",
            { class: "flex items-center justify-between flex-wrap gap-4" },
            [
              h("div", { class: "flex items-center gap-3" }, [
                h(
                  "div",
                  {
                    class:
                      "w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg text-white",
                  },
                  [Icon("check", { size: "text-2xl" })]
                ),
                h("div", {}, [
                  h(
                    "h1",
                    {
                      class: "text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent",
                    },
                    ["Betal Todo"]
                  ),
                  h(
                    "p",
                    { class: "text-sm text-gray-600 dark:text-gray-400" },
                    [
                      "Powered by ",
                      h(
                        "a",
                        {
                          href: "https://betalfe.com",
                          target: "_blank",
                          rel: "noopener noreferrer",
                          class: "text-primary hover:underline font-medium",
                        },
                        ["betal-fe"]
                      ),
                      " framework",
                    ]
                  ),
                ]),
              ]),

              h(
                "button",
                {
                  class: `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-800 text-white"
                  } hover:scale-105 shadow-md`,
                  on: { click: onToggleDarkMode },
                },
                [
                  Icon(darkMode ? "sun" : "moon", { size: "text-lg" }),
                  h("span", {}, [darkMode ? "Light" : "Dark"]),
                ]
              ),
            ]
          ),
        ]),
      ]
    );
  },
});

export default Header;
