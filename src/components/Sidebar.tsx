import type { Store } from "../types/Store";
import { shareConfigs } from "../data/shareConfig";

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
  onCsvUpload: (file: File) => void;
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
  const persons = [
    ...new Set(
      stores
        .map((store) => store.担当者)
        .filter(Boolean)
    ),
  ];

  const filteredPersons = persons.filter((person) =>
    person.includes(personKeyword)
  );

  const copyShareUrl = async (person: string) => {
    const config = shareConfigs.find(
      (config) => config.担当者 === person
    );

    if (!config) {
      alert(
        `${person}さんの共有設定がまだ登録されていません。`
      );
      return;
    }

    const url =
      `${window.location.origin}` +
      `${window.location.pathname}` +
      `?share=${config.id}`;

    try {
      await navigator.clipboard.writeText(url);

      alert(
        `${person}さん用の共有URLをコピーしました！\n\n${url}`
      );
    } catch (error) {
      console.error("URLコピーエラー:", error);

      window.prompt(
        "共有URLをコピーしてください",
        url
      );
    }
  };

  return (
    <aside className="sidebar">

      {/* 店舗検索 */}
      <section className="sidebar-section">
        <h3>🔍 店舗検索</h3>

        <input
          type="text"
          className="sidebar-input"
          placeholder="店舗名・住所を入力"
          value={keyword}
          onChange={(e) =>
            setKeyword(e.target.value)
          }
        />
      </section>

      {/* CSVアップロード */}
      {!isShareMode && (
        <section className="sidebar-section">
          <h3>📂 CSVアップロード</h3>

          <input
            type="file"
            accept=".csv"
            className="csv-input"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                onCsvUpload(file);
              }

              e.target.value = "";
            }}
          />

          <p className="sidebar-note">
            CSVを選択するとFirebaseへ保存します。
          </p>
        </section>
      )}

      {/* カラー設定 */}
      {!isShareMode && (
        <section className="sidebar-section">
          <h3>🎨 表示カラー</h3>

          <label className="radio-label">
            <input
              type="radio"
              name="colorMode"
              checked={colorMode === "person"}
              onChange={() =>
                setColorMode("person")
              }
            />
            担当者別
          </label>

          <label className="radio-label">
            <input
              type="radio"
              name="colorMode"
              checked={colorMode === "call"}
              onChange={() =>
                setColorMode("call")
              }
            />
            コール数別
          </label>
        </section>
      )}

      {/* 担当者 */}
      <section className="sidebar-section">
        <h3>👤 担当者</h3>

        {!isShareMode && (
          <>
            <input
              type="text"
              className="sidebar-input"
              placeholder="担当者を検索"
              value={personKeyword}
              onChange={(e) =>
                setPersonKeyword(e.target.value)
              }
            />

            <div className="person-buttons">
              <button onClick={selectAll}>
                全選択
              </button>

              <button onClick={clearAll}>
                全解除
              </button>
            </div>
          </>
        )}

        <div className="person-list">
          {filteredPersons.length === 0 ? (
            <div className="sidebar-note">
              担当者がありません
            </div>
          ) : (
            filteredPersons.map((person) => (
              <div
                key={person}
                className="person-row"
              >
                <label className="person-item">
                  <input
                    type="checkbox"
                    checked={selectedPersons.includes(
                      person
                    )}
                    disabled={isShareMode}
                    onChange={() =>
                      togglePerson(person)
                    }
                  />

                  <span>{person}</span>
                </label>

                {!isShareMode && (
                  <button
                    className="share-button"
                    onClick={() =>
                      copyShareUrl(person)
                    }
                  >
                    🔗 共有
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 閲覧専用表示 */}
      {isShareMode && (
        <section className="share-mode-box">
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