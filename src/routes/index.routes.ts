import MainController from "controllers/index.controller";
import express from "express";
const router = express.Router();

router.get(`/ack`, (...args) => MainController.ack(...args));

export default router;
