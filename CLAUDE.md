# 画像最適化Electronアプリ開発仕様書

## プロジェクト概要

指定したディレクトリを監視し、画像ファイルが追加されると自動的にpngquantで最適化を行うElectronアプリケーション。macOS、Windows、Linuxに対応したクロスプラットフォームアプリ。

## 技術仕様

### 開発環境
- **言語**: TypeScript
- **フレームワーク**: Electron (v25.9.0)
- **フロントエンド**: React (v18.2.0) + TypeScript
- **バンドラー**: Webpack (v5.89.0)
- **UI**: React Components with inline styles
- **最小対応OS**: 
  - macOS 10.15.0+
  - Windows 10+
  - Linux (主要ディストリビューション)

### アプリケーション構成
- **タイプ**: メニューバー/システムトレイアプリ
- **プロセス構成**: メインプロセス + レンダラープロセス（設定、ログ）
- **通信**: IPC (Inter-Process Communication)

## 機能要件

### 1. メニューバー/システムトレイUI
```
[Karukuアイコン] ▼
├── Karuku (Image Resizer)
├── ──────────
├── Settings...
├── Show Logs...
├── ──────────
├── Watching X directories
├── ──────────
└── Quit
```

### 2. 設定ウィンドウ (Settings)
- **Dependencies**: pngquantインストール状況表示・自動インストール機能
- **General Settings**: 通知ON/OFF設定
- **Watch Directories**: 監視ディレクトリの追加・削除・設定

### 3. ログウィンドウ (Processing Logs)
- **統計表示**: 総ファイル数、成功数、失敗数
- **詳細ログ**: 処理時刻、ファイル名、元サイズ、最適化後サイズ、圧縮率、ステータス
- **操作**: ログリフレッシュ、ログファイルを開く

### 4. 自動pngquantインストール機能
- **Homebrew検出**: Intel Mac/Apple Silicon Mac対応
- **自動インストール**: インストールプロセスの可視化
- **手動インストール手順**: クリップボードコピー機能
- **インストール検証**: 複数パスでの確認

### 5. ファイル監視・最適化機能
- **リアルタイム監視**: chokidarによるファイルシステム監視
- **ファイルパターン**: 正規表現による柔軟なパターンマッチング（デフォルト: `*.png`）
- **重複処理防止**: 処理済みファイルのトラッキング
- **通知システム**: 処理完了・エラー通知

## データ構造

### 設定ファイル（JSON）
保存場所: `~/Library/Application Support/Karuku/config.json` (macOS)

```json
{
  \"watchConfigs\": [
    {
      \"id\": \"uuid\",
      \"path\": \"/Users/username/Desktop\",
      \"pattern\": \"*.png\",
      \"enabled\": true
    }
  ],
  \"notifications\": true,
  \"autoStart\": true
}
```

### TypeScript型定義
```typescript
export type WatchConfig = {
  id: string;
  path: string;
  pattern: string;
  enabled: boolean;
};

export type AppConfig = {
  watchConfigs: WatchConfig[];
  notifications: boolean;
  autoStart: boolean;
};

export type ProcessedFile = {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  timestamp: Date;
  success: boolean;
  error?: string;
};

export interface InstallationResult {
  success: boolean;
  message: string;
  details?: string;
}

export interface InstallationProgress {
  stage: 'checking' | 'updating' | 'installing' | 'verifying' | 'completed' | 'error';
  message: string;
  progress?: number;
}
```

### ログファイル
保存場所: `~/Library/Application Support/Karuku/processed_files.log`

## プロジェクト構造

