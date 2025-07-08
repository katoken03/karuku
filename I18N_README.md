# Karuku - 多言語対応実装完了

## 対応言語
- 🇺🇸 English (en)
- 🇯🇵 日本語 (ja) 
- 🇨🇳 中国語簡体字 (zh-CN)
- 🇪🇸 スペイン語 (es)
- 🇫🇷 フランス語 (fr)
- 🇩🇪 ドイツ語 (de)
- 🇰🇷 韓国語 (ko)
- 🇵🇹 ポルトガル語 (pt)

## 実装内容

### 1. 国際化システム
- `src/i18n/index.ts` - レンダラープロセス用i18nシステム
- `src/main/i18n.ts` - メインプロセス用i18nシステム
- システム言語の自動検出
- パラメータ置換機能 (`{{count}}` など)

### 2. 翻訳リソース
各言語の翻訳ファイルが `src/i18n/locales/` に配置されています：
- `en.ts` - 英語
- `ja.ts` - 日本語
- `zh-CN.ts` - 中国語簡体字
- `es.ts` - スペイン語
- `fr.ts` - フランス語
- `de.ts` - ドイツ語
- `ko.ts` - 韓国語
- `pt.ts` - ポルトガル語

### 3. 多言語対応済みコンポーネント
- `App.tsx` - 設定画面メイン（言語選択機能付き）
- `AddDirectoryButton.tsx` - ディレクトリ追加ボタン
- `DependencyStatus.tsx` - 依存関係ステータス
- `WatchConfigItem.tsx` - 監視設定アイテム
- `logs.tsx` - ログ画面

### 4. メインプロセス多言語対応
- メニューバーの文言
- ダイアログメッセージ
- 通知メッセージ
- ディレクトリ選択ダイアログ

## 使用方法

### 言語の切り替え
設定画面のヘッダーにある言語選択ドロップダウンから言語を変更できます。

### システム言語の自動検出
アプリ起動時に以下の優先順位で言語を決定します：
1. ブラウザー言語（レンダラープロセス）
2. システム環境変数 LANG または LANGUAGE（メインプロセス）
3. フォールバック言語（英語）

### 新しい翻訳の追加
1. `src/i18n/index.ts` で新しい翻訳キーを `TranslationKey` に追加
2. `src/main/i18n.ts` で新しい翻訳キーを `MainTranslationKey` に追加（メインプロセス用）
3. 各言語ファイルに翻訳を追加

## ビルドとテスト

```bash
# 開発環境でテスト
npm run build:dev
npm run start

# 本番ビルド
npm run build
npm run pack
```

## 注意事項

- 削除された不要な言語リソースはありません（指定された8言語のみ実装）
- 翻訳ファイルはTypeScriptで型安全性を確保
- パフォーマンスのため、必要な言語のみロード
- メインプロセスとレンダラープロセスで独立したi18nシステム

## ファイル構造

```
src/
├── i18n/
│   ├── index.ts              # レンダラープロセス用i18n
│   └── locales/
│       ├── en.ts
│       ├── ja.ts
│       ├── zh-CN.ts
│       ├── es.ts
│       ├── fr.ts
│       ├── de.ts
│       ├── ko.ts
│       └── pt.ts
├── main/
│   ├── main.ts               # 多言語対応済み
│   └── i18n.ts               # メインプロセス用i18n
└── renderer/
    ├── App.tsx               # 言語選択機能付き
    ├── logs.tsx              # 多言語対応済み
    └── components/
        ├── AddDirectoryButton.tsx
        ├── DependencyStatus.tsx
        └── WatchConfigItem.tsx
```

多言語対応の実装が完了しました。アプリケーションは指定された8言語に対応し、システム言語を自動検出して適切な言語で表示されます。
