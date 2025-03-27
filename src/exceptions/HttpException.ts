export class HttpException extends Error {
    readonly status: number;
    readonly message: string;
    readonly errors: { path: string; message: string }[];

    constructor(
        status: number,
        message: string,
        errors?: { path: string; message: string }[],
    ) {
        super(message);
        this.status = status;
        this.message = message;
        this.errors = errors ?? [];
    }
}
