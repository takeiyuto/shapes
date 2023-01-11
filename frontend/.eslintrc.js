module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "html"],
    env: {
        "node": true,
    },
    globals: {
        "ethereum": "readonly",
        "vue": "readonly",
        "web3": "readonly",
    },
    ignorePatterns: ["dist"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/vue3-recommended",
    ],
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "comma-dangle": ["error", "only-multiline"],
        "eol-last": "error",
        "@typescript-eslint/ban-ts-comment": "warn",
        "vue/no-v-for-template-key": "off",
    },
};
