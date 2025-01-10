import express from "express";
import logger from "./Logger";
import helmet from "helmet";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import { createServer, Server } from "http";

const port = process.env.PORT || 3000;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024, // no larger than 8mb
    },
});

const controllers = [];

class App {
    readonly app: express.Application;
    readonly http: Server;

    constructor() {
        this.app = express();
        this.http = createServer(this.app);
    }

    initMiddlewares() {
        this.app.use(
            cors({
                origin: "*", // update this to match the domain you will make the request from
                credentials: true,
            })
        );
        this.app.use(helmet());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    initControllers() {
        controllers.forEach((controller) => {
            this.app.use("/v1", controller.router);
        });
    }

    start() {
        this.http.listen(port, () => {
            logger.info(`Server started on port ${port}`);
        });
    }
}

export { App, upload };
