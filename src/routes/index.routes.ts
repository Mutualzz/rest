import bodyParser from "body-parser";
import MainController from "controllers/index.controller";
import express from "express";
const router = express.Router();

router.get(`/ack`, (...args) => MainController.ack(...args));
router.post(`/sentry`, bodyParser.raw({ type: "*/*" }), (...args) =>
    MainController.sentry(...args),
);

export default router;
