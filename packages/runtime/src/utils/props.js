export function extractPropsAndEvents(vdom) {
  const { on: events = {}, ...props } = vdom.props;
  // Remove the `key` prop from the props object, as it is used internally for VDOM diffing and should not be applied to the DOM element.
  delete props.key;
  return { props, events };
}
