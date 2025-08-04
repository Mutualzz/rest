import emojiRegex from "emojibase-regex";
import { z } from "zod";

// Regex for email validation
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

// Regex for password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
const pswdRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

// Disallowed substrings in usernames
const disallowedUsernameSubstrings = ["@", "#", ":", "```", "mutualzz"];
const notAllowedUsernames = ["everyone", "here"];

// Zero-width and non-rendering character matcher
const invisibleCharsRegex = /[\u200B-\u200D\uFEFF]/;

// Sanitize username by trimming whitespace and replacing multiple spaces with a single space
const sanitizeUsername = (input: string) =>
    input
        .replace(emojiRegex, "") // remove emojis
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width
        .trim()
        .replace(/\s{2,}/g, " ") // collapse spaces
        .toLowerCase();

export const validateRegister = z
    .object({
        username: z
            .string()
            .min(2, "Username must be at least 2 characters long")
            .max(32, "Username must be at most 32 characters long")
            .transform((val) => sanitizeUsername(val.toLowerCase()))
            .refine(
                (val) =>
                    !disallowedUsernameSubstrings.some((sub) =>
                        val.includes(sub),
                    ),
                {
                    message:
                        "Username contains disallowed characters or substrings",
                },
            )
            .refine((val) => !notAllowedUsernames.includes(val), {
                message: "This username is not allowed and cannot be used",
            })
            .refine((val) => !invisibleCharsRegex.test(val), {
                message: "Username contains invisible or invalid characters",
            })
            .refine((val) => !emailRegex.test(val), {
                message: "Username cannot be an email",
            }),

        email: z.email("Invalid email address").toLowerCase(),
        password: z
            .string()
            .regex(
                pswdRegex,
                "Password is too weak, must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number",
            ),

        confirmPassword: z.string(),

        globalName: z
            .string()
            .min(1, "Nickname must be at least 1 character")
            .max(32, "Nickname must be at most 32 characters")
            .transform((val) => val.trim().replace(/\s{2,}/g, " "))
            .optional(),

        dateOfBirth: z.coerce.date().transform((dateString, ctx) => {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid date",
                });
            }

            return date;
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine(
        (data) => {
            const dateOfBirth = new Date(data.dateOfBirth);
            return new Date().getFullYear() - dateOfBirth.getFullYear() >= 13;
        },
        {
            message: "You must be at least 13 years old to register",
            path: ["dateOfBirth"],
        },
    );

export const validateLogin = z.object({
    username: z.string().optional(),

    email: z.string().optional(),

    password: z.string(),
});
