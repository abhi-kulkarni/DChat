const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackRootPlugin = require('html-webpack-root-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleTracker = require('webpack-bundle-tracker')
const LinkTypePlugin = require('html-webpack-link-type-plugin').HtmlWebpackLinkTypePlugin;

var query = {
    disable: true,
    optipng: {
      optimizationLevel: true
    },
    gifsicle: {
      interlaced: true
    }
};

module.exports = {
entry: ['babel-polyfill', './index.js'],
plugins: [
    new CleanWebpackPlugin(),
    new BundleTracker({
        path: __dirname,
        filename: './webpack-stats.json',
    }),
    new HtmlWebpackPlugin({
        template:  path.join(__dirname, '../templates/frontend/index.html'),
    }),
    new LinkTypePlugin({
        '*.css' : 'text/css',
        '*.js'  : 'text/javascript',
        '*.png' : 'image/png',
        '*.jpg' : 'image/jpeg',
        '*.jpeg': 'image/jpeg',
        '*.gif' : 'image/gif',
        '*.webp': 'image/webp',
        '*.bmp' : 'image/bmp',
    }),
    new CopyWebpackPlugin({
        patterns: [
            { from: path.resolve(__dirname, './static/images'), to: path.resolve(__dirname, '../static/images') }
        ]
    })
],
output: {
    path: path.resolve(__dirname, '../static/frontend'),
    filename: '[name].js',
},
module: {
    // configuration regarding modules
    rules: [
        {
            // regex test for js and jsx files
            test: /\.(js|jsx|mjs)?$/,
            // don't look in any node_modules/ or bower_components/ folders
            exclude:  /(node_modules|bower_components)/,
            // for matching files, use the babel-loader
            use: {
                loader: "babel-loader",
                options: {presets: ["@babel/env", "@babel/preset-react", {
                    "plugins": ['@babel/plugin-proposal-class-properties', 'emotion']}
                ]}
            }
        },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.(jpe?g|png|gif|svg)$/i,
            use: ['file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                `image-webpack-loader?${JSON.stringify(query)}`]
        }
    ],
},
};