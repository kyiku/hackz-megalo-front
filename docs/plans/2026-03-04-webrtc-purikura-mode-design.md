# WebRTC プリクラモード + 音声演出 設計書

> **作成日**: 2026-03-04
> **ステータス**: Approved

---

## 1. 概要

既存の要件定義書（Receipt Purikura）に対して、以下の変更を加える:

1. **スマホ→PCのリアルタイム映像連携**: WebRTC P2Pでスマホのカメラ映像をPC画面に表示
2. **PC側の音声演出**: プリクラモード中にBGM・カウントダウン音声・SEをPC側で再生
3. **PC画面の状態遷移追加**: 待機モード→プリクラモード→処理中→結果表示→完了の5状態

## 2. 変更後の体験フロー

```
[来場者スマホ]                [MacBook PC]              [AWS]
   |                           |                         |
   |  1. QRスキャン             | QRコード表示中            |
   |<─── QR表示 ──────────────|                         |
   |                           |                         |
   |  2. Webアプリ起動          |                         |
   |  3. フィルター選択         |                         |
   |  4. 「プリクラモード開始」  |                         |
   |                           |                         |
   |── WebRTC SDP Offer ──────+──→ API Gateway WS ──→  |
   |<─ WebRTC SDP Answer ─────+──←                      |
   |                           |                         |
   |═══ WebRTC P2P映像ストリーム ═══|                   |
   |                           |                         |
   |                           | 5. プリクラモード画面表示  |
   |                           |    BGM再生開始           |
   |                           |    カメラ映像リアルタイム  |
   |                           |                         |
   |  6. カウントダウン3,2,1    | 「3...2...1...」音声再生  |
   |     → 自動撮影1枚目       |    シャッターSE再生       |
   |  7-9. 2-4枚目（同上）      | 同上                    |
   |                           |                         |
   | 10. 4枚アップロード ───────+─────→ S3              |
   | 11. 処理中表示             | 12. 処理進捗も表示       |
   | 13. カラー版コラージュ表示  |                         |
   |                           | 14. SQS→印刷            |
   |                           | 15. レシート印刷         |
```

### 変更点サマリー

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| スマホ→PC映像 | なし | WebRTC P2Pでリアルタイム表示 |
| 音声演出 | なし | PC側でBGM + カウントダウン + SE |
| PC画面の役割 | QR表示 + ダッシュボード | プリクラ機の外部モニター |
| カウントダウン同期 | スマホ単体 | WebSocket経由でスマホとPCが同期 |

## 3. WebRTCアーキテクチャ

### 3.1 シグナリングフロー

API Gateway WebSocket を シグナリングサーバーとして流用する。

```
[スマホ]                    [API Gateway WS]              [PC]
   |                            |                          |
   |── connect ────────────────→|                          |
   |                            |←──────── connect ────────|
   |                            |                          |
   |── join_room ──────────────→|                          |
   |   {roomId: "session-xxx"}  |──→ join_room ───────────→|
   |                            |                          |
   |── offer (SDP) ────────────→|──→ offer ───────────────→|
   |                            |←────── answer (SDP) ─────|
   |←── answer ────────────────|                          |
   |                            |                          |
   |── ice_candidate ──────────→|──→ ice_candidate ───────→|
   |←── ice_candidate ─────────|←── ice_candidate ────────|
   |                            |                          |
   |═══════════ P2P映像ストリーム確立 ═══════════════════════|
```

### 3.2 WebRTC構成

| 項目 | 設定 |
|------|------|
| 映像方向 | 片方向（スマホ→PCのみ） |
| シグナリング | API Gateway WebSocket（Lambda関数にルーム管理ロジック追加） |
| STUN | `stun:stun.l.google.com:19302`（Google無料STUN） |
| TURN | 不要（会場LAN想定。フォールバックとして Twilio TURN を検討） |
| 映像コーデック | VP8 or H.264（ブラウザデフォルト） |
| 解像度 | 640x480（帯域節約） |

### 3.3 撮影同期プロトコル

WebSocket経由でイベントを送信し、PC側の音声再生をトリガーする。

| イベント | 方向 | ペイロード |
|----------|------|----------|
| `shooting_start` | スマホ→PC | `{ sessionId, totalPhotos: 4 }` |
| `countdown` | スマホ→PC | `{ photoIndex: 1, count: 3 }` |
| `shutter` | スマホ→PC | `{ photoIndex: 1 }` |
| `shooting_complete` | スマホ→PC | `{ sessionId }` |
| `sync_ack` | PC→スマホ | `{ event, receivedAt }` |

### 3.4 フォールバック

