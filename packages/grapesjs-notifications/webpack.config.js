const webpack = require('webpack');

module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new webpack.IgnorePlugin({
        resourceRegExp: /^jquery$/,
        contextRegExp: /backbone/
      })
    ]
  };
};