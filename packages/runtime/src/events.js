export function addEventListener(eventName, handler, el, hostComponent = null) {
  const boundHandler = hostComponent ? handler.bind(hostComponent) : handler;

  el.addEventListener(eventName, boundHandler);
  return boundHandler;
}

/*
* Adds event listeners to a DOM element based on the provided events object. 
* Each event handler is bound to the host component if provided, 
* and the bound handlers are returned in an object for later removal.
*/
export function addEventListeners(events = {}, el, hostComponent = null) {
  const addedEventListeners = {};

  Object.entries(events).forEach(([eventName, handler]) => {
    addedEventListeners[eventName] = addEventListener(
      eventName,
      handler,
      el,
      hostComponent,
    );
  });
  return addedEventListeners;
}

export function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}
