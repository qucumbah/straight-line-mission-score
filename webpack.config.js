const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  target: 'web',
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: './resources/',
        },
      ],
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
  output: {
    filename: 'bundle.js',
  },
};
