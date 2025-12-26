import { createBetalApp } from "betal-fe";
import App from './app.js';

// Mount the app to a container div instead of body
createBetalApp(App).mount(document.getElementById('app'))