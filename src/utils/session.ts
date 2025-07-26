import crypto from "crypto";
import { redis } from "../index";
import type { Session } from "../types";
import { base64UrlEncode, genSnowflake } from "../utils";

if (!process.env.SECRET) {
    throw new Error("SECRET environment variable is not set");
}

export const generateSessionToken = (userId: string) => {
    const timestamp = genSnowflake();
    const base64UrlId = base64UrlEncode(userId);
    const base64Timestamp = base64UrlEncode(timestamp);

    const data = `${base64UrlId}.${base64Timestamp}`;
    const signature = base64UrlEncode(
        crypto
            .createHmac("sha256", process.env.SECRET as string)
            .update(data)
            .digest(),
    );

    return `${data}.${signature}`;
};

export const createSession = async (token: string, userId: string) => {
    const sessionData = JSON.stringify({
        userId,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
    });

    await redis.set(`session:${token}`, sessionData);
    await redis.sadd(`user:${userId}:sessions`, token);
};

export const verifySessionToken = async (token: string) => {
    const [base64UserId, base64Timestamp, signature] = token.split(".");
    if (!base64UserId || !base64Timestamp || !signature) return null;

    const data = `${base64UserId}.${base64Timestamp}`;
    const expectedSignature = base64UrlEncode(
        crypto
            .createHmac("sha256", process.env.SECRET as string)
            .update(data)
            .digest(),
    );
    if (expectedSignature !== signature) return null;

    const raw = await redis.get(`session:${token}`);
    if (!raw) return null;

    const session: Session = JSON.parse(raw);
    session.lastUsedAt = Date.now();

    await redis.set(`session:${token}`, JSON.stringify(session), "KEEPTTL");

    return session;
};

export const revokeSession = async (token: string) => {
    const raw = await redis.get(`session:${token}`);
    if (!raw) return false;

    const { userId } = JSON.parse(raw);

    await redis.del(`session:${token}`);
    await redis.srem(`user:${userId}:sessions`, token);

    return true;
};

export const revokeAllSessions = async (userId: string) => {
    const tokens = await redis.smembers(`user:${userId}:sessions`);
    if (tokens.length === 0) return false;

    for (const token of tokens) {
        await redis.del(`session:${token}`);
    }

    await redis.del(`user:${userId}:sessions`);

    return true;
};

export const listSessions = async (userId: string) => {
    const tokens = await redis.smembers(`user:${userId}:sessions`);
    const sessions: Session[] = [];

    for (const token of tokens) {
        const raw = await redis.get(`session:${token}`);
        if (raw)
            sessions.push({
                ...JSON.parse(raw),
                token,
            });
    }

    return sessions;
};
