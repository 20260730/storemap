// =========================
// 住所 → 緯度・経度
// OpenStreetMap Nominatim
// =========================

export type GeocodingResult = {
  lat: string;
  lon: string;
};

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
      lat: String(data[0].lat),
      lon: String(data[0].lon),
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
    店舗住所: string;
    緯度?: string;
    経度?: string;
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

    // すでに座標がある場合は検索しない
    if (
      store.緯度 &&
      store.経度
    ) {

      result.push(store);

      continue;
    }

    console.log(
      `住所検索 ${i + 1}/${stores.length}:`,
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
          coordinates.lat,
        経度:
          coordinates.lon,
      });

    } else {

      // 見つからなくても店舗自体は残す
      result.push(store);

    }

    // Nominatimへの連続アクセスを避ける
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