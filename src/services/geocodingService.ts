// =========================
// 住所 → 緯度・経度
// OpenStreetMap Nominatim
// =========================

export type GeocodingResult = {
  lat: number;
  lon: number;
};


// =========================
// 住所から緯度・経度を取得
// =========================

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {

  if (!address.trim()) {
    return null;
  }

  try {

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2` +
      `&q=${encodeURIComponent(address)}` +
      `&countrycodes=jp` +
      `&limit=1`;

    const response =
      await fetch(url);

    if (!response.ok) {

      console.error(
        "住所検索エラー:",
        response.status
      );

      return null;
    }

    const data =
      await response.json();

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      console.warn(
        "住所が見つかりません:",
        address
      );

      return null;
    }

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
    };

  } catch (error) {

    console.error(
      "ジオコーディングエラー:",
      error
    );

    return null;
  }
}


// =========================
// 複数店舗を順番に処理
// =========================

export async function geocodeStores<
  T extends {
    店舗名: string;
    店舗住所: string;
    規定コール数: number;
    担当者: string;
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

    const store = stores[i];

    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    // =========================
    // すでに座標がある場合
    // =========================

    if (
      store.緯度 !== undefined &&
      store.経度 !== undefined
    ) {

      result.push(store);

      continue;

    }


    // =========================
    // 住所から座標取得
    // =========================

    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    if (coordinates) {

      result.push({

        ...store,

        緯度:
          coordinates.lat,

        経度:
          coordinates.lon,

      });

    } else {

      // 住所が見つからなくても
      // 店舗データ自体は残す

      result.push(store);

    }


    // =========================
    // Nominatimへの連続アクセス防止
    // =========================

    if (
      i < stores.length - 1
    ) {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1100
          )
      );

    }

  }


  return result;

}