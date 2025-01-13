import { App } from "./App";

const app = new App();

(async () => {
    await app.init();
    app.start();
})();
