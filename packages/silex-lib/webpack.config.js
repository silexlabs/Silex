const path = require('path');

module.exports = {
  entry: './src/ts/client/expose.ts',
  devtool: 'inline-source-map',
  // devtool: 'source-map',
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
    path: path.resolve(__dirname, 'dist/client'),
    library: 'silex',
  },
};
