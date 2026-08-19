import type { Store } from "../types/Store";


// =====================================================
// 住所 → 緯度・経度
// OpenStreetMap Nominatim
// =====================================================

type NominatimResult = {
  lat: string;
  lon: string;
};


export async function geocodeAddress(
  address: string
): Promise<{
  緯度: number;
  経度: number;
} | null> {

  const cleanAddress =
    address
      .trim()
      .replace(/－/g, "-")
      .replace(/ー/g, "-")
      .replace(/−/g, "-");

  if (!cleanAddress) {
    return null;
  }


  try {

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2` +
      `&q=${encodeURIComponent(
        cleanAddress + ", Japan"
      )}` +
      `&countrycodes=jp` +
      `&limit=1`;


    console.log(
      "住所検索:",
      cleanAddress
    );


    const response =
      await fetch(url);


    if (!response.ok) {

      console.error(
        "Nominatimエラー:",
        response.status
      );

      return null;
    }


    const data =
      (await response.json()) as NominatimResult[];


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      console.warn(
        "住所が見つかりません:",
        cleanAddress
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

      console.error(
        "緯度経度が数値ではありません:",
        data[0]
      );

      return null;
    }


    console.log(
      "住所検索成功:",
      cleanAddress,
      "→",
      lat,
      lon
    );


    return {
      緯度: lat,
      経度: lon,
    };


  } catch (error) {

    console.error(
      "ジオコーディングエラー:",
      error
    );

    return null;
  }
}


// =====================================================
// 複数店舗を住所からジオコーディング
// =====================================================

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


    // ---------------------------------------------
    // すでに緯度経度がある場合
    // ---------------------------------------------

    if (
      typeof store.緯度 === "number" &&
      Number.isFinite(store.緯度) &&
      typeof store.経度 === "number" &&
      Number.isFinite(store.経度)
    ) {

      result.push(store);

      continue;
    }


    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
      store.店舗名,
      store.店舗住所
    );


    // ---------------------------------------------
    // 住所から緯度経度取得
    // ---------------------------------------------

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

      // 見つからなくても店舗は残す
      result.push({
        ...store,

        緯度: undefined,

        経度: undefined,
      });

    }


    // ---------------------------------------------
    // Nominatimへのアクセス間隔
    // ---------------------------------------------

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