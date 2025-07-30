# Karuku - 画像最適化Electronアプリ

指定したディレクトリを監視し、画像ファイルが追加されると自動的にpngquantで最適化を行うElectronアプリケーション。

## 特徴

- 📁 **ディレクトリ監視**: 指定フォルダの自動監視
- 🖼️ **PNG最適化**: pngquantによる高品質な圧縮
- 🍎 **Apple Silicon対応**: ARM64とIntel両対応
- 📊 **処理ログ**: 詳細な最適化履歴
- ⚡ **自動インストール**: pngquantの自動セットアップ

## インストール

### Homebrew経由（推奨）

```bash
brew tap katoken03/karuku
brew install --cask karuku
```

### 手動インストール

[Releases](https://github.com/katoken03/karuku/releases)から最新版をダウンロード

## 使用方法

1. アプリケーションを起動
2. メニューバーからKarukuアイコンをクリック
3. "Settings..."で監視ディレクトリを設定
4. PNGファイルを監視フォルダに追加すると自動最適化

## 要件

- macOS 11.0 (Big Sur) 以降
- Intel Mac または Apple Silicon Mac

## 開発

```bash
# 依存関係インストール
npm install

# 開発モード起動
npm run dev

# ビルド
npm run dist:arm64    # Apple Silicon用
npm run dist:intel    # Intel用
```

## ライセンス

MIT License

## 作者

katoken03
