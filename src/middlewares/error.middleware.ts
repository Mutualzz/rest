import type { HttpException } from "exceptions/HttpException";
import type { NextFunction, Request, Response } from "express";
import logger from "Logger";

const errorMiddleware = (
    error: HttpException,
    _: Request,
    res: Response,
    __: NextFunction
) => {
    logger.error(error);

    const status = error.status || 500;
    const message = status === 500 ? "Something went wrong" : error.message;
    const errors = error.errors || [];

    res.status(status).json({ status, message, errors });
};

export default errorMiddleware;
