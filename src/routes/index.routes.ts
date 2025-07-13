import express from "express";
import MainController from "../controllers/index.controller";

const router = express.Router();

router.get(`/ack`, (...args) => MainController.ack(...args));

export default router;
