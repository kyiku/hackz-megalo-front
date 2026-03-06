# Receipt Purikura - Frontend

サーマルレシートプリンターで白黒プリクラを印刷する **ハッカソン出展作品** のフロントエンド。

スマホで4枚連続撮影 → フィルター適用 → 2x2コラージュ生成 → レシートプリンターから印刷。
デジタルとアナログが融合した体験を、あえてオーバーアーキテクチャなAWS構成（19サービス）で実現する。

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Hosting | AWS Amplify Hosting |
| CI | GitHub Actions |

## Getting Started

```bash
npm install
npm run dev
```

http://localhost:3000 で開発サーバーが起動します。

## Scripts

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint 実行 |
| `npm run lint:fix` | ESLint 自動修正 |
| `npm run format` | Prettier フォーマット |
| `npm run format:check` | フォーマットチェック |
| `npm run type-check` | TypeScript 型チェック |

## CI/CD

- **CI**: GitHub Actions — push時に lint / type-check / build を実行
- **CD**: AWS Amplify Hosting — main マージで自動デプロイ
- **ブランチ保護**: main への直接push禁止、CI通過必須

## Architecture

```
[来場者スマホ]
    │  QRスキャン
    ▼
[Next.js (Amplify)] ── REST/WebSocket ──▶ [API Gateway]
    │                                          │
    │  カメラ撮影 × 4枚                         ▼
    │                                    [Step Functions]
    ▼                                    [Lambda Pipeline]
[S3 Presigned URL Upload]                      │
                                               ▼
                                    [IoT Core / SQS]
                                         │
                                         ▼
                                  [MacBook → レシート印刷]
```

## Project Structure

```
src/
└── app/          # App Router pages & layouts
docs/             # 要件定義書・設計書
.github/
└── workflows/
    └── ci.yml    # GitHub Actions CI
amplify.yml       # Amplify Hosting ビルド設定
```

## Related Repositories

- [hackz-Megalo](https://github.com/kyiku/hackz-Megalo) — プロジェクト全体のドキュメント・バックエンド
