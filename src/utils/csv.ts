import Papa from "papaparse";
import type { Store } from "../types/Store";


// =====================================================
// CSV読み込み
// =====================================================

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
                (result.data as Record<string, unknown>[])
                  .map((row) => {

                    const latitude =
                      String(
                        row["緯度"] ?? ""
                      ).trim();

                    const longitude =
                      String(
                        row["経度"] ?? ""
                      ).trim();


                    return {

                      店舗名:
                        String(
                          row["店舗名"] ?? ""
                        ).trim(),

                      店舗住所:
                        String(
                          row["店舗住所"] ?? ""
                        ).trim(),

                      規定コール数:
                        Number(
                          row["規定コール数"] ?? 0
                        ),

                      担当者:
                        String(
                          row["担当者"] ?? ""
                        ).trim(),

                      // CSVが空欄ならundefined
                      緯度:
                        latitude !== ""
                          ? Number(latitude)
                          : undefined,

                      経度:
                        longitude !== ""
                          ? Number(longitude)
                          : undefined,

                    };

                  });


              resolve(stores);


            } catch (error) {

              reject(error);

            }

          },


          error: (error) => {

            reject(error);

          },

        }
      );

    }
  );
}