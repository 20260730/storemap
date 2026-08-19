import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

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

import { shareConfigs } from "./data/shareConfig";

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
  // 共有URL
  // =========================

  const shareId =
    new URLSearchParams(
      window.location.search
    ).get("share");

  const shareConfig =
    shareConfigs.find(
      (config) =>
        config.id === shareId
    );

  const isShareMode =
    Boolean(shareConfig);


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

          console.log(
            "ログインUID:",
            user.uid
          );

          const userSnapshot =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (
            !userSnapshot.exists()
          ) {

            console.log(
              "usersにユーザー情報がありません"
            );

            setIsAdmin(false);

            return;

          }

          const userData =
            userSnapshot.data();

          console.log(
            "Firestoreのrole:",
            userData.role
          );

          if (
            userData.role === "admin"
          ) {

            console.log(
              "管理者として認識しました"
            );

            setIsAdmin(true);

          } else {

            console.log(
              "閲覧者として認識しました"
            );

            setIsAdmin(false);

          }

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
  // Firebaseから店舗データ取得
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
          // 共有URL
          // =========================

          if (shareConfig) {

            setSelectedPersons([
              shareConfig.担当者,
            ]);

          } else {

            const persons = [
              ...new Set(
                data
                  .map(
                    (store) =>
                      store.担当者
                  )
                  .filter(Boolean)
              ),
            ];

            setSelectedPersons(
              persons
            );

          }

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
    shareConfig,
  ]);


  // =========================
  // CSVアップロード
  // =========================

  const loadCsv =
    async (file: File) => {

      // =========================
      // 管理者チェック
      // =========================

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

        const csvData =
          await parseCsv(file);

        console.log(
          "CSV読み込み店舗数:",
          csvData.length
        );


        // =========================
        // 空CSVチェック
        // =========================

        if (csvData.length === 0) {

          alert(
            "CSVに店舗データがありません。"
          );

          return;

        }


        // =========================
        // 住所から緯度・経度を取得
        // =========================

        alert(
          "CSVを読み込みました。\n\n住所から地図の位置を取得しています。\n店舗数が多い場合は少し時間がかかります。"
        );

        const data =
          await geocodeStores(
            csvData
          );

        console.log(
          "位置情報取得完了:",
          data
        );


        // =========================
        // アップロード方法を選択
        // =========================

        const mode =
          window.prompt(
            "CSVアップロード方法を選択してください。\n\n" +
            "1：追加＋更新\n" +
            "2：全件書き換え\n\n" +
            "1 または 2 を入力してください。"
          );


        // =========================
        // キャンセル
        // =========================

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

          console.log(
            "現在のFirebase店舗数:",
            currentStores.length
          );


          let addCount = 0;
          let updateCount = 0;


          for (
            const csvStore of data
          ) {

            // =========================
            // 店舗名＋住所で既存店舗を検索
            // =========================

            const existingStore =
              currentStores.find(
                (store) =>
                  store.店舗名.trim() ===
                    csvStore.店舗名.trim() &&
                  store.店舗住所.trim() ===
                    csvStore.店舗住所.trim()
              );


            // =========================
            // 既存店舗 → 更新
            // =========================

            if (
              existingStore &&
              existingStore.firebaseId
            ) {

              await updateStore(
                existingStore.firebaseId,
                csvStore
              );

              updateCount++;

            }


            // =========================
            // 新しい店舗 → 追加
            // =========================

            else {

              await addStore(
                csvStore
              );

              addCount++;

            }

          }


          // =========================
          // Firebaseから再取得
          // =========================

          const updatedStores =
            await getStores();

          setStores(
            updatedStores
          );


          // =========================
          // 担当者一覧更新
          // =========================

          const persons = [
            ...new Set(
              updatedStores
                .map(
                  (store) =>
                    store.担当者
                )
                .filter(Boolean)
            ),
          ];

          setSelectedPersons(
            persons
          );


          // =========================
          // 完了
          // =========================

          alert(
            `CSVの取り込みが完了しました！\n\n` +
            `追加：${addCount}店舗\n` +
            `更新：${updateCount}店舗\n` +
            `取り込み後の総店舗数：${updatedStores.length}店舗`
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
              `新しいCSV：${data.length}店舗\n\n` +
              `本当に全件書き換えしますか？`
            );


          if (!confirmed) {

            alert(
              "CSVアップロードをキャンセルしました。"
            );

            return;

          }


          // =========================
          // 既存データ削除
          // =========================

          await deleteAllStores();


          // =========================
          // CSVデータ保存
          // =========================

          for (
            const store of data
          ) {

            await addStore(
              store
            );

          }


          // =========================
          // Firebaseから再取得
          // =========================

          const updatedStores =
            await getStores();


          setStores(
            updatedStores
          );


          // =========================
          // 担当者一覧
          // =========================

          const persons = [
            ...new Set(
              updatedStores
                .map(
                  (store) =>
                    store.担当者
                )
                .filter(Boolean)
            ),
          ];

          setSelectedPersons(
            persons
          );


          // =========================
          // 完了
          // =========================

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
  // 共有URLの表示制限
  // =========================

  const permissionStores =
    useMemo(() => {

      if (
        !isShareMode ||
        !shareConfig
      ) {

        return stores;

      }

      return stores.filter(
        (store) => {

          const personMatch =
            store.担当者 ===
            shareConfig.担当者;

          const areaMatch =
            shareConfig.許可エリア.length === 0 ||
            shareConfig.許可エリア.some(
              (area) =>
                store.店舗住所.includes(
                  area
                )
            );

          return (
            personMatch &&
            areaMatch
          );

        }
      );

    }, [
      stores,
      isShareMode,
      shareConfig,
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
                store.担当者
            )
            .filter(Boolean)
        ),
      ];

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
            current.includes(
              person
            )
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

      return filteredStores.filter(
        (store) =>
          selectedPersons.includes(
            store.担当者
          )
      );

    }, [
      filteredStores,
      selectedPersons,
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
  // 通常モードで未ログイン
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
        shareConfig && (

          <div className="share-banner">

            <strong>
              👀 閲覧専用
            </strong>

            <span>
              表示担当者：
              {shareConfig.担当者}
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