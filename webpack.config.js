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
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'logo.png', to: 'logo.png' },
        { from: 'styles.css', to: 'styles.css' },
      ],
    }),
    new CleanWebpackPlugin(),
  ],
};
