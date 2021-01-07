const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackRootPlugin = require('html-webpack-root-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleTracker = require('webpack-bundle-tracker')
const LinkTypePlugin = require('html-webpack-link-type-plugin').HtmlWebpackLinkTypePlugin;
const webpack = require('webpack')
const dotenv = require('dotenv');

var query = {
    disable: true,
    optipng: {
      optimizationLevel: true
    },
    gifsicle: {
      interlaced: true
    }
};


module.exports  = (args) => ({

entry: ['babel-polyfill', './index.js'],
plugins: [
    new CleanWebpackPlugin(),
    new BundleTracker({
        path: __dirname,
        filename: './webpack-stats.json',
    }),
    new webpack.DefinePlugin({
        'process.env': JSON.stringify(dotenv.config({'path': args.development?'./.env.development':'./.env.development'}).parsed),
        'args': JSON.stringify(args)
    }),
    new HtmlWebpackPlugin({
        template:  path.join(__dirname, '../templates/frontend/index.html'),
        minify: {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            useShortDoctype: true
        }
    }),
    new LinkTypePlugin({'*.css':'text/css', '*.js':'text/javascript'}),
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
}
});