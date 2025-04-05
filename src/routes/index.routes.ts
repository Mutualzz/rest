import MainController from "controllers/index.controller";
import express from "express";
const router = express.Router();

const path = "/";

router.get(`${path}ack`, (...args) => MainController.ack(...args));

export default router;
