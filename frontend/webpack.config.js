const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/index.ts",
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            filename: "index.html",
        }),
    ],
    resolve: {
        extensions: [".js", ".ts"],
    },
    mode: "development",
    module: {
        rules: [
            {
                test: /\.ts$/i,
                loader: "ts-loader",
            }
        ],
    },
    externals: {
        "@metamask/onboarding": "MetaMaskOnboarding",
        d3: "d3",
        "ipfs-core": "IpfsCore",
        vue: "Vue",
        web3: "Web3",
    },
};
