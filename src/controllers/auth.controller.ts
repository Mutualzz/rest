import { type NextFunction, type Request, type Response } from "express";
import { HttpException } from "../exceptions/HttpException";
import UserModel from "../models/User";
import { validateLogin, validateRegister } from "../validators/auth.validator";

import { HttpStatusCode } from "@mutualzz/types";
import bcrypt from "bcrypt";
import { encrypt } from "Crypt";
import { genSnowflake } from "Utils";

export default class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure and validate request body
            const { username, email, password, globalName, dateOfBirth } =
                validateRegister.parse(req.body);

            // Check if user already exists
            const userExists = await UserModel.findOne({
                $or: [{ username }, { email }],
            });

            // If user exists, throw an error
            if (userExists) {
                if (userExists.username === username) {
                    throw new HttpException(
                        HttpStatusCode.BadRequest,
                        "Username already exists",
                    );
                }

                if (userExists.email === email) {
                    throw new HttpException(
                        HttpStatusCode.BadRequest,
                        "Email already exists",
                    );
                }
            }

            // Hash password
            const salt = bcrypt.genSaltSync(11);
            const hash = bcrypt.hashSync(password, salt);

            await UserModel.create({
                id: genSnowflake(),
                username,
                email,
                globalName,
                password: hash,
                dateOfBirth,
                createdAt: new Date(),
                createdTimestamp: Date.now(),
                updatedAt: new Date(),
                updatedTimestamp: Date.now(),
            });

            // Respond with success
            res.status(HttpStatusCode.Created).json({
                success: true,
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure and validate request body
            const { username, email, password } = validateLogin.parse(req.body);

            // Find user by username or email
            const user = await UserModel.findOne({
                $or: [{ username }, { email }],
            });

            // If user does not exist, throw an error
            if (!user)
                throw new HttpException(
                    HttpStatusCode.BadRequest,
                    "Invalid credentials",
                    [
                        {
                            path: "password",
                            message: "Invalid username or password",
                        },
                    ],
                );

            // Decrypt password and compare with input password using bcrypt
            const pass = bcrypt.compareSync(password, user.password);

            // If password is invalid, throw an error
            if (!pass)
                throw new HttpException(
                    HttpStatusCode.BadRequest,
                    "Invalid credentials",
                    [
                        {
                            path: "password",
                            message: "Invalid username or password",
                        },
                    ],
                );

            // Respond with success and token and user data
            res.status(HttpStatusCode.Success).json({
                token: encrypt(user.generateToken()),
                ...user.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    }
}
