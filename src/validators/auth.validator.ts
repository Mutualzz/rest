import { z } from "zod";

// Regex for email validation
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

// Regex for password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
const pswdRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

export const validateRegister = z
    .object({
        username: z
            .string()
            .min(3, "Username is too short")
            .max(255, "Username is too long")
            .toLowerCase(),
        email: z.string().email("Invalid email address").toLowerCase(),
        password: z
            .string()
            .regex(
                pswdRegex,
                "Password is too weak, must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number",
            ),
        confirmPassword: z.string(),
        globalName: z.string().optional(),
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
    )
    .refine((data) => !emailRegex.test(data.username), {
        message: "Username cannot be an email",
        path: ["username"],
    });

export const validateLogin = z.object({
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string(),
});
