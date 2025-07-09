import { HttpStatusCode } from "@mutualzz/types";
import { type NextFunction, type Request, type Response } from "express";

const { SENTRY_DSN, SENTRY_PROJECT_ID } = process.env;

export default class MainController {
    static ack(_: Request, res: Response, __: NextFunction) {
        res.status(HttpStatusCode.Success).json({
            ack: true,
        });
    }

    static async sentry(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) return res.sendStatus(HttpStatusCode.Success);
            const envelope = new TextDecoder().decode(req.body as Buffer);
            const piece = envelope.split("\n")[0];
            const header = JSON.parse(piece);
            const { dsn } = header;

            if (dsn !== SENTRY_DSN)
                throw new Error(`Invalid Sentry DSN: ${dsn}`);

            const upstreamUrl = `${SENTRY_DSN}/api/${SENTRY_PROJECT_ID}/envelope/`;

            await fetch(upstreamUrl, {
                method: "POST",
                body: req.body,
            });

            res.sendStatus(HttpStatusCode.Success);

            // console.log("Received Sentry envelope:", envelope);
        } catch (err) {
            next(err);
        }
    }
}
