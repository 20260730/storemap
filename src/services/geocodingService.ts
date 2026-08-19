// =========================
// 住所 → 緯度・経度
// OpenStreetMap Nominatim
// =========================

import type { Store } from "../types/Store";

export type GeocodingResult = {
  lat: number;
  lon: number;
};


// =========================
// 住所から座標を取得
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
      `&q=${encodeURIComponent(address.trim())}` +
      `&countrycodes=jp` +
      `&limit=1`;

    console.log(
      "住所検索:",
      address
    );

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

    console.log(
      "住所検索結果:",
      data
    );

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
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {

      console.warn(
        "緯度経度が不正です:",
        data[0]
      );

      return null;
    }

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
// 複数店舗を住所からジオコーディング
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

    // =========================
    // すでに座標がある場合
    // =========================

    if (
      typeof store.緯度 === "number" &&
      typeof store.経度 === "number" &&
      Number.isFinite(store.緯度) &&
      Number.isFinite(store.経度)
    ) {

      result.push(store);

      continue;
    }


    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗住所
    );


    // =========================
    // 住所から座標取得
    // =========================

    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    if (coordinates) {

      const updatedStore: Store = {
        ...store,
        緯度: coordinates.lat,
        経度: coordinates.lon,
      };

      console.log(
        "座標取得成功:",
        updatedStore.店舗名,
        coordinates
      );

      result.push(
        updatedStore
      );

    } else {

      console.warn(
        "座標取得できませんでした:",
        store.店舗名,
        store.店舗住所
      );

      // 店舗自体は残す
      result.push(store);

    }


    // =========================
    // Nominatimへの連続アクセスを避ける
    // =========================

    if (
      i < stores.length - 1
    ) {

      await new Promise<void>(
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