```
electron/
├── src/
│   ├── main/
│   │   ├── main.ts                 # メインプロセス
│   │   ├── preload.ts              # プリロードスクリプト
│   │   ├── dependencyInstaller.ts  # pngquant自動インストール
│   │   ├── fileWatcher.ts          # ファイル監視
│   │   ├── optimizer.ts            # 画像最適化処理
│   │   ├── appIcon.ts              # アプリアイコン生成
│   │   ├── iconHelper.ts           # アイコンヘルパー
│   │   └── generateIcons.ts        # アイコン生成
│   ├── renderer/
│   │   ├── App.tsx                 # 設定画面メインコンポーネント
│   │   ├── index.tsx               # 設定画面エントリーポイント
│   │   ├── index.html              # 設定画面HTML
│   │   ├── logs.tsx                # ログ画面コンポーネント
│   │   ├── logs.html               # ログ画面HTML
│   │   ├── installation.html       # インストール画面HTML
│   │   └── components/
│   │       ├── AddDirectoryButton.tsx    # ディレクトリ追加ボタン
│   │       ├── DependencyStatus.tsx      # 依存関係ステータス
│   │       └── WatchConfigItem.tsx       # 監視設定アイテム
│   └── types/
│       └── index.ts                # TypeScript型定義
├── assets/
│   ├── icons/                      # アプリケーションアイコン
│   └── app-icon.png               # メインアプリアイコン
├── dist/                          # ビルド結果
├── package.json                   # 依存関係・スクリプト
├── webpack.config.js              # Webpack設定
├── tsconfig.json                  # TypeScript設定
└── README.md
```

## 依存関係管理

### NPM Dependencies
```json
{
  \"dependencies\": {
    \"chokidar\": \"^3.5.3\",     // ファイル監視
    \"react\": \"^18.2.0\",       // UI フレームワーク
    \"react-dom\": \"^18.2.0\",   // React DOM
    \"uuid\": \"^9.0.1\"          // UUID生成
  },
  \"devDependencies\": {
    \"electron\": \"^25.9.0\",    // Electronフレームワーク
    \"typescript\": \"^5.3.3\",   // TypeScript
    \"webpack\": \"^5.89.0\",     // バンドラー
    \"@types/react\": \"^18.2.45\" // React型定義
  }
}
```

### pngquant自動インストール
1. **検出方法**: 
   - `/opt/homebrew/bin/pngquant` (Apple Silicon Mac)
   - `/usr/local/bin/pngquant` (Intel Mac)
   - `pngquant` (PATH内)
2. **インストール方法**:
   - Homebrewの存在確認
   - `brew install pngquant`実行
   - インストール状況のリアルタイム表示
   - 検証プロセス（複数回チェック、リトライ機能）

## ビルド・開発スクリプト

### package.json scripts
```json
{
  \"scripts\": {
    \"dev\": \"concurrently \\\"webpack --mode development --watch\\\" \\\"wait-on dist/main/main.js && npx electron .\\\"\",
    \"start\": \"npm run build:dev; npx electron .\",
    \"build\": \"webpack --mode production\",
    \"build:dev\": \"webpack --mode development\",
    \"start:debug\": \"npm run build:dev && DEBUG=* npx electron .\",
    \"pack\": \"electron-builder\",
    \"dist\": \"rm -rf dist-electron && npm run build && electron-builder\"
  }
}
```

### Webpack設定
- **マルチエントリー**: メイン、プリロード、レンダラー（設定・ログ）
- **TypeScript**: ts-loaderによるコンパイル
- **アセット管理**: CopyWebpackPluginでアセットコピー
- **開発・本番モード**: 環境に応じた最適化

## IPC通信仕様

### メインプロセス → レンダラープロセス
- `installation-progress`: インストール進捗通知
- `installation-complete`: インストール完了通知

### レンダラープロセス → メインプロセス
```typescript
// 設定関連
electronAPI.getConfig(): Promise<AppConfig>
electronAPI.saveConfig(config: AppConfig): Promise<boolean>

// ディレクトリ監視関連
electronAPI.selectDirectory(): Promise<string | null>
electronAPI.addWatchConfig(directoryPath: string): Promise<WatchConfig>
electronAPI.removeWatchConfig(configId: string): Promise<boolean>

// ログ関連
electronAPI.getLogs(limit?: number): Promise<ProcessedFile[]>
electronAPI.openLogFile(): Promise<void>

// 依存関係関連
electronAPI.checkPngquant(): Promise<boolean>
electronAPI.installPngquant(): Promise<InstallationResult>
```

