const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  // Main process
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },

      ],
    },

    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist/main'),
    },
    node: {
      __dirname: false,
    },
    externals: {
      'fsevents': 'require("fsevents")',
      'chokidar': 'require("chokidar")',
      'electron': 'require("electron")',
      'sharp': 'require("sharp")'
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        'fsevents': false
      }
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'assets', to: '../assets' },
          { from: 'src/renderer/installation.html', to: '../renderer/installation.html' }
        ]
      })
    ],
  },
  // Preload script
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },

      ],
    },

    output: {
      filename: 'preload.js',
      path: path.resolve(__dirname, 'dist/main'),
    },
    node: {
      __dirname: false,
    },
    externals: {
      'fsevents': 'require("fsevents")',
      'chokidar': 'require("chokidar")',
      'electron': 'require("electron")',
      'sharp': 'require("sharp")'
    },
  },
  // Renderer process (settings)
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'renderer.js',
      path: path.resolve(__dirname, 'dist/renderer'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
        chunks: ['settings'],
      }),
    ],
  },
  // Renderer process (logs)
  {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/renderer/logs.tsx',
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'logs.js',
      path: path.resolve(__dirname, 'dist/renderer'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/logs.html',
        filename: 'logs.html',
        chunks: ['logs'],
      }),
    ],
  },
];
