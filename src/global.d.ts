declare global {
    namespace Express {
        interface Request {
            // Add user to Request (for now we are using any, but we will create a user interface)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user: any;
        }
    }
}
