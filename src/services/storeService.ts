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
// Firebase保存用データを作る
// undefinedを除外
// =========================

function createFirestoreStore(
  store: Store
) {

  const data: Record<
    string,
    unknown
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


  // 緯度が存在する場合だけ保存

  if (
    typeof store.緯度 === "number" &&
    Number.isFinite(store.緯度)
  ) {

    data.緯度 =
      store.緯度;

  }


  // 経度が存在する場合だけ保存

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

export async function getStores(): Promise<Store[]> {

  const snapshot =
    await getDocs(
      collection(
        db,
        COLLECTION_NAME
      )
    );


  return snapshot.docs.map(
    (item) => ({

      ...(item.data() as Store),

      firebaseId:
        item.id,

    })
  );
}


// =========================
// 追加
// =========================

export async function addStore(
  store: Store
) {

  const data =
    createFirestoreStore(
      store
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
    createFirestoreStore(
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