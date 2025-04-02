import { HttpStatusCode } from "constants/httpConstants";
import { HttpException } from "exceptions/HttpException";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../../../gateway/src/logger";

const errorMiddleware = (
    error: unknown,
    _: Request,
    res: Response,
    __: NextFunction,
) => {
    logger.error(error);

    if (error instanceof HttpException) {
        const { status, message, errors } = error;

        res.status(status).json({
            message,
            errors,
        });

        return;
    }

    if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
            path: err.path[0].toString(),
            message: err.message,
        }));

        res.status(HttpStatusCode.BadRequest).json({
            message: "Invalid request data",
            errors,
        });

        return;
    }

    res.status(HttpStatusCode.InternalServerError).json({
        message: "Something went wrong",
    });
};

export default errorMiddleware;
