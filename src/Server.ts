import bodyParser from "body-parser";
import cors from "cors";
import express, { type Router } from "express";
import fs from "fs/promises";
import helmet from "helmet";
import { createServer } from "http";
import multer from "multer";
import logger from "./logger";

import authMiddleware from "middlewares/auth.middleware";
import errorMiddleware from "middlewares/error.middleware";
import mongoose from "mongoose";
import { pathToFileURL } from "url";

const port = process.env.PORT ?? 3000;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024, // no larger than 8mb
    },
});

class App {
    readonly app = express();
    readonly http = createServer(this.app);
    readonly routes: Router[] = [];

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

        await this.initRoutes();

        this.app.use(errorMiddleware);
    }

    start() {
        this.http.listen(port, () => {
            logger.info(`Server started on port ${port}`);
        });
    }

    async initRoutes() {
        const routeFiles = await fs.readdir(`${import.meta.dirname}/routes`);
        for (const routeFile of routeFiles) {
            const { default: route } = (await import(
                pathToFileURL(`${import.meta.dirname}/routes/${routeFile}`).href
            )) as {
                default: Router;
            };
            this.routes.push(route);
            this.app.use(`/v1`, route);
            logger.debug(`Route "${routeFile.split(".")[0]}" loaded`);
        }
    }
}

export { App, upload };
