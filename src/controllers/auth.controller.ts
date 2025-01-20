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
            // Destructure and validate request body
            const { username, email, password, globalName, dateOfBirth } =
                validateSignup.parse(req.body);

            // Check if user already exists
            const userExists = await UserModel.findOne({
                $or: [{ username }, { email }],
            });

            // If user exists, throw an error
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
            res.status(HTTP_RESPONSE_CODE.CREATED).json({
                success: true,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
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
                    HTTP_RESPONSE_CODE.BAD_REQUEST,
                    "Invalid credentials",
                    [
                        {
                            path: "password",
                            message: "Invalid username or password",
                        },
                    ]
                );

            // Decrypt password and compare with input password using bcrypt
            const decrypted = decrypt(user.password);
            const pass = bcrypt.compareSync(
                password,
                new Cryptr(user.privateKey).decrypt(decrypted)
            );

            // If password is invalid, throw an error
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

            // Respond with success and token and user data
            res.status(HTTP_RESPONSE_CODE.SUCCESS).json({
                token: encrypt(user.generateToken()),
                ...user.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    }
}
