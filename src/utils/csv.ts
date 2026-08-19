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

            try {

              const stores: Store[] =
                (result.data as any[])
                  .map((store) => {

                    const lat =
                      String(
                        store.緯度 ?? ""
                      ).trim();

                    const lon =
                      String(
                        store.経度 ?? ""
                      ).trim();

                    return {

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

                      // CSVに入っていれば使用
                      // 空欄ならundefined
                      緯度:
                        lat !== ""
                          ? Number(lat)
                          : undefined,

                      経度:
                        lon !== ""
                          ? Number(lon)
                          : undefined,

                    };

                  });


              console.log(
                "CSV解析結果:",
                stores
              );

              resolve(
                stores
              );

            } catch (error) {

              reject(error);

            }

          },

          error: (error) =>
            reject(error),
        }
      );

    }
  );
}