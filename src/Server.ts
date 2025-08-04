import "./instrument";

import { DEFAULT_PORT, MAX_FILE_SIZE_BYTES } from "@constants";
import SentryController from "@controllers/sentry.controller";
import { logger } from "@logger";
import authMiddleware from "@middlewares/auth.middleware";
import errorMiddleware from "@middlewares/error.middleware";
import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Router } from "express";
import fg from "fast-glob";
import helmet from "helmet";
import { createServer } from "http";
import Redis from "ioredis";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import path from "path";
import { pathToFileURL } from "url";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
});

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
});

export default class Server {
    private readonly port: number = Number(process.env.PORT) || DEFAULT_PORT;
    private readonly app = express();
    private readonly http = createServer(this.app);

    constructor() {
        this.initDatabase();
        this.initHeadMiddlewares();
        this.initSentry();
        this.initMiddlewares();
        this.initRoutes();
        this.initErrorHandling();
    }

    private async initDatabase() {
        await mongoose
            .connect(process.env.DATABASE ?? "")
            .then(() => logger.info("Connected to MongoDB"))
            .catch((err) => logger.error(err));
    }

    private initHeadMiddlewares() {
        this.app.use(
            cors({
                origin: [
                    "http://localhost:1420",
                    "http://localhost:5173",
                    "https://mutualzz.com",
                    "https://gateway.mutualzz.com",
                ],
                credentials: true,
            }),
        );

        this.app.use(
            morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"),
        );

        this.app.disable("x-powered-by");
    }

    private initSentry() {
        Sentry.setupExpressErrorHandler(this.app);

        this.app.post(
            `/v1/sentry`,
            bodyParser.raw({
                type: () => true,
                limit: "16mb",
            }),
            (...args) => SentryController.sentry(...args),
        );
    }

    private initMiddlewares() {
        this.app.use(helmet());
        this.app.use(authMiddleware);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    private async initRoutes() {
        const routesBaseDir = path.join(import.meta.dirname, "routes");

        const routeFiles = await fg("**/*.routes.{ts,js}", {
            cwd: routesBaseDir,
        });

        for (const routeFile of routeFiles) {
            const fullPath = path.join(routesBaseDir, routeFile);
            const mod = (await import(pathToFileURL(fullPath).href)) as {
                default?: Router;
                middlewares?: any[];
            };

            const route = mod.default;
            if (!route || !(route instanceof Router)) {
                logger.warn(`Invalid or missing router in file: ${routeFile}`);
                continue;
            }

            const rawPath = routeFile.replace(/\.routes\.(ts|js)$/, "");
            const cleanedPath = rawPath
                .replace(/\/index$/, "") // remove trailing /index
                .split(path.sep)
                .map((segment) => {
                    if (segment.startsWith("[...") && segment.endsWith("]")) {
                        return "*";
                    }
                    if (segment.startsWith("[") && segment.endsWith("]")) {
                        return `:${segment.slice(1, -1)}`;
                    }
                    return segment;
                })
                .join("/");

            const routePath = "/" + cleanedPath;

            const middlewares = mod.middlewares ?? [];

            this.app.use(routePath, ...middlewares, route);
            logger.debug(`Route "${routePath}" loaded from "${routeFile}"`);
        }
    }

    private initErrorHandling() {
        this.app.use(errorMiddleware);
    }

    start() {
        redis.on("ready", () => {
            logger.info("Connected to Redis");
        });

        this.http.listen(this.port, () => {
            logger.info(`Server is running on port ${this.port}`);
        });
    }
}
