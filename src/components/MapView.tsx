import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import type { Store } from "../types/Store";

type Props = {
  stores: Store[];
  colorMode: "person" | "call";
};


// =========================
// 地図を店舗位置に自動調整
// =========================

function AutoZoom({
  stores,
}: {
  stores: Store[];
}) {

  const map = useMap();


  useEffect(() => {

    const points = stores

      .map(
        (store) =>
          [
            Number(store.緯度),
            Number(store.経度),
          ] as [number, number]
      )

      .filter(
        ([lat, lng]) =>
          Number.isFinite(lat) &&
          Number.isFinite(lng)
      );


    // 店舗がない場合

    if (
      points.length === 0
    ) {

      return;

    }


    /*
     * Leafletの地図サイズを再計算
     *
     * サイドバーなどのレイアウトが
     * 完成してからズームするために使用
     */

    map.invalidateSize();


    /*
     * 少し待ってから
     * 自動ズームを実行
     *
     * これにより共有URLで開いた場合も
     * 安定してズームできる
     */

    const timer =
      window.setTimeout(() => {

        map.invalidateSize();


        // =========================
        // 1店舗の場合
        // =========================

        if (
          points.length === 1
        ) {

          map.setView(
            points[0],
            16,
            {
              animate: true,
            }
          );

          return;

        }


        // =========================
        // 複数店舗の場合
        // =========================

        const bounds =
          L.latLngBounds(
            points
          );


        map.fitBounds(
          bounds,
          {
            paddingTopLeft: [
              80,
              80,
            ],

            paddingBottomRight: [
              80,
              80,
            ],

            maxZoom: 16,

            animate: true,
          }
        );

      }, 200);


    return () => {

      window.clearTimeout(
        timer
      );

    };

  }, [
    stores,
    map,
  ]);


  return null;

}


// =========================
// 担当者カラー
// =========================

function personColor(
  person: string
) {

  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#9b59b6",
    "#f1c40f",
    "#1abc9c",
    "#e67e22",
    "#34495e",
  ];


  let num = 0;


  for (
    let i = 0;
    i < person.length;
    i++
  ) {

    num +=
      person.charCodeAt(i);

  }


  return colors[
    num % colors.length
  ];

}


// =========================
// コール数カラー
// =========================

function callColor(
  call: number
) {

  if (
    call >= 6
  ) {

    return "#e74c3c";

  }


  if (
    call >= 4
  ) {

    return "#e67e22";

  }


  if (
    call >= 2
  ) {

    return "#2ecc71";

  }


  return "#3498db";

}


// =========================
// ピン作成
// =========================

function createIcon(
  color: string
) {

  return L.divIcon({

    className:
      "custom-marker",

    html: `
      <div
        style="
          width: 22px;
          height: 22px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "
      ></div>
    `,

    iconSize: [
      28,
      28,
    ],

    iconAnchor: [
      14,
      14,
    ],

  });

}


// =========================
// 凡例
// =========================

function Legend({
  colorMode,
}: {
  colorMode:
    | "person"
    | "call";
}) {

  return (

    <div className="map-legend">

      <strong>
        凡例
      </strong>


      {colorMode === "call" ? (

        <>

          <div>
            🔴 6コール以上
          </div>

          <div>
            🟠 4〜5コール
          </div>

          <div>
            🟢 2〜3コール
          </div>

          <div>
            🔵 1コール
          </div>

        </>

      ) : (

        <div>
          👤 担当者別カラー
        </div>

      )}

    </div>

  );

}


// =========================
// MapView本体
// =========================

export default function MapView({
  stores,
  colorMode,
}: Props) {

  return (

    <div className="map-view">

      <MapContainer

        center={[
          35.681236,
          139.767125,
        ]}

        zoom={10}

        className="leaflet-map"

        scrollWheelZoom={true}

      >

        <TileLayer

          attribution="© OpenStreetMap contributors"

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />


        {/* =========================
            自動ズーム
            ========================= */}

        <AutoZoom
          stores={stores}
        />


        {/* =========================
            店舗ピン
            ========================= */}

        {stores.map(
          (
            store,
            index
          ) => {

            const lat =
              Number(
                store.緯度
              );


            const lng =
              Number(
                store.経度
              );


            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng)
            ) {

              return null;

            }


            const color =
              colorMode === "person"

                ? personColor(
                    store.担当者
                  )

                : callColor(
                    Number(
                      store.規定コール数
                    )
                  );


            return (

              <Marker

                key={
                  `${store.店舗名}-${index}`
                }

                position={[
                  lat,
                  lng,
                ]}

                icon={
                  createIcon(
                    color
                  )
                }

              >

                <Popup>

                  <div className="map-popup">

                    <strong>
                      {store.店舗名}
                    </strong>


                    <p>
                      {store.店舗住所}
                    </p>


                    <p>
                      👤 担当者：
                      {store.担当者}
                    </p>


                    <p>
                      📞 規定コール数：
                      {store.規定コール数}
                    </p>

                  </div>

                </Popup>

              </Marker>

            );

          }
        )}

      </MapContainer>


      {/* =========================
          凡例
          ========================= */}

      <Legend
        colorMode={
          colorMode
        }
      />

    </div>

  );

}