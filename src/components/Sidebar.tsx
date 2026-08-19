import type { Store } from "../types/Store";
import { shareConfigs } from "../data/shareConfig";
import { createShareConfig } from "../data/shareConfig";

type CsvImportMode = "merge" | "replace";

type Props = {
  stores: Store[];
  keyword: string;
  setKeyword: (value: string) => void;
  personKeyword: string;
  setPersonKeyword: (value: string) => void;
  selectedPersons: string[];
  togglePerson: (person: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  isShareMode: boolean;
  onCsvUpload: (
    file: File,
    mode: CsvImportMode
  ) => void;
  colorMode: "person" | "call";
  setColorMode: (mode: "person" | "call") => void;
};

export default function Sidebar({
  stores,
  keyword,
  setKeyword,
  personKeyword,
  setPersonKeyword,
  selectedPersons,
  togglePerson,
  selectAll,
  clearAll,
  isShareMode,
  onCsvUpload,
  colorMode,
  setColorMode,
}: Props) {

  // =========================
  // 担当者一覧
  // =========================

  const persons = [
    ...new Set(
      stores
        .map(
          (store) =>
            store.担当者?.trim()
        )
        .filter(Boolean)
    ),
  ] as string[];


  // =========================
  // 担当者検索
  // =========================

  const filteredPersons =
    persons.filter(
      (person) =>
        person.includes(
          personKeyword
        )
    );


  // =========================
  // 共有URLコピー
  // =========================

  const copyShareUrl =
    async (person: string) => {

      const cleanPerson =
        person.trim();


      if (!cleanPerson) {

        alert(
          "担当者名がありません。"
        );

        return;

      }


      // =========================
      // 既存の固定設定を確認
      // =========================

      const fixedConfig =
        shareConfigs.find(
          (config) =>
            config.担当者.trim() ===
            cleanPerson
        );


      // =========================
      // 固定設定がなければ
      // 自動生成
      // =========================

      const config =
        fixedConfig ??
        createShareConfig(
          cleanPerson
        );


      // =========================
      // URL作成
      // =========================

      const url =
        `${window.location.origin}` +
        `${window.location.pathname}` +
        `?share=${encodeURIComponent(
          config.id
        )}`;


      console.log(
        "共有URL:",
        url
      );


      // =========================
      // コピー
      // =========================

      try {

        await navigator.clipboard.writeText(
          url
        );

        alert(
          `${cleanPerson}さん用の共有URLをコピーしました！\n\n${url}`
        );

      } catch (error) {

        console.error(
          "URLコピーエラー:",
          error
        );

        window.prompt(
          "共有URLをコピーしてください",
          url
        );

      }

    };


  return (

    <aside className="sidebar">


      {/* =========================
          店舗検索
      ========================= */}

      <section className="sidebar-section">

        <h3>
          🔍 店舗検索
        </h3>

        <input
          type="text"
          className="sidebar-input"
          placeholder="店舗名・住所を入力"
          value={keyword}
          onChange={(e) =>
            setKeyword(
              e.target.value
            )
          }
        />

      </section>


      {/* =========================
          CSVアップロード
      ========================= */}

      {!isShareMode && (

        <section className="sidebar-section">

          <h3>
            📂 CSVアップロード
          </h3>


          <div
            style={{
              marginBottom:
                "10px",
            }}
          >

            <label
              className="radio-label"
              style={{
                display: "block",
                marginBottom:
                  "8px",
              }}
            >

              <input
                type="radio"
                name="csvImportMode"
                value="merge"
                defaultChecked
              />

              追加＋更新

            </label>


            <label
              className="radio-label"
              style={{
                display: "block",
              }}
            >

              <input
                type="radio"
                name="csvImportMode"
                value="replace"
              />

              全件書き換え

            </label>

          </div>


          <input
            type="file"
            accept=".csv"
            className="csv-input"
            onChange={(e) => {

              const file =
                e.target.files?.[0];


              if (file) {

                const selectedMode =
                  document.querySelector(
                    'input[name="csvImportMode"]:checked'
                  ) as
                    | HTMLInputElement
                    | null;


                const mode =
                  selectedMode?.value ===
                  "replace"
                    ? "replace"
                    : "merge";


                onCsvUpload(
                  file,
                  mode
                );

              }


              e.target.value = "";

            }}
          />


          <p className="sidebar-note">

            「追加＋更新」：
            既存店舗は更新、新規店舗は追加します。

            <br />

            「全件書き換え」：
            現在の店舗をすべてCSVに置き換えます。

          </p>

        </section>

      )}


      {/* =========================
          表示カラー
      ========================= */}

      {!isShareMode && (

        <section className="sidebar-section">

          <h3>
            🎨 表示カラー
          </h3>


          <label className="radio-label">

            <input
              type="radio"
              name="colorMode"
              checked={
                colorMode === "person"
              }
              onChange={() =>
                setColorMode(
                  "person"
                )
              }
            />

            担当者別

          </label>


          <label className="radio-label">

            <input
              type="radio"
              name="colorMode"
              checked={
                colorMode === "call"
              }
              onChange={() =>
                setColorMode(
                  "call"
                )
              }
            />

            コール数別

          </label>

        </section>

      )}


      {/* =========================
          担当者
      ========================= */}

      <section className="sidebar-section">

        <h3>
          👤 担当者
        </h3>


        {!isShareMode && (

          <>

            <input
              type="text"
              className="sidebar-input"
              placeholder="担当者を検索"
              value={
                personKeyword
              }
              onChange={(e) =>
                setPersonKeyword(
                  e.target.value
                )
              }
            />


            <div className="person-buttons">

              <button
                onClick={
                  selectAll
                }
              >
                全選択
              </button>


              <button
                onClick={
                  clearAll
                }
              >
                全解除
              </button>

            </div>

          </>

        )}


        {/* =========================
            担当者一覧
        ========================= */}

        <div className="person-list">

          {filteredPersons.length ===
          0 ? (

            <div className="sidebar-note">
              担当者がありません
            </div>

          ) : (

            filteredPersons.map(
              (person) => (

                <div
                  key={person}
                  className="person-row"
                >


                  <label
                    className="person-item"
                  >

                    <input
                      type="checkbox"
                      checked={selectedPersons.includes(
                        person
                      )}
                      disabled={
                        isShareMode
                      }
                      onChange={() =>
                        togglePerson(
                          person
                        )
                      }
                    />


                    <span>
                      {person}
                    </span>

                  </label>


                  {/* =========================
                      共有ボタン
                  ========================= */}

                  {!isShareMode && (

                    <button
                      className="share-button"
                      onClick={() =>
                        copyShareUrl(
                          person
                        )
                      }
                    >
                      🔗 共有
                    </button>

                  )}

                </div>

              )
            )

          )}

        </div>

      </section>


      {/* =========================
          閲覧専用
      ========================= */}

      {isShareMode && (

        <section
          className="share-mode-box"
        >

          <strong>
            👀 閲覧専用
          </strong>


          <p>
            このURLでは指定された担当者の店舗だけ表示しています。
          </p>

        </section>

      )}

    </aside>

  );

}