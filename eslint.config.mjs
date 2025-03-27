import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylistic,
    sonarjs.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettier,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                project: "./tsconfig.json",
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            "no-console": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    args: "all",
                    vars: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                    fixStyle: "inline-type-imports",
                },
            ],
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "@typescript-eslint/no-unnecessary-condition": "warn",
            "@typescript-eslint/no-unnecessary-qualifier": "warn",
            "@typescript-eslint/no-unnecessary-type-arguments": "warn",
            "@typescript-eslint/no-unnecessary-type-constraint": "warn",
            "@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/prefer-for-of": "warn",
            "sonarjs/cognitive-complexity": "off",
            "sonarjs/no-nested-conditional": "off",
            "sonarjs/no-small-switch": "warn",
            "sonarjs/no-nested-template-literals": "off",
            "sonarjs/no-unused-vars": "warn",
            "sonarjs/no-dead-store": "warn",
            "sonarjs/unused-import": "warn",
            "sonarjs/todo-tag": "warn",
            "sonarjs/no-commented-code": "warn",
            "import/no-cycle": "error",
        },
    },
);
