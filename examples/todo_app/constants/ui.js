const BTN_BASE = "px-6 py-2 rounded-lg font-medium transition-all";
const BTN_ACTIVE = "text-white shadow-lg";
const BTN_INACTIVE =
  "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

export const FILTER_BTN_CLASSES = {
  all: {
    active: `${BTN_BASE} bg-indigo-600 ${BTN_ACTIVE}`,
    inactive: `${BTN_BASE} ${BTN_INACTIVE}`,
  },
  active: {
    active: `${BTN_BASE} bg-blue-600 ${BTN_ACTIVE}`,
    inactive: `${BTN_BASE} ${BTN_INACTIVE}`,
  },
  completed: {
    active: `${BTN_BASE} bg-green-600 ${BTN_ACTIVE}`,
    inactive: `${BTN_BASE} ${BTN_INACTIVE}`,
  },
};

export const DEFAULT_TODOS = [
  {
    id: crypto.randomUUID(),
    text: "Welcome to Betal Todo!",
    completed: false,
    priority: "high",
    category: "personal",
    dueDate: new Date().toISOString().split("T")[0],
    createdAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    text: "Try adding a new todo",
    completed: false,
    priority: "medium",
    category: "work",
    dueDate: null,
    createdAt: Date.now(),
  },
];
