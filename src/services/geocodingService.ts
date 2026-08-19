import type { Store } from "../types/Store";

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

  if (!address || !address.trim()) {
    return null;
  }

  try {

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2` +
      `&q=${encodeURIComponent(address)}` +
      `&countrycodes=jp` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

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

    const lat =
      Number(data[0].lat);

    const lon =
      Number(data[0].lon);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {

      console.warn(
        "緯度・経度が取得できませんでした:",
        address
      );

      return null;
    }

    console.log(
      "住所検索成功:",
      address,
      "→",
      lat,
      lon
    );

    return {
      lat,
      lon,
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
// 店舗一覧を住所からジオコーディング
// =========================

export async function geocodeStores(
  stores: Store[]
): Promise<Store[]> {

  const result: Store[] = [];

  for (
    let i = 0;
    i < stores.length;
    i++
  ) {

    const store =
      stores[i];

    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    // =========================
    // すでに座標がある場合
    // =========================

    if (
      typeof store.緯度 === "number" &&
      typeof store.経度 === "number" &&
      !Number.isNaN(store.緯度) &&
      !Number.isNaN(store.経度)
    ) {

      result.push(store);

      continue;
    }


    // =========================
    // 住所から検索
    // =========================

    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    if (coordinates) {

      const geocodedStore: Store = {
        ...store,
        緯度: coordinates.lat,
        経度: coordinates.lon,
      };

      console.log(
        "座標取得成功:",
        geocodedStore
      );

      result.push(
        geocodedStore
      );

    } else {

      console.warn(
        "座標取得失敗:",
        store.店舗名,
        store.店舗住所
      );

      // 座標が取れなくても店舗は残す
      result.push(store);
    }


    // =========================
    // Nominatimへの連続アクセスを防止
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