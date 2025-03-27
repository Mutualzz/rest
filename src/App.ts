import bodyParser from "body-parser";
import { AuthController } from "controllers/auth.controller";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer, type Server } from "http";
import multer from "multer";
import logger from "./logger";

import { MainController } from "controllers/index.controller";
import authMiddleware from "middlewares/auth.middleware";
import errorMiddleware from "middlewares/error.middleware";
import mongoose from "mongoose";

const port = process.env.PORT ?? 3000;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024, // no larger than 8mb
    },
});

const controllers = [new MainController(), new AuthController()];
class App {
    readonly app: express.Application;
    readonly http: Server;

    constructor() {
        this.app = express();
        this.http = createServer(this.app);
    }

    async init() {
        await mongoose
            .connect(process.env.DATABASE ?? "")
            .then(() => logger.info("Connected to MongoDB"))
            .catch((err) => logger.error(err));

        this.app.use(
            cors({
                origin: "*", // update this to match the domain you will make the request from
                credentials: true,
            }),
        );
        this.app.use(helmet());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.use(authMiddleware);

        controllers.forEach((controller) => {
            this.app.use("/v1", controller.router);
        });

        this.app.use(errorMiddleware);
    }

    start() {
        this.http.listen(port, () => {
            logger.info(`Server started on port ${port}`);
        });
    }
}

export { App, upload };
