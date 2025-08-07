import { BCRYPT_SALT_ROUNDS } from "@constants";
import { HttpException } from "@exceptions/HttpException";
import UserModel from "@models/User";
import { HttpStatusCode } from "@mutualzz/types";
import { validateLogin, validateRegister } from "@mutualzz/validators";
import { genSnowflake } from "@utils";
import { createSession, generateSessionToken } from "@utils/session";
import bcrypt from "bcrypt";
import { type NextFunction, type Request, type Response } from "express";

// TODO: Add default avatars from Furxus (it will work lol)
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
                if (userExists.username === username)
                    throw new HttpException(
                        HttpStatusCode.BadRequest,
                        "Username already exists",
                    );

                if (userExists.email === email)
                    throw new HttpException(
                        HttpStatusCode.BadRequest,
                        "Email already exists",
                    );
            }

            // Hash password
            const salt = bcrypt.genSaltSync(BCRYPT_SALT_ROUNDS);
            const hash = bcrypt.hashSync(password, salt);

            const newUser = await UserModel.create({
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

            const token = generateSessionToken(newUser.id);
            await createSession(token, newUser.id);

            // Respond with success
            res.status(HttpStatusCode.Created).json({
                success: true,
                token,
                ...newUser.toJSON(),
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

            // Compare with input password using bcrypt
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

            const token = generateSessionToken(user.id);
            await createSession(token, user.id);

            // Respond with success and token and user data
            res.status(HttpStatusCode.Success).json({
                token,
                ...user.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    }
}
