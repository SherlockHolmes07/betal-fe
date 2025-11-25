import { withoutNulls } from "./utils/arrays.js";

export const DOM_TYPES = {
  TEXT: "text",
  ELEMENT: "element",
  FRAGMENT: "fragment",
};

export function h(tag, props = {}, children = []) {
  return {
    type: DOM_TYPES.ELEMENT,
    tag,
    props,
    children: mapTextNodes(withoutNulls(children)),
  };
}

function mapTextNodes(nodes) {
  return nodes.map((node) => 
    typeof node === "string" ? hString(node) : node
  );
}

export function hString(str) {
  return { type: DOM_TYPES.TEXT, value: str };
}

export function hFragment(vNodes) {
  return {
    type: DOM_TYPES.FRAGMENT,
    children: mapTextNodes(withoutNulls(vNodes)),
  };
}

export function extractChildren(vdom) {
  if (vdom.children == null) {
    return [];
  }
  const children = [];
  for (const child of vdom.children) {
    if (child.type === DOM_TYPES.FRAGMENT) {
      children.push(...extractChildren(child));
    } else {
      children.push(child);
    }
  }
  return children;
}
