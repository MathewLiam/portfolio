const path = require('path');

module.exports = {
    mode: 'production',
    module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: [
                        '@babel/preset-env',
                        ["@babel/preset-react", {"runtime": "automatic"}],
                        '@babel/preset-typescript'
                    ]
                }
            },
            exclude: /node_modules/,
          },
          {
            test: /\.s?(a|c)ss$/,
            use: [
                'style-loader',
                'css-loader'
            ]
          },
          {
            test: /\.svg$/,
            loader: 'file-loader'
          }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css', '.svg'],
    },
}