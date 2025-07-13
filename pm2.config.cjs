module.exports = {
    apps: [
        {
            name: "mutualzz-rest",
            script: "bun",
            args: ["run", "start:rest"],
            interpreter: "none",
            cwd: "/root/mz",
        },
    ],
};
