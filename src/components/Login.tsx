import { useState } from "react";
import { login } from "../services/authService";

type Props = {
  onLogin: () => void;
};

export default function Login({
  onLogin,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(
        "メールアドレスとパスワードを入力してください。"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(
        email,
        password
      );

      onLogin();

    } catch (error) {
      console.error(
        "ログインエラー:",
        error
      );

      setError(
        "メールアドレスまたはパスワードが正しくありません。"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-box">

        <div className="login-icon">
          🗺️
        </div>

        <h1>
          StoreMap
        </h1>

        <p className="login-title">
          管理者ログイン
        </p>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? "ログイン中..."
            : "ログイン"}
        </button>

      </div>

    </div>
  );
}