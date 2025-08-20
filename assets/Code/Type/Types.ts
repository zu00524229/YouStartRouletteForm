// 型別管理 assets\Code\Type\Types.ts

export const SIGNALR_EVENTS = {
  LOTTERY_RESULT: 'LotteryResultEvent',
  LOTTERY_BALANCE: 'LotteryBalanceUpdate', // 錢包更新
} as const;

// ==================== 前端傳給後端：單次下注 ====================
export type PlaceBetRequest = {
  areaName: string; // 區域名稱 (ex: "2X", "4X", "PRIZE_PICK")
  amount: number; // 下注金額
};

//  抽獎事件資料結構（和後端 LotteryResult 對齊）
// ==================== 抽獎事件（SignalR → 前端事件用） ====================
export interface LotteryResultEvent {
  rewardName: string; // 獎項名稱（決定動畫/音效）
  rewardIndex: number; // 落點 index（轉盤停在哪）
  multiplier: number; // 倍率（不中獎為 0）
  payout: number; // 實際派彩
  isJackpot: boolean; // 是否大獎（特效/演出）
  extraPay?: {
    // 觸發加倍才會有
    rewardName: string;
    extraMultiplier: number;
  } | null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ================================ 後端定義 ==================================================
// ==================== 後端定義：加倍資訊 ====================
export type ExtraPayInfo = {
  rewardName: string; // 加倍區域名稱
  extraMultiplier: number; // 加倍倍率
};

// ==================== 後端定義：單次抽獎結果 ====================
export type LotteryResult = {
  rewardName: string; // 獎項名稱
  rewardIndex: number; // 落點 index
  multiplier: number; // 倍率
  payout: number; // 派彩金額
  isJackpot: boolean; // 是否大獎
  extraPay?: ExtraPayInfo | null; // 加倍資訊（可選）
};

// ==================== 後端定義：完整回傳封包 ====================
export type LotteryResponse = {
  // result: LotteryResult; // 單次抽獎結果
  balanceBefore: number; // 抽獎前餘額
  balanceAfter: number; // 抽獎後餘額（含派彩）
  totalBet: number; // 總下注金額
  netChange: number; // 後端自動算好的淨變化 (派彩 - 下注)
  insufficientBalance: boolean; // 是否餘額不足
  message: string; // "OK" | "餘額不足" | "未登入" ...
};
