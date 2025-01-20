import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("No JWT secret provided");

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
        globalName: {
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
                    return this._id;
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
                delete ret._id;
                delete ret.__v;
                delete ret.password;
                delete ret.privateKey;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (_, ret) {
                delete ret._id;
                delete ret.__v;
                delete ret.password;
                delete ret.privateKey;
                return ret;
            },
        },
    }
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
