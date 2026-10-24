# CLAUDE.md（gbf-tenjou-keisan）

グラブル（グランブルーファンタジー）のガチャの天井（300連）までの残りを計算する Web ツール「グラブル天井計算」のリポジトリ。
公開ページ: https://syugo1142.github.io/gbf-tenjou-keisan/ （GitHub Pages、main ブランチの直下）
姉妹リポジトリ: gbf-tracker（素材集めの管理ツール。https://syugo1142.github.io/gbf-tracker/ ）

## 必ず守ること
- **Git の操作は本人がやる。** Claude は commit・push・pull・init・remote の変更など、Git の状態を変える操作を実行しない。作業が終わったら、本人が実行するコマンドを示す（`git add -A` → `git commit -m "日本語のメッセージ"` → `git push`）。リポジトリの作成・改名・Pages の設定など GitHub 上の操作も本人がやる
- **説明は基礎から細かく。** 本人はバックエンドやインフラを勉強中。専門用語は初めて出るときに意味を説明し、なぜそうするのかも書く。手順は省略せず、どの画面のどこを押すかまで書く
- **このリポジトリは公開されている。** README・CLAUDE.md・コード・コメント・コミットメッセージに個人的な情報（本名、メールアドレス、学校、就職活動の情報、パソコン内の個人のパスなど）を書かない
- 返答・コードのコメント・コミットメッセージは日本語
- 案内するコマンドのパスは `\`（¥）ではなく `/` で書く

## 方針
- `index.html`・`style.css`・`spark.js` の3ファイルだけで完結する。gbf-tracker とはファイルもデータも共有しない（本人の希望で完全に切り分けた）
- 素の JavaScript、ビルドなし。`index.html` をファイルとして直接開いても動く
- 入力はブラウザの localStorage のキー `gbf-spark-v1` に保存する（`{ crystals, singles, tens, sparks }`）
- 配色は昼（青空）だけ。昼／夜の切り替えは本人の希望でなくした
- ゲームの規約に反する機能（自動操作、通信の読み取り）は入れない。数は手入力だけ
- DOM は `spark.js` の中の `el()` で作る（文字列は textContent で入れる）。`innerHTML` は使わない

## 計算のきまり
- 宝晶石300個＝1連、単発チケット1枚＝1連、10連チケット1枚＝10連、ガチャPt（蒼光の輝き）1＝1連
- 天井は300連。表示は「いま引ける連数」「天井何回分か」「宝晶石＋チケットの宝晶石換算」「次の天井まであと何連・宝晶石何個」

## 動作確認のしかた
ビルドもテストフレームワークもない。変更後はヘッドレスの Chrome で開いてエラーがないか確かめる。
- `chrome --headless=new --allow-file-access-from-files --dump-dom <URL>` で DOM を取り出す。確認用の JS を足した HTML を一時フォルダに作って読み込ませる
- 見た目は `--screenshot` と `--window-size` で画像にして確認する（`--virtual-time-budget=2000` を付ける）
