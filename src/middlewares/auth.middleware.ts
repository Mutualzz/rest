import { HttpException } from "@exceptions/HttpException";
import { HttpStatusCode } from "@mutualzz/types";
import type { NextFunction, Request, Response } from "express";

import { verifySessionToken } from "@utils/session";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

const authMiddleware = async (
    req: Request,
    _: Response,
    next: NextFunction,
) => {
    try {
        if (!req.headers.authorization) return next();

        const token = req.headers.authorization.split(" ")[1] ?? null;
        if (!token)
            throw new HttpException(
                HttpStatusCode.Unauthorized,
                "Unauthorized",
            );

        const session = await verifySessionToken(token);
        if (!session)
            throw new HttpException(
                HttpStatusCode.Unauthorized,
                "Unauthorized",
            );

        req.user = {
            id: session.userId,
            token,
        };

        next();
    } catch (err) {
        next(err);
    }
};

export default authMiddleware;
