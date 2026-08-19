// =========================
// 日本住所 → 緯度・経度
// HeartRails Geo API
// =========================

export type GeocodingResult = {
  緯度: number;
  経度: number;
};


// =========================
// 住所を正規化
// =========================

function normalizeAddress(address: string): string {

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
// 住所 → 緯度経度
// =========================

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {

  const normalizedAddress =
    normalizeAddress(address);

  if (!normalizedAddress) {
    return null;
  }

  try {

    console.log(
      "住所検索:",
      normalizedAddress
    );


    const url =
      "https://geoapi.heartrails.com/api/json" +
      "?method=suggest" +
      "&matching=like" +
      `&keyword=${encodeURIComponent(normalizedAddress)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      console.error(
        "HeartRails APIエラー:",
        response.status
      );

      return null;

    }


    const data =
      await response.json();


    console.log(
      "HeartRails検索結果:",
      data
    );


    // =========================
    // 結果がない
    // =========================

    if (
      !data ||
      !data.response
    ) {

      console.warn(
        "住所が見つかりません:",
        address
      );

      return null;

    }


    // =========================
    // suggestの結果取得
    // =========================

    const results =
      data.response;


    if (
      !Array.isArray(results) ||
      results.length === 0
    ) {

      console.warn(
        "住所検索結果が0件:",
        address
      );

      return null;

    }


    // =========================
    // 最初の候補
    // =========================

    const result =
      results[0];


    const latitude =
      Number(result.y);

    const longitude =
      Number(result.x);


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      console.warn(
        "緯度経度が取得できません:",
        result
      );

      return null;

    }


    console.log(
      "緯度経度取得成功:",
      latitude,
      longitude
    );


    return {

      緯度:
        latitude,

      経度:
        longitude,

    };


  } catch (error) {

    console.error(
      "HeartRailsジオコーディングエラー:",
      error
    );

    return null;

  }

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

      result.push(store);

      continue;

    }


    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    if (coordinates) {

      result.push({

        ...store,

        緯度:
          coordinates.緯度,

        経度:
          coordinates.経度,

      });

    } else {

      console.warn(
        "緯度経度を取得できませんでした:",
        store.店舗名,
        store.店舗住所
      );

      result.push(store);

    }


    // =========================
    // API連続アクセス対策
    // =========================

    if (
      i <
      stores.length - 1
    ) {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );

    }

  }


  return result;

}