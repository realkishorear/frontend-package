# Webpack Configuration Fix

## Issue
The generated project is missing `webpack.config.js` file, causing webpack to fail with:
```
ERROR in main
Module not found: Error: Can't resolve './src'
```

## Root Cause
The webpack.config.js file wasn't being copied during project generation. This has been fixed in the generator code.

## Solution

### Option 1: Regenerate the Project (Recommended)
Delete the current project and regenerate it:
```bash
rm -rf web-4
npx git@github.com:realkishorear/frontend-package.git init web-4
```

### Option 2: Manually Add webpack.config.js
If you want to keep your current project, manually create the webpack.config.js file:

1. Determine your CSS framework (css, scss, or tailwind)
2. Copy the appropriate webpack.config.js from the generator configs
3. Place it in your project root

### Option 3: Quick Fix
Create a basic webpack.config.js in your project root:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
```

Also make sure your package.json doesn't have `"type": "module"` (it should be removed for webpack projects).

## Verification
After applying the fix, verify:
1. `webpack.config.js` exists in project root
2. `package.json` does NOT have `"type": "module"`
3. `src/main.tsx` exists
4. Run `npm run dev` - it should work now

