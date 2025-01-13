import { threadId } from "worker_threads";
import { Snowflake } from "@theinternetfolks/snowflake";
import type { Request } from "express";
import { HTTP_RESPONSE_CODE } from "Constants";
import { HttpException } from "exceptions/HttpException";
import UserModel from "models/User";

export const genSnowflake = () =>
    Snowflake.generate({ timestamp: 1731283200, shard_id: threadId });

export const checkIfLoggedIn = async (req: Request) => {
    if (!req.user)
        throw new HttpException(
            HTTP_RESPONSE_CODE.UNAUTHORIZED,
            "Unauthorized"
        );

    const user = await UserModel.findById(req.user.id);

    if (!user)
        throw new HttpException(
            HTTP_RESPONSE_CODE.UNAUTHORIZED,
            "Unauthorized"
        );

    return user;
};
