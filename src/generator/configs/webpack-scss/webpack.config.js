const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/main.tsx',
  mode: isProduction ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false,
            configFile: 'tsconfig.json',
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|sass)$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: !isProduction,
              sassOptions: {
                outputStyle: isProduction ? 'compressed' : 'expanded',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: !isProduction,
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      minify: isProduction,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          noErrorOnMissing: true,
        },
      ],
    }),
    // Inject environment variables
    new webpack.DefinePlugin({
      'process.env.REACT_APP_OIDC_AUTHORITY': JSON.stringify(process.env.REACT_APP_OIDC_AUTHORITY || ''),
      'process.env.REACT_APP_OIDC_CLIENT_ID': JSON.stringify(process.env.REACT_APP_OIDC_CLIENT_ID || ''),
      'process.env.REACT_APP_OIDC_REDIRECT_URI': JSON.stringify(process.env.REACT_APP_OIDC_REDIRECT_URI || ''),
      'process.env.REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI': JSON.stringify(process.env.REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI || ''),
      'process.env.REACT_APP_OIDC_SILENT_REDIRECT_URI': JSON.stringify(process.env.REACT_APP_OIDC_SILENT_REDIRECT_URI || ''),
    }),
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash].css',
            chunkFilename: 'css/[name].[contenthash].chunk.css',
          }),
        ]
      : []),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
    ],
    historyApiFallback: true,
    port: 3000,
    hot: true,
    open: true,
    compress: true,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  optimization: {
    minimize: isProduction,
    splitChunks: isProduction
      ? {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
          },
        }
      : false,
  },
};

