import logger from "logger";
import { App } from "./Server";

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
});

const app = new App();

await app.init();
app.start();
