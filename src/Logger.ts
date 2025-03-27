import capitalize from "lodash/capitalize";
import moment from "moment";
import "moment-timezone";
import { config, createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, errors } = format;

const tsFormat = () =>
    moment().tz("America/Los_Angeles").format("YYYY-MM-DD hh:mm:ss A").trim();

const customFormat = printf(({ level, message, timestamp, stack }) =>
    stack
        ? `[${timestamp}] ${capitalize(level)}: ${message}\n${(stack as string).toString()}`
        : `[${timestamp}] ${capitalize(level)}: ${message}`,
);

const rotateOpts = {
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
};

const logger = createLogger({
    levels: config.syslog.levels,
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: combine(
        errors({ stack: true }),
        timestamp({
            format: tsFormat,
        }),
        customFormat,
    ),
    rejectionHandlers: [
        new transports.DailyRotateFile({
            filename: "logs/rejections-%DATE%.log",
            ...rotateOpts,
        }),
    ],
    exceptionHandlers: [
        new transports.DailyRotateFile({
            filename: "logs/exceptions-%DATE%.log",
            ...rotateOpts,
        }),
    ],
    transports: [
        new transports.DailyRotateFile({
            filename: "logs/errors-%DATE%.log",
            level: "error",
            ...rotateOpts,
        }),
        new transports.DailyRotateFile({
            filename: "logs/all-%DATE%.log",
            ...rotateOpts,
        }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new transports.Console({ format: format.colorize({ all: true }) }),
    );
}

export default logger;
