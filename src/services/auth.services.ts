import { HttpException } from "@exceptions/HttpException";
import UserModel from "@models/User";
import { HttpStatusCode } from "@mutualzz/types";
import type { Request } from "express";

export const checkIfLoggedIn = async (req: Request) => {
    if (!req.user)
        throw new HttpException(HttpStatusCode.Unauthorized, "Unauthorized");

    const user = await UserModel.findById(req.user.id);

    if (!user)
        throw new HttpException(HttpStatusCode.Unauthorized, "Unauthorized");

    return user;
};