WebRTCが確立できない場合:
- WebSocket経由でCanvas→JPEG→Base64フレーム送信に切り替え（~500ms遅延）
- PC側は受信フレームを`<img>`タグに表示

## 4. 音声演出設計

### 4.1 音声タイミング

| タイミング | 種類 | 説明 | 実装 |
|-----------|------|------|------|
| プリクラモード開始 | BGM | ループ再生。楽しいビート | `<audio>` loop |
| カウントダウン | SE | 「3...2...1...」 | Web Audio API |
| シャッター | SE | 「カシャッ」 | Web Audio API |
| 4枚撮影完了 | SE | ファンファーレ | Web Audio API |
| 処理中 | BGM継続 | 待ち時間の体験維持 | BGMそのまま |
| 印刷完了 | SE | 完了ジングル | Web Audio API |

### 4.2 音声素材方針

| 素材 | ソース |
|------|--------|
| BGM | フリー音源（DOVA-SYNDROME, 魔王魂 等） |
| SE | フリーSE素材（効果音ラボ 等） |
| カウントダウン | Web Speech Synthesis API or 録音素材 |

### 4.3 技術実装

- HTML `<audio>` でBGM再生（ループ制御）
- Web Audio API でSE再生（低レイテンシ、音量制御、ミキシング）
- ブラウザのAutoplay Policyへの対応: PC画面で「プリクラモード開始」ボタンをクリックさせてユーザーインタラクションを取得

## 5. PC画面の状態遷移

| 状態 | トリガー | 表示内容 | 音声 |
|------|---------|----------|------|
| **待機モード** | デフォルト / 完了から5秒後 | QRコード + 統計情報 | なし |
| **プリクラモード** | WebRTC接続確立 | カメラ映像 + カウントダウン | BGM + SE |
| **処理中** | 撮影完了・アップロード開始 | 処理進捗ステップ | BGM継続 |
| **結果表示** | 処理完了 | カラーコラージュ | 完了SE |
| **完了** | 印刷完了 | 「レシートを取ってね！」 | 完了ジングル → 5秒後に待機へ |

```
待機モード ──(WebRTC接続)──→ プリクラモード ──(撮影完了)──→ 処理中
    ↑                                                        |
    |                                                        ↓
    ←──(5秒後)── 完了 ←──(印刷完了)── 結果表示 ←──(処理完了)──
```

## 6. 追加API / WebSocketメッセージ

### シグナリング用WebSocketアクション（新規追加）

| アクション | 方向 | ペイロード |
|-----------|------|----------|
| `join_room` | Client → Server | `{ roomId, role: "phone" \| "pc" }` |
| `webrtc_offer` | Client → Server | `{ roomId, sdp }` |
| `webrtc_answer` | Client → Server | `{ roomId, sdp }` |
| `webrtc_ice` | Client → Server | `{ roomId, candidate }` |
| `shooting_sync` | Client → Server | `{ roomId, event, data }` |

### Lambda関数追加

| 関数 | 役割 |
|------|------|
| `webrtc-signaling` | ルーム管理。SDPとICE candidateをスマホ⇔PC間で中継 |

DynamoDB `rooms` テーブル（or 既存sessions テーブルにフィールド追加）:

| 属性 | 型 | 説明 |
|------|-----|------|
| `roomId` | String | sessionIdと同一 |
| `phoneConnectionId` | String | スマホ側のWebSocket接続ID |
| `pcConnectionId` | String | PC側のWebSocket接続ID |

## 7. スケジュールへの影響

追加工数: +2〜3日

| タスク | 工数 | 担当案 |
|--------|------|--------|
| WebRTCシグナリングLambda + DynamoDBルーム管理 | 1日 | B |
| スマホ側WebRTCクライアント実装 | 0.5日 | A |
| PC側WebRTCクライアント + プリクラモード画面 | 1日 | A |
| 音声演出実装（BGM + SE + Web Audio API） | 0.5日 | A |
| 撮影同期プロトコル実装 | 0.5日 | B |

### 既存スケジュールとの調整案

Phase 1（Day 1-4）に WebRTCシグナリング構築を組み込み、Phase 2（Day 5-9）の前半でPC側プリクラモード + 音声を実装する。

## 8. リスクと対策（追加分）

| リスク | 影響度 | 対策 |
|--------|--------|------|
| WebRTC接続が会場ネットワークで確立不可 | 高 | フォールバック: WebSocket経由のフレーム送信 |
| ブラウザAutoplay Policy | 中 | PC側で「開始」ボタンクリックによるユーザーインタラクション取得 |
| iOS SafariのWebRTC対応差 | 中 | Day 2-3で実機検証必須。adapter.jsポリフィル使用 |
| 音声素材の著作権 | 低 | フリー素材サイトのライセンス確認 |
