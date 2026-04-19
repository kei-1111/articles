# articles

記事を GitHub で管理し、ブランチに push すると自動で投稿/更新されるリポジトリ。（現在はQiitaにのみ対応）

## 記事の書き方

1. 記事ごとに新しいブランチを切る（例: `my-article`）
2. ブランチ名と同名のフォルダを作り、中に `article.md` と `images/` を置く
   ```
   my-article/
   ├── article.md
   └── images/
       └── 01_example.png
   ```
3. `article.md` の frontmatter と本文を書く
   ```markdown
   ---
   title: 記事タイトル
   tags:
     - Tag1
     - Tag2
   private: false  # true なら限定共有、false なら公開
   ---
   本文...

   ![[./images/01_example.png]]
   ![[./images/01_example.png|400]]  # 幅 400px
   ```
4. push すると GitHub Actions が Qiita に投稿する

画像は `![[./images/xxx]]` の Obsidian 記法で書ける。`|幅` を付けると `<img width="...">` に変換される。

## 運用メモ

- **初回 push 後は必ず `git pull`** — ワークフローが `qiita_id` を frontmatter に書き戻すため。pull し忘れると次回 push が非 fast-forward で弾かれる
- **1 記事 = 1 ブランチ固定** — ブランチ名とフォルダ名が一致しないとワークフローが失敗する
- **マージ後も feature ブランチは削除しない** — 画像 URL がブランチを参照しているため、削除すると Qiita 上の画像が 404 になる
- **`private` 未指定で更新した場合は Qiita 側の現状を維持** — 既に公開中の記事を誤って限定共有に戻す事故は起きない

## セットアップ（初回のみ）

1. Qiita でアクセストークン発行（`read_qiita` + `write_qiita`）
2. リポジトリの Settings → Secrets and variables → Actions → `QIITA_TOKEN` に登録
3. Settings → Actions → General → Workflow permissions を **Read and write** に変更
