var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
        bundle: ['babel-polyfill', './src/Main.js']
    },
    output: {
        path: path.resolve(__dirname, './'),
        filename: './assets/[name].js'
    },
    target: 'web',
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
                minimize: true,
                compress: {
                    warnings: false
                }
            }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            config: path.join(__dirname, 'config/config.production')
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|__tests__)/,
                loader: "babel-loader",
                options: {
                            presets: ['es2015', 'react']
                         },
            },
            {
                test: /\.css$/,
                use: [
                        "style-loader",
                        "css-loader",
                     ],
            },
            {
                test: /\.less$/,
                use: [
                        "style-loader",
                        "css-loader",
                        "less-loader",
                     ],
            },
            {
                test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.jpg($|\?)/,
                use: [
                        {
                            loader: "file-loader?name=../assets/img/[name].[ext]"
                        },
                     ],
            }
        ]
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
    }
}
