import initLogger from "@mutualzz/logger";
import path from "path";

export const logger = initLogger(
    path.resolve(__dirname, "..", "logs"),
    process.env.NODE_ENV,
);
