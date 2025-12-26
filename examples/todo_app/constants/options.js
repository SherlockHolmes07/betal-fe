export const PRIORITY_OPTIONS = [
  { value: "low", label: "🟢 Low", icon: "circleFilled", color: "text-green-500" },
  { value: "medium", label: "🟡 Medium", icon: "circleFilled", color: "text-yellow-500" },
  { value: "high", label: "🔴 High", icon: "circleFilled", color: "text-red-500" },
];

export const CATEGORY_OPTIONS = [
  { value: "personal", label: "🏠 Personal", icon: "home" },
  { value: "work", label: "💼 Work", icon: "briefcase" },
  { value: "shopping", label: "🛒 Shopping", icon: "shoppingCart" },
  { value: "health", label: "❤️ Health", icon: "heart" },
  { value: "other", label: "📍 Other", icon: "mapPin" },
];

export const PRIORITY_COLORS = {
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700",
  medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
  low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
};

export const CATEGORY_ICONS = {
  personal: "home",
  work: "briefcase",
  shopping: "shoppingCart",
  health: "heart",
  other: "mapPin",
};
