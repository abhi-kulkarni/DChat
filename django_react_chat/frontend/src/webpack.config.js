const path = require('path');
var mode = process.env.NODE_ENV || 'development';
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
    entry: [path.resolve("/home/abhishek/Projects/django-react-chat/django_react_chat/frontend/src/index.js")],
    output: {
        // where compiled files go
        path: path.resolve("/home/abhishek/Projects/django-react-chat/django_react_chat/frontend/static/frontend/public/"),

        // 127.0.0.1/static/frontend/public/ where files are served from
        publicPath: "/static/frontend/public/",
        filename: 'main.js',  // the same one we import in index.html
    },
    devtool: (mode === 'development') ? 'inline-source-map' : false,
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
                    options: {presets: ["@babel/env", "@babel/preset-react"]}
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
    devServer: {
        writeToDisk: true,
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};