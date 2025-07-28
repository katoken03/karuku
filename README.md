## DevTools（開発者ツール）制御について

### 本番ビルド（`npm run dist:arm64`）
- ✅ **Command+Option+I** キーボードショートカットが無効化
- ✅ **F12** キーが無効化
- ✅ **Command+Option+J**（コンソール）が無効化
- ✅ **Command+Option+C**（要素検査）が無効化
- ✅ **右クリックコンテキストメニュー**が無効化
- ✅ **openDevTools() メソッド**が無効化
- ✅ **console.log** が自動削除されファイルサイズが縮小

### デバッグビルド（`npm run dist:arm64:withDebug`）
- ✅ **すべてのDevToolsショートカット**が利用可能
- ✅ **右クリックコンテキストメニュー**が利用可能
- ✅ **console.log** が保持されデバッグが可能
- ✅ **開発者ツールが自動で開く**

### 動作テスト方法

1. **本番ビルドテスト**:
   ```bash
   npm run test:devtools:disabled
   ```
   - Command+Option+Iを押してもDevToolsが開かないことを確認

2. **デバッグビルドテスト**:
   ```bash
   npm run test:devtools:enabled
   ```
   - Command+Option+IでDevToolsが開くことを確認

# Karuku - Image Optimizer

PNG画像を自動最適化するElectronアプリです。

## 機能

- **メニューバーアプリ**: macOSのメニューバー（システムトレイ）に常駐
- **自動監視**: 指定したディレクトリを監視し、新しいPNGファイルを自動検出
- **pngquant最適化**: 高品質な画像圧縮を実行
- **リアルタイム通知**: 処理完了をmacOS通知で表示
- **設定管理**: 複数ディレクトリの監視とパターンカスタマイズ
- **ログ機能**: 処理履歴の確認とファイルサイズ節約量の表示
- **多言語対応**: 8言語対応（英語、日本語、中国語、スペイン語、フランス語、ドイツ語、韓国語、ポルトガル語）
- **Console.log削除による最適化**: 本番ビルドでconsole.logが自動削除されてビルドサイズが縮小されます
- **DevTools（開発者ツール）制御**: 本番ビルドではCommand+Option+Iなどの開発者ツールを無効化

## 必要な環境

- macOS 12.0以上
- pngquant（画像最適化ツール）

## セットアップ

### 1. 依存関係のインストール

```bash
# pngquantをインストール
brew install pngquant

# Node.js依存関係をインストール
npm install
```

### 2. アプリのビルドと起動

```bash
# 開発モード（ホットリロード付き）
npm run dev

# 本番ビルド後に起動
npm run build
npm start

# 配布用パッケージの作成

## 本番リリース（DevTools無効、console.log削除）

```bash
# ARM64版（Apple Silicon Mac専用・サイズ小）
npm run dist:arm64

# Intel版（Intel Mac専用・サイズ小）
npm run dist:intel

# Universal版（両方対応・サイズ大）
npm run dist:universal
```

## デバッグリリース（DevTools有効、console.log保持）

```bash
# ARM64版（デバッグ付き）
npm run dist:arm64:withDebug
```

## テスト用コマンド

```bash
# DevTools制御のテスト
node test-devtools-control.js

# 本番ビルド（DevTools無効）のテスト
npm run test:devtools:disabled

# デバッグビルド（DevTools有効）のテスト
npm run test:devtools:enabled
```

# 全アーキテクチャ版を同時作成
npm run dist:all

# デフォルト（Universal版）
npm run dist

# デバッグログ付き本番ビルド（トラブルシューティング用）
npm run dist:arm64:withDebug
```

### ビルド最適化について

**Console.log削除による最適化**
- 本番ビルドではconsole.logが自動削除されてビルドサイズが縮小されます
- デバッグが必要な場合は`dist:arm64:withDebug`を使用してconsole.logを保持できます

```bash
# テスト用ビルドコマンド
npm run build:production:no-logs      # console.log削除
npm run build:production:with-logs    # console.log保持

# ビルドサイズテスト
node test-console-optimization.js
```

### アーキテクチャ別ビルドについて

**ARM64版 (`dist:arm64`)**
- Apple Silicon Mac（M1/M2/M3）専用
- **最小ファイルサイズ**
- 推奨：Apple Silicon Macユーザー

**Intel版 (`dist:intel`)**
- Intel Mac専用
- 小さなファイルサイズ
- 推奨：Intel Macユーザー

**Universal版 (`dist:universal`)**
- Intel + Apple Silicon 両方対応
- ファイルサイズが大きい
- 推奨：配布時やアーキテクチャ不明の場合

## 使用方法

### 基本的な使用方法

1. アプリを起動すると、メニューバーに📷アイコンが表示されます
2. アイコンをクリックして「Settings...」を選択
3. 「Add Directory」で監視したいフォルダを追加
4. PNGファイルをそのフォルダに追加すると自動的に最適化されます

### 言語の切り替え

- 設定画面のヘッダーにある言語選択ドロップダウンから変更可能
- システム言語を自動検出して初期言語を設定
- 対応言語: 🇺🇸英語 🇯🇵日本語 🇨🇳中国語 🇪🇸スペイン語 🇫🇷フランス語 🇩🇪ドイツ語 🇰🇷韓国語 🇵🇹ポルトガル語

### 設定

- **通知**: 処理完了時の通知の有効/無効
- **ファイルパターン**: デフォルトは`*.png`（全てのPNGファイル）
- **カスタムパターン**: 正規表現も使用可能（例：`^ss.*\.png$`）

### ログの確認

- メニューから「Show Logs...」を選択
- 処理したファイルの一覧と圧縮率を確認
- 「Open Log File」で生ログファイルを直接表示

## 設定ファイル

設定は以下の場所に保存されます：
- 設定ファイル: `~/Library/Application Support/Karuku/config.json`
- ログファイル: `~/Library/Application Support/Karuku/processed_files.log`

## トラブルシューティング

### pngquantが見つからない場合

```bash
# pngquantのインストール確認
which pngquant

# インストールされていない場合
brew install pngquant
```

### アプリが見つからない場合

- メニューバーアプリなので、Dockには表示されません
- 画面右上のメニューバーを確認してください

### 権限エラー

macOSの「システム設定」→「プライバシーとセキュリティ」で以下を許可：
- 通知の表示
- ファイルとフォルダへのアクセス

## 技術仕様

- **フレームワーク**: Electron + TypeScript + React
- **ファイル監視**: chokidar
- **画像最適化**: pngquant（外部プロセス）
- **最小メモリ使用量**: バックグラウンド動作に最適化

## 開発

### プロジェクト構造

```
electron/
├── src/
│   ├── main/          # メインプロセス（Node.js）
│   ├── renderer/      # レンダラープロセス（React）
│   └── types/         # TypeScript型定義
├── dist/              # ビルド出力
└── package.json
```

### 開発モード

```bash
npm run dev
```

これにより、ファイル変更時に自動的にリビルドされます。

## ライセンス

MIT License

## 作者

kato
