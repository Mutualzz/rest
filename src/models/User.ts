import jwt from "jsonwebtoken";
import { Schema, model } from "mongoose";
import { logger } from "../logger";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
    logger.error("JWT_SECRET is not defined in the environment");
    process.exit(1);
}

const userSchema = new Schema(
    {
        _id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        displayName: {
            type: String,
            required: false,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        privateKey: {
            type: String,
            required: true,
        },
        createdTimestamp: {
            type: Number,
            requited: true,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        updatedTimestamp: {
            type: Number,
            required: true,
        },
        updatedAt: {
            type: Date,
            required: true,
        },
    },
    {
        // Methods
        methods: {
            generateToken: function () {
                return jwt.sign(this.toJSON(), JWT_SECRET);
            },
        },
        // Virtuals
        virtuals: {
            id: {
                get: function () {
                    return this._id as string;
                },
                set: function (id) {
                    this._id = id;
                },
            },
        },
        // Making sure we remove sensitive data from the response
        toJSON: {
            virtuals: true,
            transform: function (_, ret) {
                // This fix is a little hacky, but it works
                delete (ret as Partial<typeof ret>)._id;
                delete (ret as Partial<typeof ret>).__v;
                delete (ret as Partial<typeof ret>).password;
                delete (ret as Partial<typeof ret>).privateKey;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (_, ret) {
                delete (ret as Partial<typeof ret>)._id;
                delete (ret as Partial<typeof ret>).__v;
                return ret;
            },
        },
    },
);

userSchema.pre("save", function (next) {
    this.set({
        updatedAt: new Date(),
        updatedTimestamp: Date.now(),
    });

    next();
});

const UserModel = model("users", userSchema);

export default UserModel;
