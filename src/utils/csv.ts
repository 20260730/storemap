import Papa from "papaparse";
import type { Store } from "../types/Store";

export function parseCsv(
  file: File
): Promise<Store[]> {

  return new Promise((resolve, reject) => {

    Papa.parse(file, {

      header: true,

      skipEmptyLines: true,

      encoding: "UTF-8",

      complete: (result) => {

        console.log(
          "CSV生データ:",
          result.data
        );

        const stores: Store[] =
          (result.data as Record<string, unknown>[])
            .map((row) => {

              const 店舗名 =
                String(
                  row["店舗名"] ?? ""
                ).trim();

              const 店舗住所 =
                String(
                  row["店舗住所"] ?? ""
                ).trim();

              const 規定コール数 =
                Number(
                  row["規定コール数"] ?? 0
                );

              const 担当者 =
                String(
                  row["担当者"] ?? ""
                ).trim();

              const 緯度Value =
                row["緯度"];

              const 経度Value =
                row["経度"];

              const 緯度 =
                緯度Value !== undefined &&
                緯度Value !== null &&
                String(緯度Value).trim() !== ""
                  ? Number(緯度Value)
                  : undefined;

              const 経度 =
                経度Value !== undefined &&
                経度Value !== null &&
                String(経度Value).trim() !== ""
                  ? Number(経度Value)
                  : undefined;


              return {
                店舗名,
                店舗住所,
                規定コール数,
                担当者,
                緯度,
                経度,
              };

            })
            .filter(
              (store) =>
                store.店舗名 !== "" ||
                store.店舗住所 !== ""
            );


        console.log(
          "CSV変換後:",
          stores
        );

        console.log(
          "CSV店舗数:",
          stores.length
        );


        resolve(stores);

      },

      error: (error) => {

        console.error(
          "CSV読み込みエラー:",
          error
        );

        reject(error);

      },

    });

  });

}