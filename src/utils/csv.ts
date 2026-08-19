import Papa from "papaparse";
import type { Store } from "../types/Store";

export function parseCsv(
  file: File
): Promise<Store[]> {

  return new Promise(
    (resolve, reject) => {

      Papa.parse(
        file,
        {

          header: true,

          skipEmptyLines: true,

          complete: (result) => {

            const stores: Store[] =
              (result.data as any[])
                .map((store) => ({

                  店舗名:
                    String(
                      store.店舗名 ?? ""
                    ).trim(),

                  店舗住所:
                    String(
                      store.店舗住所 ?? ""
                    ).trim(),

                  規定コール数:
                    Number(
                      store.規定コール数 ?? 0
                    ),

                  担当者:
                    String(
                      store.担当者 ?? ""
                    ).trim(),

                  // 空欄は undefined にする
                  // ※Firebaseにはundefinedを保存しない
                  緯度:
                    store.緯度 !== undefined &&
                    store.緯度 !== null &&
                    String(store.緯度).trim() !== ""
                      ? Number(store.緯度)
                      : undefined,

                  経度:
                    store.経度 !== undefined &&
                    store.経度 !== null &&
                    String(store.経度).trim() !== ""
                      ? Number(store.経度)
                      : undefined,

                }))
                .filter(
                  (store) =>
                    store.店舗名 !== "" ||
                    store.店舗住所 !== ""
                );


            resolve(stores);

          },

          error: (error) => {

            reject(error);

          },

        }
      );

    }
  );

}