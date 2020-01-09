var webpack = require('webpack');
var path = require('path');

module.exports = {
    devtool: 'eval-source-map',
    entry: {
        bundle: ['babel-polyfill', './src/Main.js']
    },
    output: {
        path: path.resolve(__dirname, './'),
        filename: './assets/[name].js'
    },
    target: 'web',
    devServer: {
        inline: true,
        port: 8080,
        // proxy: {
        //     '/*/*': {
        //         target: 'http://localhost:5000',
        //         secure: false,
        //         changeOrigin: true
        //     }
        // }
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            config: path.join(__dirname, 'config/config.dev')
        }
    },
    module: {
        rules: [
            // {
            //     test: /.(js|jsx)$/,
            //     enforce: 'pre',
            //     exclude: /node_modules/,
            //     use: [
            //             {
            //                 loader: "eslint-loader",
            //             }
            //         ],
            // },
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|__tests__)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.jpg($|\?)/,
                use: [
                    {
                        loader: 'file-loader?name=../assets/img/[name].[ext]'
                    }
                ]
            }
        ]
    }
};
