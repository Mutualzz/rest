import express from "express";
import AuthController from "../controllers/auth.controller";

const router = express.Router();

const path = "/auth";

router.post(`${path}/login`, (...args) => AuthController.login(...args));
router.post(`${path}/register`, (...args) => AuthController.register(...args));

export default router;
