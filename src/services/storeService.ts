import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import type { Store } from "../types/Store";


const COLLECTION_NAME =
  "stores";


// =========================
// Firebase保存用データ作成
// undefinedを絶対にFirebaseへ送らない
// =========================

function createFirebaseStore(
  store: Store
) {

  const data: Record<
    string,
    string | number
  > = {

    店舗名:
      store.店舗名,

    店舗住所:
      store.店舗住所,

    規定コール数:
      store.規定コール数,

    担当者:
      store.担当者,

  };


  // =========================
  // 緯度
  // =========================

  if (
    typeof store.緯度 === "number" &&
    Number.isFinite(store.緯度)
  ) {

    data.緯度 =
      store.緯度;

  }


  // =========================
  // 経度
  // =========================

  if (
    typeof store.経度 === "number" &&
    Number.isFinite(store.経度)
  ) {

    data.経度 =
      store.経度;

  }


  return data;

}


// =========================
// 全件取得
// =========================

export async function getStores():
  Promise<Store[]> {

  const snapshot =
    await getDocs(
      collection(
        db,
        COLLECTION_NAME
      )
    );


  return snapshot.docs.map(
    (item) => {

      const data =
        item.data();


      return {

        店舗名:
          String(
            data.店舗名 ?? ""
          ),

        店舗住所:
          String(
            data.店舗住所 ?? ""
          ),

        規定コール数:
          Number(
            data.規定コール数 ?? 0
          ),

        担当者:
          String(
            data.担当者 ?? ""
          ),

        緯度:
          typeof data.緯度 === "number"
            ? data.緯度
            : undefined,

        経度:
          typeof data.経度 === "number"
            ? data.経度
            : undefined,

        firebaseId:
          item.id,

      };

    }
  );

}


// =========================
// 追加
// =========================

export async function addStore(
  store: Store
) {

  const data =
    createFirebaseStore(
      store
    );


  console.log(
    "Firebaseへ保存:",
    data
  );


  await addDoc(
    collection(
      db,
      COLLECTION_NAME
    ),
    data
  );

}


// =========================
// 全削除
// =========================

export async function deleteAllStores() {

  const snapshot =
    await getDocs(
      collection(
        db,
        COLLECTION_NAME
      )
    );


  await Promise.all(

    snapshot.docs.map(
      (item) =>

        deleteDoc(
          doc(
            db,
            COLLECTION_NAME,
            item.id
          )
        )

    )

  );

}


// =========================
// CSV一括保存
// =========================

export async function saveStores(
  stores: Store[]
) {

  await deleteAllStores();


  for (
    const store of stores
  ) {

    await addStore(
      store
    );

  }

}


// =========================
// 1件更新
// =========================

export async function updateStore(
  storeId: string,
  store: Store
) {

  const data =
    createFirebaseStore(
      store
    );


  await updateDoc(

    doc(
      db,
      COLLECTION_NAME,
      storeId
    ),

    data

  );

}


// =========================
// 1件削除
// =========================

export async function deleteStore(
  storeId: string
) {

  await deleteDoc(

    doc(
      db,
      COLLECTION_NAME,
      storeId
    )

  );

}