//@ts-check

'use strict';

const withDefaults = require('./shared.webpack.config');
const path = require('path');

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    goals: path.resolve(__dirname, "./html_views/src/goals/goals.ts"),
    ltacprof: path.resolve(__dirname, "./html_views/src/ltacprof/ltacprof.ts"),
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
    filename: '[name].js',
    path: path.join(__dirname, './html_views/out')
  }
});
