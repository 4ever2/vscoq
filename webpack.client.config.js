//@ts-check

'use strict';

const withDefaults = require('./shared.webpack.config');
const path = require('path');

module.exports = withDefaults({
  context: path.join(__dirname, ''),
  entry: {
    extension: './client/src/extension.ts',
  },
  module: {
    rules: [
      {
        test: /\.([cm]?ts|tsx)$/,
        exclude: /node_modules/,
        use: {
            loader: "ts-loader",
            options: {
                "projectReferences": true
            }
        }
      }
    ]
  },
  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname)
    ]
  },
  output: {
    filename: 'extension.js',
    path: path.join(__dirname, 'client/out')
  }
});
