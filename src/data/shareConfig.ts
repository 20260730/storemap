// =========================
// 共有URL設定
// =========================

export type ShareConfig = {
  id: string;
  担当者: string;
  許可エリア: string[];
};


// =========================
// 担当者名から共有URL設定を作成
// =========================
//
// 例：
// 伊藤 → ito
// 山田 → yamada
// 佐藤 → sato
// 田中 → tanaka
//
// 同じ担当者なら常に同じURLになります。
// =========================

export function createShareConfig(
  担当者: string
): ShareConfig {

  const id =
    担当者
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  return {
    id,
    担当者: 担当者.trim(),
    許可エリア: [],
  };
}


// =========================
// 固定URL
// =========================
//
// 既存の佐藤・田中のURLを
// そのまま使えるように残します。
// =========================

export const shareConfigs: ShareConfig[] = [

  {
    id: "sato-tokyo",
    担当者: "佐藤",
    許可エリア: [
      "東京都",
    ],
  },

  {
    id: "tanaka-kanagawa",
    担当者: "田中",
    許可エリア: [
      "神奈川県",
    ],
  },

];