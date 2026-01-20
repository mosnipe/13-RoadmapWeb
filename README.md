# リリースノート＆開発ロードマップ Webアプリ

これまで開発してきた機能（リリースノート）と、これから開発する機能（開発ロードマップ）を一覧化し、視覚的に管理・共有できるWebアプリケーションです。

## 機能

- **リリースノート管理**: GitHubからエクスポートしたファイルを読み込んで過去の開発履歴を表示
- **開発ロードマップ管理**: Excel/CSVから読み込んだ将来の開発計画を表示
- **データ統合表示**: 2つのデータソースを統合してタイムライン形式で表示
- **エクスポート機能**: PNG/PDF形式でのダウンロード

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:8080` を開いてください。

### Git設定（初回のみ）

コミットメッセージのテンプレートを設定する場合：

```bash
git config --local commit.template .gitmessage
```

これにより、`git commit` を実行すると日本語のコミットメッセージテンプレートが表示されます。

## 使用方法

### 1. 開発サーバーの起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:8080` が自動的に開きます。

### 2. GitHubデータの読み込み

#### 方法A: GitHub CLIを使用（推奨）

```bash
# プルリクエストをJSONでエクスポート
gh pr list --repo owner/repo --state all --json number,title,state,author,createdAt,mergedAt,url > prs.json

# イシューをJSONでエクスポート
gh issue list --repo owner/repo --state all --json number,title,state,assignees,createdAt,closedAt,url > issues.json
```

#### 方法B: GitHub APIを使用

```bash
# 認証トークンを使用してAPIから取得
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/owner/repo/pulls?state=all > prs.json
```

#### アップロード手順

1. 「Integrations」画面を開く
2. 「GitHub Integration」カードで「ファイル読み込み」タブを選択
3. プルリクエストとイシューのJSONファイルをドラッグ&ドロップまたはクリックでアップロード

### 3. ロードマップデータの読み込み

1. ExcelまたはCSVファイルを準備
   - 必須カラム: タイトル、ステータス、担当者、日付
   - サンプル: `sample-data/sample-roadmap.csv` を参照

2. 「Integrations」画面の「Roadmap Import」カードでファイルをアップロード

3. カラムマッピングを設定
   - 各ターゲット（Title, Status, Assignee, Date）に対応するCSV/Excelのカラムを選択

### 4. データの確認と保存

1. 「Data Preview」セクションで統合されたデータを確認
2. 「Save & Finalize Integration」ボタンをクリックして保存

### 5. ロードマップの表示

1. 「Roadmaps」メニューまたは「Finalize Dashboard」ボタンからロードマップ画面へ
2. タイムライン形式で過去のリリースと将来の予定が表示されます

### 6. エクスポート

ロードマップ画面で：
- **Export PNG**: 画像としてダウンロード
- **Export PDF**: PDF形式でダウンロード

## サンプルデータ

`sample-data/` ディレクトリにサンプルファイルがあります：
- `sample-prs.json`: GitHubプルリクエストのサンプル
- `sample-roadmap.csv`: ロードマップデータのサンプル

## プロジェクト構造

```
.
├── docs/              # ドキュメント
│   └── requirements.md
├── src/               # ソースコード
│   ├── js/           # JavaScriptファイル
│   ├── css/          # CSSファイル（必要に応じて）
│   └── assets/       # 画像などのアセット
├── index.html        # メインページ（Dashboard）
├── integrations.html # 統合設定画面
├── roadmap.html      # ロードマップ表示画面
├── package.json
└── README.md
```

## 技術スタック

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript
- PapaParse (CSV解析)
- SheetJS (Excel解析)
- html2canvas (PNGエクスポート)
- jsPDF (PDFエクスポート)

## ライセンス

MIT
