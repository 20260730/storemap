import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import "./App.css";

import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import StoreTable from "./components/StoreTable";
import Login from "./components/Login";

import type { Store } from "./types/Store";
import type { User } from "firebase/auth";

import {
  addStore,
  deleteAllStores,
  getStores,
  updateStore,
} from "./services/storeService";

import {
  logout,
  watchAuth,
} from "./services/authService";

import { parseCsv } from "./utils/csv";

import { geocodeStores } from "./services/geocodingService";

import {
  shareConfigs,
  createShareConfig,
} from "./data/shareConfig";

import { db } from "./firebase";


// =========================
// App
// =========================

function App() {

  // =========================
  // ログイン
  // =========================

  const [user, setUser] =
    useState<User | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);


  // =========================
  // 管理者
  // =========================

  const [isAdmin, setIsAdmin] =
    useState(false);


  // =========================
  // URL
  // =========================

  const shareId =
    new URLSearchParams(
      window.location.search
    ).get("share");


  // =========================
  // 店舗
  // =========================

  const [stores, setStores] =
    useState<Store[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [personKeyword, setPersonKeyword] =
    useState("");

  const [selectedPersons, setSelectedPersons] =
    useState<string[]>([]);

  const [colorMode, setColorMode] =
    useState<"person" | "call">("person");

  const [loading, setLoading] =
    useState(false);


  // =========================
  // Firebaseログイン監視
  // =========================

  useEffect(() => {

    const unsubscribe =
      watchAuth((currentUser) => {

        setUser(currentUser);

        setAuthLoading(false);

      });

    return unsubscribe;

  }, []);


  // =========================
  // 管理者チェック
  // =========================

  useEffect(() => {

    if (!user) {

      setIsAdmin(false);

      return;

    }

    const checkAdmin =
      async () => {

        try {

          const snapshot =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (!snapshot.exists()) {

            setIsAdmin(false);

            return;

          }

          const userData =
            snapshot.data();

          setIsAdmin(
            userData.role === "admin"
          );

        } catch (error) {

          console.error(
            "管理者権限確認エラー:",
            error
          );

          setIsAdmin(false);

        }

      };

    checkAdmin();

  }, [user]);


  // =========================
  // 店舗データ読み込み
  // =========================

  useEffect(() => {

    if (authLoading) {
      return;
    }

    const loadStores =
      async () => {

        try {

          setLoading(true);

          const data =
            await getStores();

          console.log(
            "Firebaseから取得した店舗数:",
            data.length
          );

          setStores(data);


          // =========================
          // 共有URLの場合
          // =========================

          if (shareId) {

            // -------------------------
            // 既存の固定URL
            // -------------------------

            const fixedConfig =
              shareConfigs.find(
                (config) =>
                  config.id === shareId
              );

            if (fixedConfig) {

              setSelectedPersons([
                fixedConfig.担当者,
              ]);

              return;

            }


            // -------------------------
            // 自動生成URL
            // -------------------------

            const persons = [
              ...new Set(
                data
                  .map(
                    (store) =>
                      store.担当者?.trim()
                  )
                  .filter(Boolean)
              ),
            ];


            const autoConfig =
              persons
                .map(
                  (person) =>
                    createShareConfig(
                      person as string
                    )
                )
                .find(
                  (config) =>
                    config.id === shareId
                );


            if (autoConfig) {

              setSelectedPersons([
                autoConfig.担当者,
              ]);

            } else {

              console.warn(
                "共有URLに対応する担当者が見つかりません:",
                shareId
              );

              setSelectedPersons([]);

            }

            return;

          }


          // =========================
          // 通常モード
          // =========================

          const persons = [
            ...new Set(
              data
                .map(
                  (store) =>
                    store.担当者?.trim()
                )
                .filter(Boolean)
            ),
          ];

          setSelectedPersons(
            persons as string[]
          );

        } catch (error) {

          console.error(
            "Firebase読み込みエラー:",
            error
          );

          alert(
            "Firebaseから店舗データを読み込めませんでした。"
          );

        } finally {

          setLoading(false);

        }

      };

    loadStores();

  }, [
    authLoading,
    shareId,
  ]);


  // =========================
  // CSVアップロード
  // =========================

  const loadCsv =
    async (file: File) => {

      if (!isAdmin) {

        alert(
          "CSVアップロードは管理者のみ利用できます。"
        );

        return;

      }

      try {

        setLoading(true);


        // =========================
        // CSV読み込み
        // =========================

        let csvStores =
          await parseCsv(file);

        if (
          csvStores.length === 0
        ) {

          alert(
            "CSVに店舗データがありません。"
          );

          return;

        }


        // =========================
        // 住所から座標取得
        // =========================

        console.log(
          "住所から緯度・経度を取得します..."
        );

        csvStores =
          await geocodeStores(
            csvStores
          );


        // =========================
        // アップロード方法
        // =========================

        const mode =
          window.prompt(
            "CSVアップロード方法を選択してください。\n\n" +
            "1：追加＋更新\n" +
            "2：全件書き換え\n\n" +
            "1 または 2 を入力してください。"
          );


        if (
          mode !== "1" &&
          mode !== "2"
        ) {

          alert(
            "CSVアップロードをキャンセルしました。"
          );

          return;

        }


        // =====================================================
        // ① 追加＋更新
        // =====================================================

        if (mode === "1") {

          const currentStores =
            await getStores();

          let addCount = 0;
          let updateCount = 0;


          for (
            const csvStore of csvStores
          ) {

            const existingStore =
              currentStores.find(
                (store) =>
                  store.店舗名.trim() ===
                    csvStore.店舗名.trim() &&
                  store.店舗住所.trim() ===
                    csvStore.店舗住所.trim()
              );


            if (
              existingStore &&
              existingStore.firebaseId
            ) {

              await updateStore(
                existingStore.firebaseId,
                csvStore
              );

              updateCount++;

            } else {

              await addStore(
                csvStore
              );

              addCount++;

            }

          }


          // =========================
          // 再読み込み
          // =========================

          const updatedStores =
            await getStores();

          setStores(
            updatedStores
          );


          const persons = [
            ...new Set(
              updatedStores
                .map(
                  (store) =>
                    store.担当者?.trim()
                )
                .filter(Boolean)
            ),
          ] as string[];


          setSelectedPersons(
            persons
          );


          alert(
            `CSVの取り込みが完了しました！\n\n` +
            `追加：${addCount}店舗\n` +
            `更新：${updateCount}店舗`
          );

          return;

        }


        // =====================================================
        // ② 全件書き換え
        // =====================================================

        if (mode === "2") {

          const confirmed =
            window.confirm(
              `現在Firebaseに登録されている店舗をすべて削除して、CSVの内容に入れ替えます。\n\n` +
              `現在の店舗数：${stores.length}店舗\n` +
              `新しいCSV：${csvStores.length}店舗\n\n` +
              `本当に全件書き換えしますか？`
            );


          if (!confirmed) {

            alert(
              "CSVアップロードをキャンセルしました。"
            );

            return;

          }


          await deleteAllStores();


          for (
            const store of csvStores
          ) {

            await addStore(
              store
            );

          }


          const updatedStores =
            await getStores();

          setStores(
            updatedStores
          );


          const persons = [
            ...new Set(
              updatedStores
                .map(
                  (store) =>
                    store.担当者?.trim()
                )
                .filter(Boolean)
            ),
          ] as string[];


          setSelectedPersons(
            persons
          );


          alert(
            `全件書き換えが完了しました！\n\n` +
            `${updatedStores.length}店舗を登録しました。`
          );

        }

      } catch (error) {

        console.error(
          "CSVアップロードエラー:",
          error
        );

        alert(
          "CSVの読み込みまたはFirebaseへの保存に失敗しました。"
        );

      } finally {

        setLoading(false);

      }

    };


  // =========================
  // 共有モード判定
  // =========================

  const activeShareConfig =
    useMemo(() => {

      if (!shareId) {
        return null;
      }


      // 固定設定
      const fixedConfig =
        shareConfigs.find(
          (config) =>
            config.id === shareId
        );

      if (fixedConfig) {
        return fixedConfig;
      }


      // 自動設定
      const person =
        stores
          .map(
            (store) =>
              store.担当者?.trim()
          )
          .filter(Boolean)
          .find(
            (person) =>
              createShareConfig(
                person as string
              ).id === shareId
          );


      if (!person) {
        return null;
      }


      return createShareConfig(
        person
      );

    }, [
      shareId,
      stores,
    ]);


  const isShareMode =
    Boolean(
      shareId &&
      activeShareConfig
    );


  // =========================
  // 共有URLの表示制限
  // =========================

  const permissionStores =
    useMemo(() => {

      if (
        !isShareMode ||
        !activeShareConfig
      ) {

        return stores;

      }


      return stores.filter(
        (store) => {

          return (
            store.担当者?.trim() ===
            activeShareConfig.担当者.trim()
          );

        }
      );

    }, [
      stores,
      isShareMode,
      activeShareConfig,
    ]);


  // =========================
  // 店舗検索
  // =========================

  const filteredStores =
    useMemo(() => {

      const search =
        keyword.trim();

      if (!search) {

        return permissionStores;

      }

      return permissionStores.filter(
        (store) =>
          store.店舗名.includes(
            search
          ) ||
          store.店舗住所.includes(
            search
          )
      );

    }, [
      permissionStores,
      keyword,
    ]);


  // =========================
  // 担当者一覧
  // =========================

  const persons =
    useMemo(() => {

      return [
        ...new Set(
          permissionStores
            .map(
              (store) =>
                store.担当者?.trim()
            )
            .filter(Boolean)
        ),
      ] as string[];

    }, [
      permissionStores,
    ]);


  // =========================
  // 担当者選択
  // =========================

  const togglePerson =
    (person: string) => {

      setSelectedPersons(
        (current) => {

          if (
            current.includes(person)
          ) {

            return current.filter(
              (p) =>
                p !== person
            );

          }

          return [
            ...current,
            person,
          ];

        }
      );

    };


  // =========================
  // 全選択
  // =========================

  const selectAll = () => {

    setSelectedPersons(
      persons
    );

  };


  // =========================
  // 全解除
  // =========================

  const clearAll = () => {

    setSelectedPersons([]);

  };


  // =========================
  // 最終表示店舗
  // =========================

  const finalStores =
    useMemo(() => {

      if (isShareMode) {

        return filteredStores;

      }

      return filteredStores.filter(
        (store) =>
          selectedPersons.includes(
            store.担当者
          )
      );

    }, [
      filteredStores,
      selectedPersons,
      isShareMode,
    ]);


  // =========================
  // ログアウト
  // =========================

  const handleLogout =
    async () => {

      try {

        await logout();

      } catch (error) {

        console.error(
          "ログアウトエラー:",
          error
        );

      }

    };


  // =========================
  // 認証読み込み中
  // =========================

  if (authLoading) {

    return (
      <div className="login-page">

        <div className="login-box">

          <div className="login-icon">
            🗺️
          </div>

          <h1>
            StoreMap
          </h1>

          <p>
            読み込み中...
          </p>

        </div>

      </div>
    );

  }


  // =========================
  // 未ログイン
  // =========================

  if (
    !isShareMode &&
    !user
  ) {

    return (
      <Login
        onLogin={() => {}}
      />
    );

  }


  // =========================
  // 画面
  // =========================

  return (

    <div className="app">


      {/* =========================
          ヘッダー
      ========================= */}

      <header className="header">

        <div className="header-title">
          🗺️ StoreMap
        </div>


        <div className="header-info">

          {loading
            ? "💾 読み込み中..."
            : `${finalStores.length}店舗表示`
          }


          {!isShareMode &&
            user && (

              <button
                className="logout-button"
                onClick={
                  handleLogout
                }
              >
                🚪 ログアウト
              </button>

            )}

        </div>

      </header>


      {/* =========================
          共有モード
      ========================= */}

      {isShareMode &&
        activeShareConfig && (

          <div className="share-banner">

            <strong>
              👀 閲覧専用
            </strong>

            <span>
              表示担当者：
              {activeShareConfig.担当者}
            </span>

          </div>

        )}


      {/* =========================
          メイン
      ========================= */}

      <main className="main">


        {/* =========================
            サイドバー
        ========================= */}

        <Sidebar

          stores={
            permissionStores
          }

          keyword={
            keyword
          }

          setKeyword={
            setKeyword
          }

          personKeyword={
            personKeyword
          }

          setPersonKeyword={
            setPersonKeyword
          }

          selectedPersons={
            selectedPersons
          }

          togglePerson={
            togglePerson
          }

          selectAll={
            selectAll
          }

          clearAll={
            clearAll
          }

          isShareMode={
            isShareMode
          }

          onCsvUpload={
            loadCsv
          }

          colorMode={
            colorMode
          }

          setColorMode={
            setColorMode
          }

        />


        {/* =========================
            地図
        ========================= */}

        <section className="map-area">

          <MapView

            stores={
              finalStores
            }

            colorMode={
              colorMode
            }

          />

        </section>

      </main>


      {/* =========================
          店舗一覧
      ========================= */}

      <section className="table-area">

        <StoreTable
          stores={
            finalStores
          }
        />

      </section>


    </div>

  );

}


export default App;