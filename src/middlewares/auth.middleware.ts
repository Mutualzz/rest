import type { UserWithSensitiveData } from "@mutualzz/types";
import { HttpException } from "exceptions/HttpException";
import type { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";

import logger from "Logger";
import { decrypt } from "structures/Crypt";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

const authMiddleware = (req: Request, _: Response, next: NextFunction) => {
    try {
        if (!req.headers.authorization) return next();
        const token = req.headers.authorization?.split(" ")[1] ?? null;
        if (!token) throw new HttpException(401, "Unauthorized");
        const user = jwt.verify(
            decrypt(token),
            JWT_SECRET
        ) as UserWithSensitiveData;
        req.user = user;

        next();
    } catch (err) {
        logger.error(err);
        next(err);
    }
};

export default authMiddleware;
