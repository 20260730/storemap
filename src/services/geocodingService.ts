// =========================
// 日本住所 → 緯度・経度
// 国土地理院 Geocoding API
// =========================

export type GeocodingResult = {
  緯度: number;
  経度: number;
};


// =========================
// 住所を正規化
// =========================

function normalizeAddress(
  address: string
): string {

  return address
    .trim()
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(
        char.charCodeAt(0) - 0xfee0
      )
    )
    .replace(/[－ー−―]/g, "-")
    .replace(/\s+/g, "");

}


// =========================
// 住所を検索する候補を作る
// =========================

function createAddressCandidates(
  address: string
): string[] {

  const normalized =
    normalizeAddress(address);


  const candidates: string[] = [];


  // 元の住所
  candidates.push(
    normalized
  );


  // 「3-5-2」→「3-5」
  const hyphenMatch =
    normalized.match(
      /^(.*?)(\d+)-(\d+)-(\d+)$/
    );


  if (hyphenMatch) {

    candidates.push(
      `${hyphenMatch[1]}${hyphenMatch[2]}-${hyphenMatch[3]}`
    );

    candidates.push(
      `${hyphenMatch[1]}${hyphenMatch[2]}`
    );

  }


  // 重複削除
  return [
    ...new Set(
      candidates
    ),
  ];

}


// =========================
// 国土地理院API
// =========================

async function searchGsi(
  address: string
): Promise<GeocodingResult | null> {

  try {

    const url =
      "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" +
      encodeURIComponent(address);


    console.log(
      "国土地理院住所検索:",
      address
    );


    const response =
      await fetch(url);


    if (!response.ok) {

      console.error(
        "国土地理院APIエラー:",
        response.status
      );

      return null;

    }


    const data =
      await response.json();


    console.log(
      "国土地理院検索結果:",
      data
    );


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      return null;

    }


    const first =
      data[0];


    // 国土地理院は
    // geometry.coordinates
    // [経度, 緯度]
    // で返す

    const coordinates =
      first?.geometry?.coordinates;


    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {

      return null;

    }


    const longitude =
      Number(
        coordinates[0]
      );

    const latitude =
      Number(
        coordinates[1]
      );


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return null;

    }


    return {

      緯度:
        latitude,

      経度:
        longitude,

    };

  } catch (error) {

    console.error(
      "国土地理院ジオコーディングエラー:",
      error
    );

    return null;

  }

}


// =========================
// 住所 → 緯度経度
// =========================

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {

  const candidates =
    createAddressCandidates(
      address
    );


  for (
    const candidate of candidates
  ) {

    const result =
      await searchGsi(
        candidate
      );


    if (result) {

      console.log(
        "住所検索成功:",
        candidate,
        result
      );

      return result;

    }

  }


  console.warn(
    "住所が見つかりません:",
    address
  );


  return null;

}


// =========================
// 店舗一覧をジオコーディング
// =========================

export async function geocodeStores<
  T extends {
    店舗名: string;
    店舗住所: string;
    緯度?: number;
    経度?: number;
  }
>(
  stores: T[]
): Promise<T[]> {

  const result: T[] = [];


  for (
    let i = 0;
    i < stores.length;
    i++
  ) {

    const store =
      stores[i];


    // =========================
    // すでに座標がある場合
    // =========================

    if (
      typeof store.緯度 === "number" &&
      typeof store.経度 === "number"
    ) {

      result.push(
        store
      );

      continue;

    }


    console.log(
      `住所検索 ${i + 1}/${stores.length}`,
      store.店舗名,
      store.店舗住所
    );


    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    if (coordinates) {

      const updatedStore = {

        ...store,

        緯度:
          coordinates.緯度,

        経度:
          coordinates.経度,

      };


      console.log(
        "緯度経度を取得:",
        updatedStore.店舗名,
        updatedStore.緯度,
        updatedStore.経度
      );


      result.push(
        updatedStore
      );

    } else {

      console.warn(
        "緯度経度を取得できませんでした:",
        store.店舗名,
        store.店舗住所
      );


      result.push(
        store
      );

    }


    // =========================
    // APIアクセス間隔
    // =========================

    if (
      i <
      stores.length - 1
    ) {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            500
          )
      );

    }

  }


  return result;

}