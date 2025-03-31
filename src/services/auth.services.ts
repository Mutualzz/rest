import { HttpException } from "exceptions/HttpException";
import type { Request } from "express";
import UserModel from "models/User";
import { HttpStatusCode } from "../constants/httpConstants";

export const checkIfLoggedIn = async (req: Request) => {
    if (!req.user)
        throw new HttpException(HttpStatusCode.Unauthorized, "Unauthorized");

    const user = await UserModel.findById(req.user.id);

    if (!user)
        throw new HttpException(HttpStatusCode.Unauthorized, "Unauthorized");

    return user;
};
