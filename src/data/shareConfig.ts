export type ShareConfig = {

  id: string;

  担当者: string;

  許可エリア: string[];

};



// 仮データ
// 後でデータベース化します

export const shareConfigs: ShareConfig[] = [

  {
    id:"sato-tokyo",
    担当者:"佐藤",
    許可エリア:[
      "東京都"
    ]
  },


  {
    id:"tanaka-kanagawa",
    担当者:"田中",
    許可エリア:[
      "神奈川県"
    ]
  },


];