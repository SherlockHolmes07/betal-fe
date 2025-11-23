import { createApp } from "betal-fe";
import { App } from './app.js';
import { initialState } from './state.js';
import { reducers } from './reducers.js';

createApp({ state: initialState, reducers, view: App }).mount(document.body);