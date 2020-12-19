module.exports = {
  entry: './src/main.js',
  target: 'web',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
  output: {
    filename: 'bundle.js',
  },
};
