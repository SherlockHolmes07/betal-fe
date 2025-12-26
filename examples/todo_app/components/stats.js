import { defineComponent, h } from "betal-fe";
import { Icon } from "../utils/icons.js";

const VALUE_COLORS = {
  default: "text-gray-900 dark:text-white",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
};

const ICON_COLORS = {
  default: "text-indigo-500",
  blue: "text-blue-500",
  green: "text-green-500",
  purple: "text-purple-500",
};

const StatCard = defineComponent({
  render() {
    const { icon, value, label, color = "default" } = this.props;

    return h(
      "div",
      {
        class:
          "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform",
      },
      [
        h("div", { class: `mb-2 ${ICON_COLORS[color]}` }, [
          Icon(icon, { size: "text-3xl" }),
        ]),
        h("div", { class: `text-2xl font-bold ${VALUE_COLORS[color]}` }, [
          value,
        ]),
        h("div", { class: "text-sm text-gray-600 dark:text-gray-400" }, [
          label,
        ]),
      ]
    );
  },
});

const getStatsConfig = (props) => [
  {
    icon: "clipboardList",
    value: props.totalTodos.toString(),
    label: "Total Tasks",
    color: "default",
  },
  {
    icon: "zap",
    value: props.activeTodos.toString(),
    label: "Active",
    color: "blue",
  },
  {
    icon: "checkCircle",
    value: props.completedTodos.toString(),
    label: "Completed",
    color: "green",
  },
  {
    icon: "barChart",
    value: `${props.completionRate}%`,
    label: "Completion",
    color: "purple",
  },
];

const Stats = defineComponent({
  render() {
    const statsConfig = getStatsConfig(this.props);

    return h(
      "div",
      { class: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" },
      statsConfig.map((stat) => h(StatCard, { key: stat.label, ...stat }))
    );
  },
});

export default Stats;
