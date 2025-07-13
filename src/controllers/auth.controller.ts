import { type NextFunction, type Request, type Response } from "express";
import { HttpException } from "../exceptions/HttpException";
import UserModel from "../models/User";
import { validateLogin, validateRegister } from "../validators/auth.validator";

import { HttpStatusCode } from "@mutualzz/types";
import bcrypt from "bcrypt";
import { decrypt, encrypt } from "Crypt";
import crypto from "crypto";
import Cryptr from "cryptr";
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

            // Generate private key, encrypt password, and create new user
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
            const decrypted = decrypt(user.password);
            const pass = bcrypt.compareSync(
                password,
                new Cryptr(user.privateKey).decrypt(decrypted),
            );

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
