import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "../firebase";

// ログイン
export async function login(
  email: string,
  password: string
): Promise<User> {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return result.user;
}

// ログアウト
export async function logout() {
  await signOut(auth);
}

// ログイン状態を監視
export function watchAuth(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}