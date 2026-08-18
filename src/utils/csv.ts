import Papa from "papaparse";
import type { Store } from "../types/Store";

export function parseCsv(file: File): Promise<Store[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (result) => {
        const stores = (result.data as any[]).map((store) => ({
          店舗名: store.店舗名,
          店舗住所: store.店舗住所,
          規定コール数: Number(store.規定コール数),
          担当者: store.担当者,
          緯度: Number(store.緯度),
          経度: Number(store.経度),
        }));

        resolve(stores);
      },

      error: (error) => reject(error),
    });
  });
}