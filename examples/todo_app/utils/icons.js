import { h } from "betal-fe";

const ICON_CLASSES = {
  check: "fa-solid fa-check",
  checkCircle: "fa-solid fa-circle-check",
  x: "fa-solid fa-xmark",
  edit: "fa-solid fa-pen",
  trash: "fa-solid fa-trash",
  save: "fa-solid fa-floppy-disk",
  plus: "fa-solid fa-plus",
  chevronDown: "fa-solid fa-chevron-down",
  chevronRight: "fa-solid fa-chevron-right",
  chevronUp: "fa-solid fa-chevron-up",
  sun: "fa-solid fa-sun",
  moon: "fa-solid fa-moon",
  listTodo: "fa-solid fa-list-check",
  clipboardList: "fa-solid fa-clipboard-list",
  zap: "fa-solid fa-bolt",
  barChart: "fa-solid fa-chart-simple",
  trendingUp: "fa-solid fa-arrow-trend-up",
  calendar: "fa-solid fa-calendar",
  home: "fa-solid fa-house",
  briefcase: "fa-solid fa-briefcase",
  shoppingCart: "fa-solid fa-cart-shopping",
  heart: "fa-solid fa-heart",
  mapPin: "fa-solid fa-location-dot",
  circleFilled: "fa-solid fa-circle",
  circle: "fa-regular fa-circle",
  inbox: "fa-solid fa-inbox",
  boxOpen: "fa-solid fa-box-open",
};

/**
 * Create a Font Awesome icon element
 * @param {string} name - Icon name from ICON_CLASSES
 * @param {object} options - Configuration options
 * @param {string} options.size - Icon size class (e.g., "text-xl", "text-2xl")
 * @param {string} options.class - Additional CSS classes
 * @returns {object} Virtual DOM element
 */
export const Icon = (name, options = {}) => {
  const { size = "", class: className = "" } = options;

  const iconClass = ICON_CLASSES[name];
  if (!iconClass) {
    console.warn(`Icon "${name}" not found`);
    return h("span", {}, ["?"]);
  }

  const classes = [iconClass, size, className].filter(Boolean).join(" ");

  return h("i", { class: classes });
};

export default Icon;
