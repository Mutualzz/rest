import { z } from "zod";

// Regex for password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
const pswdRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

export const validateSignup = z
    .object({
        username: z
            .string()
            .min(3, "Username is too short")
            .max(255, "Username is too long"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .regex(
                pswdRegex,
                "Password is too weak, must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number"
            ),
        confirmPassword: z.string(),
        globalName: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const validateLogin = z.object({
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string(),
});
