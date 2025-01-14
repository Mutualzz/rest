import { HTTP_RESPONSE_CODE } from "Constants";
import { HttpException } from "exceptions/HttpException";
import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import UserModel from "models/User";
import { validateLogin, validateSignup } from "validation/auth.validation";
import { ZodError } from "zod";

import bcrypt from "bcrypt";
import crypto from "crypto";
import Cryptr from "cryptr";
import { decrypt, encrypt } from "structures/Crypt";
import { genSnowflake } from "structures/Util";

export class AuthController {
    path = "/auth";
    router = Router();

    constructor() {
        this.router.post(`${this.path}/signup`, this.signup);
        this.router.post(`${this.path}/login`, this.login);
    }

    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, email, password, globalName, dateOfBirth } =
                validateSignup.parse(req.body);

            const userExists = await UserModel.findOne({
                $or: [{ username }, { email }],
            });

            if (userExists) {
                if (userExists.username === username) {
                    throw new HttpException(
                        HTTP_RESPONSE_CODE.BAD_REQUEST,
                        "Username already exists"
                    );
                }

                if (userExists.email === email) {
                    throw new HttpException(
                        HTTP_RESPONSE_CODE.BAD_REQUEST,
                        "Email already exists"
                    );
                }
            }

            const salt = bcrypt.genSaltSync(11);
            const hash = bcrypt.hashSync(password, salt);

            const privateKey = crypto.randomBytes(256).toString("base64");
            const encrypted = new Cryptr(privateKey).encrypt(hash);
            const newPass = encrypt(encrypted);

            await UserModel.create({
                _id: genSnowflake(),
                username,
                email,
                globalName,
                password: newPass,
                privateKey,
                dateOfBirth,
                createdAt: new Date(),
                createdTimestamp: Date.now(),
                updatedAt: new Date(),
                updatedTimestamp: Date.now(),
            });

            res.status(HTTP_RESPONSE_CODE.CREATED).json({
                success: true,
            });
        } catch (err) {
            let error = err;

            if (err instanceof HttpException)
                error = new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    err.message,
                    err.errors
                );

            if (err instanceof ZodError) {
                const errors = err.errors.map((error) => ({
                    path: error.path[0].toString(),
                    message: error.message,
                }));

                error = new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    "Invalid request data",
                    errors
                );
            }

            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, email, password } = validateLogin.parse(req.body);

            const user = await UserModel.findOne({
                $or: [{ username }, { email }],
            });

            if (!user)
                throw new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    "Invalid credentials",
                    [
                        {
                            path: "password",
                            message: "Invalid username or password",
                        },
                    ]
                );

            const decrypted = decrypt(user.password);
            const pass = bcrypt.compareSync(
                password,
                new Cryptr(user.privateKey).decrypt(decrypted)
            );

            if (!pass)
                throw new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    "Invalid credentials",
                    [
                        {
                            path: "password",
                            message: "Invalid username or password",
                        },
                    ]
                );

            res.status(HTTP_RESPONSE_CODE.SUCCESS).json({
                token: encrypt(user.generateToken()),
                ...user.toJSON(),
            });
        } catch (err) {
            let error = err;

            if (err instanceof HttpException)
                error = new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    err.message,
                    err.errors
                );

            if (err instanceof ZodError) {
                const errors = err.errors.map((error) => ({
                    path: error.path[0].toString(),
                    message: error.message,
                }));

                error = new HttpException(
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    "Invalid request data",
                    errors
                );
            }

            next(error);
        }
    }
}
