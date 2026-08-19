// =========================
// 共有URL設定
// =========================
//
// Firebaseに登録されている担当者から
// 自動的に共有URLを作成します。
//
// 例:
// 伊藤 → ?share=ito
// 山田 → ?share=yamada
//
// 担当者が増えても、このファイルを
// 手動で変更する必要はありません。
// =========================


export type ShareConfig = {
  id: string;
  担当者: string;
  許可エリア: string[];
};


// =========================
// 担当者名 → URL用ID
// =========================

export function createShareId(
  person: string
): string {

  const map: Record<string, string> = {

    "佐藤": "sato",

    "田中": "tanaka",

    "伊藤": "ito",

    "山田": "yamada",

  };


  // 登録済みの名前なら英字ID

  if (map[person]) {

    return map[person];

  }


  // 新しい担当者の場合
  // 日本語でもURLに使用可能

  return encodeURIComponent(
    person.trim()
  );

}


// =========================
// URL → 担当者名
// =========================

export function getPersonFromShareId(
  shareId: string
): string | null {

  const map: Record<string, string> = {

    "sato": "佐藤",

    "tanaka": "田中",

    "ito": "伊藤",

    "yamada": "山田",

  };


  // 既存の英字ID

  if (map[shareId]) {

    return map[shareId];

  }


  // 日本語担当者名の場合

  try {

    const decoded =
      decodeURIComponent(
        shareId
      );

    if (decoded.trim()) {

      return decoded.trim();

    }

  } catch {

    return null;

  }


  return null;

}


// =========================
// 共有URLを作成
// =========================

export function createShareUrl(
  person: string
): string {

  const shareId =
    createShareId(person);

  return (
    `${window.location.origin}/?share=${shareId}`
  );

}


// =========================
// 担当者一覧から共有設定を作成
// =========================

export function createShareConfigs(
  persons: string[]
): ShareConfig[] {

  return persons
    .filter(Boolean)
    .map((person) => ({

      id:
        createShareId(person),

      担当者:
        person,

      // 空欄 = その担当者の店舗を
      // 全エリア表示

      許可エリア: [],

    }));

}