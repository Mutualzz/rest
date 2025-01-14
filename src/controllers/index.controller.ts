import { HTTP_RESPONSE_CODE } from "Constants";
import { Router, type Request, type Response } from "express";

export class MainController {
    router = Router();

    constructor() {
        this.router.get("/ack", this.ack);
    }

    ack(_: Request, res: Response) {
        res.status(HTTP_RESPONSE_CODE.SUCCESS).json({
            ack: true,
        });
    }
}
