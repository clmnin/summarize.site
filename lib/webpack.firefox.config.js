const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: path.resolve(__dirname, './src/content/index.js'),
    background: path.resolve(__dirname, './src/background/index.js'),
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, '..', 'firefox', 'build'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.svg$/,
        type: 'asset/inline',
      },
      {
        test: /\.css$/i,
        use: 'css-loader',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'lib/firefox/public/manifest.json', to: 'manifest.json' },
        { from: 'lib/firefox/public/options.js', to: 'options.js' },
        { from: 'assets/options.html', to: 'options.html' },
        { from: 'assets/styles.css', to: 'styles.css' },
        { from: 'assets/res/logo-16.png', to: 'logo-16.png' },
        { from: 'assets/res/logo-32.png', to: 'logo-32.png' },
        { from: 'assets/res/logo-48.png', to: 'logo-48.png' },
        { from: 'assets/res/logo-128.png', to: 'logo-128.png' },
      ],
    }),
    new CleanWebpackPlugin(),
  ],
};
