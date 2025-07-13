module.exports = {
    apps: [
        {
            name: "mutualzz-rest",
            script: "bun",
            args: ["run", "./src/index.ts"],
            interpreter: "none",
        },
    ],
};
