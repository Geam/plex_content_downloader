var webpack = require('webpack');

module.exports = {
  entry: "./src/entry.js",
  output: {
    path: "./public",
    filename: "bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" }
    ]
  }
};
