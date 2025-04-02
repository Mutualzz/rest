import bodyParser from "body-parser";
import cors from "cors";
import express, { type Router } from "express";
import fs from "fs/promises";
import helmet from "helmet";
import { createServer } from "http";
import Redis from "ioredis";
import multer from "multer";
import logger from "../../gateway/src/logger";

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

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
});

const app = express();
const http = createServer(app);

await mongoose
    .connect(process.env.DATABASE ?? "")
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => logger.error(err));

const initRoutes = async () => {
    const routeFiles = await fs.readdir(`${import.meta.dirname}/routes`);
    for (const routeFile of routeFiles) {
        const { default: route } = (await import(
            pathToFileURL(`${import.meta.dirname}/routes/${routeFile}`).href
        )) as {
            default: Router;
        };
        app.use(`/v1`, route);
        logger.debug(`Route "${routeFile.split(".")[0]}" loaded`);
    }
};

app.use(
    cors({
        origin: [
            "http://localhost:1420",
            "https://mutualzz.com",
            "https://gateway.mutualzz.com",
        ], // update this to match the domain you will make the request from
        credentials: true,
    }),
);
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(authMiddleware);
await initRoutes();
app.use(errorMiddleware);

redis.on("ready", () => {
    logger.info("Connected to Redis");
});

redis.on("error", (err) => {
    logger.error(`Redis error: ${err}`);
});

http.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

export { app, upload };
