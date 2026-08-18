import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";

import type { Store } from "../types/Store";

import {
  addStore,
  updateStore,
  deleteStore,
} from "../services/storeService";

import { auth, db } from "../firebase";

type Props = {
  stores: Store[];
};

export default function StoreTable({
  stores,
}: Props) {

  // =========================
  // 管理者判定
  // =========================

  const [isAdmin, setIsAdmin] =
    useState(false);

  // =========================
  // 編集
  // =========================

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editStore, setEditStore] =
    useState<Store | null>(null);

  // =========================
  // 追加フォーム
  // =========================

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [newStore, setNewStore] =
    useState<Store>({
      店舗名: "",
      店舗住所: "",
      規定コール数: "",
      担当者: "",
      緯度: "",
      経度: "",
    });

  // =========================
  // 保存中
  // =========================

  const [saving, setSaving] =
    useState(false);

  // =========================
  // 管理者チェック
  // =========================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {
            setIsAdmin(false);
            return;
          }

          try {

            const userDoc =
              await getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              );

            if (userDoc.exists()) {

              const data =
                userDoc.data();

              setIsAdmin(
                data.role === "admin"
              );

            } else {

              setIsAdmin(false);

            }

          } catch (error) {

            console.error(
              "StoreTable管理者確認エラー:",
              error
            );

            setIsAdmin(false);

          }

        }
      );

    return unsubscribe;

  }, []);

  // =========================
  // 追加フォームを開く
  // =========================

  const openAddForm = () => {

    setNewStore({
      店舗名: "",
      店舗住所: "",
      規定コール数: "",
      担当者: "",
      緯度: "",
      経度: "",
    });

    setShowAddForm(true);

  };

  // =========================
  // 追加フォームを閉じる
  // =========================

  const closeAddForm = () => {

    setShowAddForm(false);

  };

  // =========================
  // 新規店舗の入力変更
  // =========================

  const changeNewStore = (
    field: keyof Store,
    value: string
  ) => {

    setNewStore(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

  };

  // =========================
  // 店舗追加
  // =========================

  const handleAdd = async () => {

    // 必須チェック

    if (
      !newStore.店舗名.trim()
    ) {

      alert(
        "店舗名を入力してください。"
      );

      return;

    }

    if (
      !newStore.店舗住所.trim()
    ) {

      alert(
        "店舗住所を入力してください。"
      );

      return;

    }

    if (
      !newStore.担当者.trim()
    ) {

      alert(
        "担当者を入力してください。"
      );

      return;

    }

    try {

      setSaving(true);

      await addStore({
        店舗名:
          newStore.店舗名.trim(),

        店舗住所:
          newStore.店舗住所.trim(),

        規定コール数:
          newStore.規定コール数.trim(),

        担当者:
          newStore.担当者.trim(),

        緯度:
          newStore.緯度?.trim(),

        経度:
          newStore.経度?.trim(),
      });

      alert(
        "店舗を追加しました！"
      );

      setShowAddForm(false);

      // Firebaseから最新データを再取得
      window.location.reload();

    } catch (error) {

      console.error(
        "店舗追加エラー:",
        error
      );

      alert(
        "店舗の追加に失敗しました。"
      );

    } finally {

      setSaving(false);

    }

  };

  // =========================
  // 編集開始
  // =========================

  const startEdit = (
    store: Store
  ) => {

    setEditingId(
      store.firebaseId ?? null
    );

    setEditStore({
      ...store,
    });

  };

  // =========================
  // 編集キャンセル
  // =========================

  const cancelEdit = () => {

    setEditingId(null);

    setEditStore(null);

  };

  // =========================
  // 編集内容変更
  // =========================

  const changeEditValue = (
    field: keyof Store,
    value: string
  ) => {

    if (!editStore) {
      return;
    }

    setEditStore({
      ...editStore,
      [field]: value,
    });

  };

  // =========================
  // 編集保存
  // =========================

  const handleSave = async () => {

    if (!editStore) {
      return;
    }

    if (!editStore.firebaseId) {

      alert(
        "Firebaseの店舗IDがありません。"
      );

      return;

    }

    if (
      !editStore.店舗名.trim()
    ) {

      alert(
        "店舗名を入力してください。"
      );

      return;

    }

    if (
      !editStore.店舗住所.trim()
    ) {

      alert(
        "店舗住所を入力してください。"
      );

      return;

    }

    if (
      !editStore.担当者.trim()
    ) {

      alert(
        "担当者を入力してください。"
      );

      return;

    }

    try {

      setSaving(true);

      await updateStore(
        editStore.firebaseId,
        {
          店舗名:
            editStore.店舗名.trim(),

          店舗住所:
            editStore.店舗住所.trim(),

          規定コール数:
            editStore.規定コール数.trim(),

          担当者:
            editStore.担当者.trim(),

          緯度:
            editStore.緯度?.trim(),

          経度:
            editStore.経度?.trim(),
        }
      );

      alert(
        "店舗情報を更新しました！"
      );

      setEditingId(null);

      setEditStore(null);

      window.location.reload();

    } catch (error) {

      console.error(
        "店舗更新エラー:",
        error
      );

      alert(
        "店舗情報の更新に失敗しました。"
      );

    } finally {

      setSaving(false);

    }

  };

  // =========================
  // 店舗削除
  // =========================

  const handleDelete = async (
    store: Store
  ) => {

    if (!store.firebaseId) {

      alert(
        "Firebaseの店舗IDがありません。"
      );

      return;

    }

    const result =
      window.confirm(
        `「${store.店舗名}」を削除しますか？\n\nこの操作は元に戻せません。`
      );

    if (!result) {
      return;
    }

    try {

      setSaving(true);

      await deleteStore(
        store.firebaseId
      );

      alert(
        "店舗を削除しました！"
      );

      window.location.reload();

    } catch (error) {

      console.error(
        "店舗削除エラー:",
        error
      );

      alert(
        "店舗の削除に失敗しました。"
      );

    } finally {

      setSaving(false);

    }

  };

  // =========================
  // 画面
  // =========================

  return (

    <div className="store-table">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          🏪 店舗一覧
        </h3>

        {isAdmin && (

          <button
            onClick={openAddForm}
            disabled={saving}
            style={{
              padding:
                "8px 14px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
            }}
          >
            ＋ 店舗を追加
          </button>

        )}

      </div>


      {/* =========================
          新規店舗追加フォーム
      ========================= */}

      {isAdmin &&
        showAddForm && (

          <div
            style={{
              border:
                "1px solid #ddd",
              borderRadius:
                "8px",
              padding:
                "15px",
              marginBottom:
                "15px",
              background:
                "#f8f9fa",
            }}
          >

            <h4>
              ➕ 新しい店舗を追加
            </h4>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "8px",
              }}
            >

              <input
                type="text"
                placeholder="店舗名 *"
                value={
                  newStore.店舗名
                }
                onChange={(e) =>
                  changeNewStore(
                    "店舗名",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="店舗住所 *"
                value={
                  newStore.店舗住所
                }
                onChange={(e) =>
                  changeNewStore(
                    "店舗住所",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="規定コール数"
                value={
                  newStore.規定コール数
                }
                onChange={(e) =>
                  changeNewStore(
                    "規定コール数",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="担当者 *"
                value={
                  newStore.担当者
                }
                onChange={(e) =>
                  changeNewStore(
                    "担当者",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="緯度（任意）"
                value={
                  newStore.緯度 ?? ""
                }
                onChange={(e) =>
                  changeNewStore(
                    "緯度",
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="経度（任意）"
                value={
                  newStore.経度 ?? ""
                }
                onChange={(e) =>
                  changeNewStore(
                    "経度",
                    e.target.value
                  )
                }
              />

            </div>


            <div
              style={{
                marginTop:
                  "12px",
              }}
            >

              <button
                onClick={
                  handleAdd
                }
                disabled={saving}
              >
                {saving
                  ? "保存中..."
                  : "💾 追加する"}
              </button>

              <button
                onClick={
                  closeAddForm
                }
                disabled={saving}
                style={{
                  marginLeft:
                    "8px",
                }}
              >
                キャンセル
              </button>

            </div>

          </div>

        )}


      {/* =========================
          管理者表示
      ========================= */}

      {isAdmin && (

        <p
          style={{
            margin:
              "0 0 10px",
            fontSize:
              "13px",
            color:
              "#555",
          }}
        >
          👑 管理者モード：
          店舗の追加・編集・削除ができます
        </p>

      )}


      {/* =========================
          店舗一覧
      ========================= */}

      <div className="table-scroll">

        <table>

          <thead>

            <tr>

              <th>
                店舗名
              </th>

              <th>
                住所
              </th>

              <th>
                規定コール数
              </th>

              <th>
                担当者
              </th>

              {isAdmin && (
                <th>
                  操作
                </th>
              )}

            </tr>

          </thead>


          <tbody>

            {stores.map(
              (store, index) => {

                const isEditing =
                  editingId ===
                  store.firebaseId;

                // =========================
                // 編集中
                // =========================

                if (
                  isEditing &&
                  editStore
                ) {

                  return (

                    <tr
                      key={
                        store.firebaseId ??
                        `${store.店舗名}-${index}`
                      }
                    >

                      <td>

                        <input
                          type="text"
                          value={
                            editStore.店舗名
                          }
                          onChange={(e) =>
                            changeEditValue(
                              "店舗名",
                              e.target.value
                            )
                          }
                        />

                      </td>


                      <td>

                        <input
                          type="text"
                          value={
                            editStore.店舗住所
                          }
                          onChange={(e) =>
                            changeEditValue(
                              "店舗住所",
                              e.target.value
                            )
                          }
                        />

                      </td>


                      <td>

                        <input
                          type="text"
                          value={
                            editStore.規定コール数
                          }
                          onChange={(e) =>
                            changeEditValue(
                              "規定コール数",
                              e.target.value
                            )
                          }
                        />

                      </td>


                      <td>

                        <input
                          type="text"
                          value={
                            editStore.担当者
                          }
                          onChange={(e) =>
                            changeEditValue(
                              "担当者",
                              e.target.value
                            )
                          }
                        />

                      </td>


                      <td>

                        <button
                          onClick={
                            handleSave
                          }
                          disabled={saving}
                        >
                          {saving
                            ? "保存中..."
                            : "💾 保存"}
                        </button>

                        <button
                          onClick={
                            cancelEdit
                          }
                          disabled={saving}
                          style={{
                            marginLeft:
                              "5px",
                          }}
                        >
                          キャンセル
                        </button>

                      </td>

                    </tr>

                  );

                }

                // =========================
                // 通常表示
                // =========================

                return (

                  <tr
                    key={
                      store.firebaseId ??
                      `${store.店舗名}-${index}`
                    }
                  >

                    <td>
                      {store.店舗名}
                    </td>

                    <td>
                      {store.店舗住所}
                    </td>

                    <td>
                      {
                        store.規定コール数
                      }
                    </td>

                    <td>
                      {store.担当者}
                    </td>


                    {isAdmin && (

                      <td>

                        <button
                          onClick={() =>
                            startEdit(
                              store
                            )
                          }
                          disabled={
                            saving
                          }
                        >
                          ✏️ 編集
                        </button>


                        <button
                          onClick={() =>
                            handleDelete(
                              store
                            )
                          }
                          disabled={
                            saving
                          }
                          style={{
                            marginLeft:
                              "5px",
                          }}
                        >
                          🗑️ 削除
                        </button>

                      </td>

                    )}

                  </tr>

                );

              }
            )}

          </tbody>

        </table>


        {stores.length === 0 && (

          <p className="empty-message">
            表示する店舗がありません。
          </p>

        )}

      </div>

    </div>

  );
}