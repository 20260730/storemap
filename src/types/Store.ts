export type Store = {
  店舗名: string;
  店舗住所: string;
  規定コール数: number;
  担当者: string;
  緯度?: number;
  経度?: number;

  // FirebaseのドキュメントID
  firebaseId?: string;
};