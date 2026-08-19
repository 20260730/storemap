import Papa from "papaparse";
import type { Store } from "../types/Store";

export function parseCsv(file: File): Promise<Store[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (result) => {
        const stores: Store[] = (result.data as any[]).map(
          (store) => ({
            店舗名: String(store.店舗名 ?? ""),
            店舗住所: String(store.店舗住所 ?? ""),
            規定コール数: Number(store.規定コール数) || 0,
            担当者: String(store.担当者 ?? ""),

            緯度:
              store.緯度 !== undefined &&
              store.緯度 !== ""
                ? Number(store.緯度)
                : undefined,

            経度:
              store.経度 !== undefined &&
              store.経度 !== ""
                ? Number(store.経度)
                : undefined,
          })
        );

        resolve(stores);
      },

      error: (error) => {
        reject(error);
      },
    });
  });
}