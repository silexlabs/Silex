// const path = require('path');

// module.exports = {
//     entry: './dist/client/client/App.js',
//     devtool: 'inline-source-map',
//     // devtool: 'source-map',
//     output: {
//         filename: 'index.js',
//         path: path.resolve(__dirname, '/dist/client'),
//     }
// };


const path = require('path');

module.exports = {
  entry: './src/client/App.ts',
  devtool: 'inline-source-map',
  // devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/client')
  }
};
