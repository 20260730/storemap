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

import {
  geocodeAddress,
} from "./geocodingService";


const COLLECTION_NAME = "stores";


// =====================================================
// 緯度経度を確実に付ける
// =====================================================

async function prepareStore(
  store: Store
): Promise<Store> {

  // すでに緯度経度がある場合
  if (
    typeof store.緯度 === "number" &&
    Number.isFinite(store.緯度) &&
    typeof store.経度 === "number" &&
    Number.isFinite(store.経度)
  ) {

    console.log(
      "既存の緯度経度を使用:",
      store.店舗名,
      store.緯度,
      store.経度
    );

    return store;
  }


  // ===================================================
  // 住所から緯度経度を取得
  // ===================================================

  console.log(
    "住所から緯度経度を取得:",
    store.店舗名,
    store.店舗住所
  );


  const coordinates =
    await geocodeAddress(
      store.店舗住所
    );


  if (coordinates) {

    console.log(
      "緯度経度取得成功:",
      store.店舗名,
      coordinates.緯度,
      coordinates.経度
    );


    return {
      ...store,

      緯度:
        coordinates.緯度,

      経度:
        coordinates.経度,
    };

  }


  // ===================================================
  // 取得できなかった場合
  // ===================================================

  console.warn(
    "緯度経度を取得できませんでした:",
    store.店舗名,
    store.店舗住所
  );


  // undefinedをFirestoreへ渡さない
  const safeStore: Store = {
    店舗名:
      store.店舗名,

    店舗住所:
      store.店舗住所,

    規定コール数:
      store.規定コール数,

    担当者:
      store.担当者,
  };


  return safeStore;
}


// =====================================================
// 全件取得
// =====================================================

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


// =====================================================
// 追加
// =====================================================

export async function addStore(
  store: Store
) {

  // ★ここで必ず緯度経度を付ける
  const preparedStore =
    await prepareStore(
      store
    );


  console.log(
    "Firebaseへ保存:",
    preparedStore
  );


  await addDoc(
    collection(
      db,
      COLLECTION_NAME
    ),
    preparedStore
  );
}


// =====================================================
// 全削除
// =====================================================

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


// =====================================================
// CSV一括保存
// =====================================================

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


// =====================================================
// 1件更新
// =====================================================

export async function updateStore(
  storeId: string,
  store: Store
) {

  // ★更新時も住所から緯度経度を補完
  const preparedStore =
    await prepareStore(
      store
    );


  console.log(
    "Firebase店舗更新:",
    preparedStore
  );


  await updateDoc(
    doc(
      db,
      COLLECTION_NAME,
      storeId
    ),
    preparedStore as Record<string, unknown>
  );
}


// =====================================================
// 1件削除
// =====================================================

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