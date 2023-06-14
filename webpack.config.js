const path = require('path');
const webpack = require("webpack")

module.exports = {
  entry: './src/ts/client/expose.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/client/js'),
    library: 'silex',
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require("./package.json").version),
    }),
  ]
};
