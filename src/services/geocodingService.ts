// =========================
// 日本住所 → 緯度・経度
// Geolonia Community Geocoder
// =========================

import type { Store } from "../types/Store";


// =========================
// 型
// =========================

type GeocodingResult = {
  lat: number;
  lon: number;
};


// =========================
// 住所 → 緯度・経度
// =========================

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {

  if (!address || !address.trim()) {
    return null;
  }

  try {

    console.log(
      "日本住所検索:",
      address
    );


    // Geolonia Community Geocoder
    const url =
      "https://community-geocoder.geolonia.com/" +
      `?address=${encodeURIComponent(address)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      console.error(
        "Geolonia住所検索エラー:",
        response.status
      );

      return null;
    }


    const data =
      await response.json();


    console.log(
      "Geolonia検索結果:",
      data
    );


    // =========================
    // 緯度経度確認
    // =========================

    if (
      typeof data?.lat === "number" &&
      typeof data?.lng === "number"
    ) {

      return {
        lat: data.lat,
        lon: data.lng,
      };

    }


    // =========================
    // 文字列で返ってきた場合
    // =========================

    if (
      data?.lat &&
      data?.lng
    ) {

      const lat =
        Number(data.lat);

      const lon =
        Number(data.lng);


      if (
        !Number.isNaN(lat) &&
        !Number.isNaN(lon)
      ) {

        return {
          lat,
          lon,
        };

      }

    }


    console.warn(
      "緯度経度を取得できませんでした:",
      address,
      data
    );


    return null;


  } catch (error) {

    console.error(
      "Geoloniaジオコーディングエラー:",
      error
    );

    return null;

  }

}


// =========================
// 複数店舗を順番に処理
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
    // すでに緯度経度がある場合
    // =========================

    if (
      typeof store.緯度 === "number" &&
      typeof store.経度 === "number"
    ) {

      console.log(
        "既存の座標を使用:",
        store.店舗名
      );

      result.push(store);

      continue;

    }


    // =========================
    // 住所から座標取得
    // =========================

    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    const coordinates =
      await geocodeAddress(
        store.店舗住所
      );


    // =========================
    // 成功
    // =========================

    if (coordinates) {

      const updatedStore: Store = {

        ...store,

        緯度:
          coordinates.lat,

        経度:
          coordinates.lon,

      };


      console.log(
        "緯度経度取得成功:",
        store.店舗名,
        coordinates
      );


      result.push(
        updatedStore
      );

    }

    // =========================
    // 失敗
    // =========================

    else {

      console.warn(
        "緯度経度を取得できませんでした:",
        store.店舗名,
        store.店舗住所
      );


      // 店舗自体は残す
      result.push(store);

    }


    // =========================
    // API連続アクセス対策
    // =========================

    if (
      i < stores.length - 1
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