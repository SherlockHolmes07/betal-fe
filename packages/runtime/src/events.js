export function addEventListener(eventName, handler, el) {
  el.addEventListener(eventName, handler);
  return handler;
}

export function addEventListeners(events = {}, el) {
  const addedEventListeners = {};

  Object.entries(events).forEach(([eventName, handler]) => {
    addedEventListeners[eventName] = addEventListener(eventName, handler, el);
  });
  return addedEventListeners;
}

export function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}