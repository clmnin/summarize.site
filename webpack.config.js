const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: ['regenerator-runtime/runtime.js', path.resolve(__dirname, './src/content/index.js')],
    background: ['regenerator-runtime/runtime.js', path.resolve(__dirname, './src/background/index.js')],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
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
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/res/logo-16.png', to: 'logo-16.png' },
        { from: 'public/res/logo-32.png', to: 'logo-32.png' },
        { from: 'public/res/logo-48.png', to: 'logo-48.png' },
        { from: 'public/res/logo-128.png', to: 'logo-128.png' },
        { from: 'public/styles.css', to: 'styles.css' },
        { from: 'public/options.html', to: 'options.html' },
        { from: 'public/options.js', to: 'options.js' },
      ],
    }),
    new CleanWebpackPlugin(),
  ],
};
