import Papa from "papaparse";
import type { Store } from "../types/Store";

export function parseCsv(file: File): Promise<Store[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (result) => {
        try {
          const stores: Store[] = (result.data as any[]).map(
            (store) => {
              const latitude =
                store.緯度?.trim() || "";

              const longitude =
                store.経度?.trim() || "";

              return {
                店舗名:
                  store.店舗名?.trim() || "",

                店舗住所:
                  store.店舗住所?.trim() || "",

                規定コール数:
                  Number(store.規定コール数) || 0,

                担当者:
                  store.担当者?.trim() || "",

                緯度:
                  latitude,

                経度:
                  longitude,
              };
            }
          );

          resolve(stores);

        } catch (error) {
          reject(error);
        }
      },

      error: (error) => {
        reject(error);
      },
    });
  });
}