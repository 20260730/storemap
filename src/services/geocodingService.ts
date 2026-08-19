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
// CSV店舗を住所からジオコーディング
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

    const store = stores[i];

    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    // =========================
    // すでに緯度・経度がある場合
    // =========================

    if (
      store.緯度 !== undefined &&
      store.経度 !== undefined &&
      !Number.isNaN(Number(store.緯度)) &&
      !Number.isNaN(Number(store.経度))
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

      console.log(
        "座標取得成功:",
        store.店舗名,
        coordinates.lat,
        coordinates.lon
      );

      result.push({
        ...store,
        緯度: coordinates.lat,
        経度: coordinates.lon,
      });

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
    // Nominatimへの連続アクセスを防ぐ
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