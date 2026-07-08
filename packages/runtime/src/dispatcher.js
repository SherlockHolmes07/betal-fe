import { EMPTY_FUNCTION } from './constants.js';

/**
 * A pub/sub dispatcher.
 */
export class Dispatcher {
  #subs = new Map();
  #afterHandlers = [];

  /**
   * Registers a handler for a given command name.
   *
   * @param {string} commandName - The command to listen for.
   * @param {(payload: any) => void} handler - Called with the dispatched payload.
   * @returns {() => void} A function that unsubscribes this handler when called.
   */
  subscribe(commandName, handler) {
    // we want to allow multiple handlers for the same command
    if (!this.#subs.has(commandName)) {
      this.#subs.set(commandName, []);
    }

    const handlers = this.#subs.get(commandName);
    if (handlers.includes(handler)) {
      return EMPTY_FUNCTION;
    }
    handlers.push(handler);
    
    return () => this.#unsubscribe(handlers, handler);
  }

  /**
   * Registers a handler to run after every dispatched command. 
   * Useful for cross-cutting notifications (e.g. re-rendering).
   *
   * @param {() => void} handler - Called with no arguments after each dispatch.
   * @returns {() => void} A function that unsubscribes this handler when called.
   */
  afterEveryCommand(handler) {
    this.#afterHandlers.push(handler);

    return () => this.#unsubscribe(this.#afterHandlers, handler);
  }

  /**
   * Runs every handler subscribed to `commandName` with `payload`.
   *
   * @param {string} commandName - The command to dispatch.
   * @param {any} [payload] - Passed through to each matching handler.
   */
  dispatch(commandName, payload) {
    if (this.#subs.has(commandName)) {
      this.#subs.get(commandName).forEach((handler) => handler(payload));
    }
    else {
      console.warn(`No handlers for command: ${commandName}`);
    }

    this.#afterHandlers.forEach((handler) => handler());
  }

  #unsubscribe(handlers, handler) {
    const idx = handlers.indexOf(handler);
    handlers.splice(idx, 1);
  }
}