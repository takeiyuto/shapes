module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
    env: {
        "node": true,
    },
    globals: {
        "web3": "readonly",
    },
    ignorePatterns: ["types"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "comma-dangle": ["error", "only-multiline"],
        "eol-last": "error",
        "@typescript-eslint/ban-ts-comment": "warn",
    },
};
