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

const COLLECTION_NAME = "stores";

// =========================
// 全件取得
// =========================

export async function getStores(): Promise<Store[]> {
  const snapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );

  return snapshot.docs.map((item) => ({
    ...(item.data() as Store),
    firebaseId: item.id,
  }));
}

// =========================
// 追加
// =========================

export async function addStore(
  store: Store
) {
  await addDoc(
    collection(db, COLLECTION_NAME),
    store
  );
}

// =========================
// 全削除
// =========================

export async function deleteAllStores() {
  const snapshot = await getDocs(
    collection(db, COLLECTION_NAME)
  );

  await Promise.all(
    snapshot.docs.map((item) =>
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

  for (const store of stores) {
    await addStore(store);
  }
}

// =========================
// 1件更新
// =========================

export async function updateStore(
  storeId: string,
  store: Store
) {
  await updateDoc(
    doc(
      db,
      COLLECTION_NAME,
      storeId
    ),
    store as Record<string, unknown>
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