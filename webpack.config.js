const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// デバッグモードの判定
const isProduction = process.env.NODE_ENV === 'production';
const keepConsoleLogs = process.env.KEEP_CONSOLE_LOGS === 'true';
const shouldDropConsole = isProduction && !keepConsoleLogs;

console.log('🔍 Webpack Console Log Optimization Debug:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  KEEP_CONSOLE_LOGS:', process.env.KEEP_CONSOLE_LOGS);
console.log('  isProduction:', isProduction);
console.log('  keepConsoleLogs:', keepConsoleLogs);
console.log('  shouldDropConsole:', shouldDropConsole);

// 最適化設定（強制的にconsole.logを削除）
const getOptimization = () => {
  if (!isProduction) {
    return {};
  }
  
  console.log('🛠️ Configuring TerserPlugin with drop_console:', shouldDropConsole);
  
  return {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: shouldDropConsole,
            drop_debugger: true,
            pure_funcs: shouldDropConsole ? [
              'console.log', 
              'console.warn', 
              'console.info', 
              'console.debug',
              'console.trace'
            ] : [],
            passes: 3, // より徹底的な最適化
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  };
};

module.exports = [
  // Main process
  {
    mode: isProduction ? 'production' : 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    optimization: getOptimization(),
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
    mode: isProduction ? 'production' : 'development',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    optimization: getOptimization(),
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
    resolve: {
      extensions: ['.ts', '.js'],
    },
  },
  // Renderer process (settings)
  {
    mode: isProduction ? 'production' : 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    optimization: getOptimization(),
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
    mode: isProduction ? 'production' : 'development',
    entry: './src/renderer/logs.tsx',
    target: 'electron-renderer',
    optimization: getOptimization(),
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
