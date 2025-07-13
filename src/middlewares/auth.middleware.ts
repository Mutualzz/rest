import { HttpStatusCode, type User } from "@mutualzz/types";

import type { NextFunction, Request, Response } from "express";
import { HttpException } from "../exceptions/HttpException";

import jwt from "jsonwebtoken";

import { decrypt } from "Crypt";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

const authMiddleware = (req: Request, _: Response, next: NextFunction) => {
    try {
        if (!req.headers.authorization) return next();
        const token = req.headers.authorization.split(" ")[1] ?? null;
        if (!token)
            throw new HttpException(
                HttpStatusCode.Unauthorized,
                "Unauthorized",
            );

        const user = jwt.verify(decrypt(token), JWT_SECRET) as User;
        req.user = user;

        next();
    } catch (err) {
        next(err);
    }
};

export default authMiddleware;
