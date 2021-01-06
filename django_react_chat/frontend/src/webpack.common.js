const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackRootPlugin = require('html-webpack-root-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleTracker = require('webpack-bundle-tracker')

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
entry: {
    app: ['babel-polyfill', path.resolve(__dirname, 'index.js')]
},
context: path.join(__dirname, 'dist'),
plugins: [
    // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
    new CleanWebpackPlugin(),
    new BundleTracker({
        path: __dirname,
        filename: './webpack-stats.json',
    }),
    new HtmlWebpackPlugin({
    title: 'Production',
    template:  path.join(__dirname, 'static/templates/template.html'),
    }),
    new CopyWebpackPlugin({
        patterns: [
            { from: path.resolve(__dirname, 'static') }
        ]
    })
],
output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: 'app.js',
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