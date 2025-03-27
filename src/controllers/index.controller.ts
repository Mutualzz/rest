import { HTTP_RESPONSE_CODE } from "constants/httpConstants";
import {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";

export class MainController {
    router = Router();

    constructor() {
        this.router.get("/ack", (...args) => this.ack(...args));
    }

    ack(_: Request, res: Response, __: NextFunction) {
        res.status(HTTP_RESPONSE_CODE.SUCCESS).json({
            ack: true,
        });
    }
}
