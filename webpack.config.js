const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
    CheckerPlugin,
    TsConfigPathsPlugin
} = require('awesome-typescript-loader');


module.exports = {
    entry: path.resolve('./app/index.tsx'),

    output: {
        path: path.resolve('./build'),
        publicPath: '/',
        filename: 'bundle.js'
    },

    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx'
        ],
        modules: [
            path.resolve('./app'),
            path.resolve('./src'),
            path.resolve('./node_modules')
        ]
    },

    module: {
        noParse: [
            /react\.min.js/
        ],
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    },

    plugins: [
        new CheckerPlugin(),

        new TsConfigPathsPlugin({
            configFileName: 'tsconfig.dev.json'
        }),

        new HtmlWebpackPlugin({
            template: path.resolve('./app/index.html')
        })
    ],

    devtool: 'source-map',
    mode: 'development'
};