## セキュリティ仕様

### Context Isolation
- **設定・ログウィンドウ**: `contextIsolation: true`, `nodeIntegration: false`
- **インストールウィンドウ**: `contextIsolation: false`, `nodeIntegration: true` (一時的)
- **プリロードスクリプト**: contextBridgeによる安全なAPI公開

### ファイルアクセス
- **監視対象**: ユーザー選択ディレクトリのみ
- **設定ファイル**: アプリケーション専用ディレクトリ
- **権限**: 必要最小限の読み書き権限

## パフォーマンス仕様

### ファイル監視
- **ライブラリ**: chokidar（効率的なファイル監視）
- **イベント処理**: デバウンス処理で重複イベント排除
- **メモリ管理**: 大量ファイル処理時のメモリリーク防止

### UI応答性
- **バックグラウンド処理**: メインプロセスでの非同期処理
- **リアルタイム更新**: IPCによる進捗通知
- **エラーハンドリング**: 例外発生時のグレースフル処理

## エラーハンドリング

### ファイル処理エラー
- **権限エラー**: 適切なエラーメッセージ表示
- **ファイル破損**: スキップして次のファイルを処理
- **ディスク容量不足**: ユーザーへの警告

### 依存関係エラー
- **Homebrew未インストール**: 手動インストール手順提示
- **pngquant失敗**: 詳細なエラー情報表示
- **ネットワークエラー**: リトライ機能

### UI エラー
- **設定読み込み失敗**: デフォルト設定で継続
- **IPC通信エラー**: ユーザーフレンドリーなエラー表示

## テスト要件

### 単体テスト対象
- DependencyInstaller クラス
- FileWatcher クラス
- ImageOptimizer クラス
- React コンポーネント

### 結合テスト対象
- エンドツーエンドの最適化フロー
- IPC通信
- 設定の永続化

### 手動テスト項目
- 各OSでの動作確認
- インストール・アンインストール
- 大量ファイル処理時の安定性

## 配布・パッケージング

### electron-builder設定
```json
{
  \"build\": {
    \"appId\": \"com.kato.karuku\",
    \"productName\": \"Karuku\",
    \"directories\": { \"output\": \"dist-electron\" },
    \"files\": [\"dist/**/*\", \"assets/**/*\", \"node_modules/**/*\"],
    \"mac\": {
      \"category\": \"public.app-category.utilities\",
      \"target\": [{ \"target\": \"default\", \"arch\": [\"universal\"] }],
      \"hardenedRuntime\": false,
      \"gatekeeperAssess\": false
    }
  }
}
```

### リリースプロセス
1. **開発ビルド**: `npm run build:dev`
2. **本番ビルド**: `npm run build`
3. **パッケージング**: `npm run dist`
4. **配布**: DMG (macOS), NSIS (Windows), AppImage (Linux)

## 今後の拡張予定

### 短期
- **複数形式対応**: JPEG, WebP最適化
- **設定エクスポート・インポート**
- **パフォーマンス統計**: 処理速度、圧縮率統計

### 長期
- **クラウド連携**: Google Drive, Dropbox監視
- **バッチ処理**: 既存ファイルの一括最適化
- **プラグインシステム**: カスタム最適化ツール対応
- **多言語対応**: i18n対応

## 開発メモ

### 既知の問題と解決策
1. **macOS権限ダイアログ**: シェル経由での実行で解決
2. **インストール検証タイミング**: 遅延とリトライで解決
3. **UI空白問題**: `minHeight: '100vh'`削除で解決

### 最適化ポイント
- pngquantオプション: `--quality=70 --force --ext .png`
- Homebrewの自動更新無効化: `HOMEBREW_NO_AUTO_UPDATE=1`
- ファイル監視のデバウンス処理

### デバッグ方法
- **詳細ログ**: `npm run start:debug`
- **開発者ツール**: Electronデベロッパーツール
- **IPC通信**: コンソールログでの追跡
