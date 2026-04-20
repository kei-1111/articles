---
name: commit
description: Create a Conventional Commits-style commit with an English message based on staged/unstaged changes. Invoke when the user asks to commit changes in this repo.
---

# commit

このリポジトリの変更内容から、Conventional Commits 形式で英語のコミットメッセージを作成してコミットする。

## 手順

1. 以下を並列で実行し、現在の変更を把握する:
   - `git status`（`-uall` は使わない）
   - `git diff`（staged + unstaged 両方）
   - `git log --oneline -20`（既存のスタイル参照）

2. 変更内容を分析し、以下のルールに従ってメッセージを草案する。

3. ユーザーにメッセージ案を提示し、承認を得る。承認後に `git add <特定ファイル>` → `git commit` を実行する（`git add -A` / `git add .` は使わない）。

4. コミット後に `git status` で成功を確認する。

## コミットメッセージ規約

### Type（必須・lowercase）

- `feat`: 新機能の追加（新しい記事・新機能・新しいワークフロー）
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更（README, コメント）
- `refactor`: 機能を変えないコード変更（ファイルリネーム等）
- `chore`: ビルド・補助ツール・メタデータ（`qiita_id` 書き戻し等）
- `style`: フォーマットのみ

記事本文の執筆・更新は `feat` または `docs` とし、迷う場合はこのリポジトリの用途（記事管理）から判断する。新規記事追加は `feat: add article`、既存記事の加筆は `docs:` を優先。

### フォーマット

```
<type>: <subject>

<body (optional)>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

- **Subject**: 英語、lowercase 始まり、命令形（`add`, `fix`, `update`）、末尾ピリオドなし、72 字以内
- **Body**: 変更が自明でない場合のみ。英語。箇条書き（`- ` プレフィックス）または短い段落。WHY を優先し、WHAT はコードで自明なら書かない
- **Co-Authored-By 行**: 必ず末尾に付与

### スタイル参考（既存コミットから抽出）

- `feat: add Qiita auto-publish workflow`
- `fix: keep article visibility intact on update`
- `chore: point qiita_id to the existing published article`
- `refactor: rename file`
- `docs: add README`

複数の論点がある変更では本文を箇条書きで列挙する（例: `fix: keep article visibility intact on update` の本文）。

## 注意

- 機密情報（`.env`, トークン等）が含まれていないか確認し、疑わしい場合は警告する
- pre-commit フックが失敗した場合、`--amend` は使わず、問題を修正して新規コミットを作成する
- `--no-verify` / `--no-gpg-sign` は使わない
- `main` への直接コミットであっても push は行わない（明示的な指示があるまで）
- HEREDOC でコミットメッセージを渡す:

```bash
git commit -m "$(cat <<'EOF'
feat: add article

- ...

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
