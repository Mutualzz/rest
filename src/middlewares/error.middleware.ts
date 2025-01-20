import { HTTP_RESPONSE_CODE } from "Constants";
import { HttpException } from "exceptions/HttpException";
import type { NextFunction, Request, Response } from "express";
import logger from "Logger";
import { ZodError } from "zod";

const errorMiddleware = (
    error: unknown,
    _: Request,
    res: Response,
    __: NextFunction
) => {
    logger.error(error);

    if (error instanceof HttpException) {
        const status = error.status || 500;
        const message = error.message || "Something went wrong";
        const errors = error.errors || [];

        res.status(status).json({
            status,
            message,
            errors,
        });
    }

    if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
            path: err.path[0].toString(),
            message: err.message,
        }));

        res.status(HTTP_RESPONSE_CODE.BAD_REQUEST).json({
            status: HTTP_RESPONSE_CODE.BAD_REQUEST,
            message: "Invalid request data",
            errors,
        });
    }

    res.status(500).json({
        status: 500,
        message: "Something went wrong",
    });
};

export default errorMiddleware;
