import { h } from "betal-fe";
import { INPUT_STYLES } from "../constants/styles.js";

/**
 * Renders a labeled select dropdown
 * @param {string} label - The label text
 * @param {Array<{value: string, label: string}>} options - Array of option objects
 * @param {string} currentValue - Currently selected value
 * @param {function} onChange - Callback when value changes
 * @param {object} [config] - Optional configuration
 * @param {string} [config.selectClass] - Custom class for select element
 * @param {boolean} [config.showLabel=true] - Whether to show the label
 * @returns {object} Virtual DOM element
 */
export const renderSelect = (label, options, currentValue, onChange, config = {}) => {
  const { selectClass = INPUT_STYLES.select, showLabel = true } = config;

  const children = [];

  if (showLabel && label) {
    children.push(h("label", { class: INPUT_STYLES.label }, [label]));
  }

  children.push(
    h(
      "select",
      {
        class: selectClass,
        on: { change: ({ target }) => onChange(target.value) },
      },
      options.map((opt) =>
        h("option", { value: opt.value, selected: currentValue === opt.value }, [
          opt.label,
        ])
      )
    )
  );

  return h("div", {}, children);
};

/**
 * Renders a labeled date input
 * @param {string} label - The label text
 * @param {string} value - Current date value
 * @param {function} onChange - Callback when value changes
 * @param {object} [config] - Optional configuration
 * @param {string} [config.inputClass] - Custom class for input element
 * @param {boolean} [config.showLabel=true] - Whether to show the label
 * @returns {object} Virtual DOM element
 */
export const renderDateInput = (label, value, onChange, config = {}) => {
  const { inputClass = INPUT_STYLES.select, showLabel = true } = config;

  const children = [];

  if (showLabel && label) {
    children.push(h("label", { class: INPUT_STYLES.label }, [label]));
  }

  children.push(
    h("input", {
      type: "date",
      value: value,
      class: inputClass,
      on: { change: ({ target }) => onChange(target.value) },
    })
  );

  return h("div", {}, children);
};
