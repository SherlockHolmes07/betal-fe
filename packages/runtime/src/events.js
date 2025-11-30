export function addEventListener(eventName, handler, el, hostComponent = null) {
  function boundHandler() {
    hostComponent
      ? handler.apply(hostComponent, arguments)
      : handler(...arguments);
  }
  el.addEventListener(eventName, boundHandler);
  return boundHandler;
}

export function addEventListeners(events = {}, el, hostComponent = null) {
  const addedEventListeners = {};

  Object.entries(events).forEach(([eventName, handler]) => {
    addedEventListeners[eventName] = addEventListener(
      eventName,
      handler,
      el,
      hostComponent
    );
  });
  return addedEventListeners;
}

export function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}
