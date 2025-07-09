module.exports = {
    name: "mutualzz-rest",
    script: "src/index.ts",
    interpreter: "bun",
    env: {
        PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
    },
};
