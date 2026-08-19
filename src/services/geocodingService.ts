import type { Store } from "../types/Store";


// =====================================================
// Nominatim検索
// =====================================================

async function searchNominatim(
  address: string
): Promise<{
  緯度: number;
  経度: number;
} | null> {

  if (!address.trim()) {
    return null;
  }

  try {

    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2` +
      `&q=${encodeURIComponent(address + ", Japan")}` +
      `&countrycodes=jp` +
      `&limit=1`;


    console.log(
      "Nominatim検索:",
      address
    );


    const response =
      await fetch(url, {
        headers: {
          "Accept-Language": "ja",
        },
      });


    if (!response.ok) {

      console.error(
        "Nominatimエラー:",
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

      return null;
    }


    return {
      緯度: lat,
      経度: lon,
    };


  } catch (error) {

    console.error(
      "Nominatim検索エラー:",
      error
    );

    return null;
  }
}


// =====================================================
// 住所 → 緯度経度
// =====================================================

export async function geocodeAddress(
  address: string
): Promise<{
  緯度: number;
  経度: number;
} | null> {

  const cleanAddress =
    address
      .trim()
      .replace(/[－ー−]/g, "-")
      .replace(/\s+/g, " ");


  if (!cleanAddress) {
    return null;
  }


  // ===================================================
  // ① 完全な住所で検索
  // ===================================================

  let result =
    await searchNominatim(
      cleanAddress
    );


  if (result) {

    console.log(
      "① 完全住所で取得成功:",
      cleanAddress,
      result
    );

    return result;
  }


  // ===================================================
  // ② 番地を削って検索
  //
  // 東京都港区赤坂3-5-2
  // ↓
  // 東京都港区赤坂
  // ===================================================

  const areaAddress =
    cleanAddress.replace(
      /\d+(-\d+)+$/,
      ""
    ).trim();


  if (
    areaAddress &&
    areaAddress !== cleanAddress
  ) {

    console.log(
      "② 番地を削って再検索:",
      areaAddress
    );


    result =
      await searchNominatim(
        areaAddress
      );


    if (result) {

      console.log(
        "② エリア住所で取得成功:",
        areaAddress,
        result
      );

      return result;
    }

  }


  // ===================================================
  // ③ 丁目まで削って検索
  //
  // 東京都港区赤坂3
  // ↓
  // 東京都港区赤坂
  // ===================================================

  const townAddress =
    areaAddress.replace(
      /\d+$/,
      ""
    ).trim();


  if (
    townAddress &&
    townAddress !== areaAddress
  ) {

    console.log(
      "③ 丁目を削って再検索:",
      townAddress
    );


    result =
      await searchNominatim(
        townAddress
      );


    if (result) {

      console.log(
        "③ 町名で取得成功:",
        townAddress,
        result
      );

      return result;
    }

  }


  // ===================================================
  // ④ それでもダメ
  // ===================================================

  console.warn(
    "住所が見つかりません:",
    cleanAddress
  );


  return null;
}


// =====================================================
// 複数店舗
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


    // 既に座標がある場合
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

      result.push(store);

    }


    // Nominatimへのアクセス間隔
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