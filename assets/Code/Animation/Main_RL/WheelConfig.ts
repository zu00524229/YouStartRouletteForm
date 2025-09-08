// WheelConfig.ts
// 轉盤動畫同步變數

// 用於 轉盤/指針 動畫1共用變數
export const WheelSyncConfig = {
  lotterSecsL: 7, // 抽獎動畫持續時間
  overshootTime: 3.5, // 超轉段時間
  reboundTime: 1.0, // 回正時間
  overshootAngle: 10, // 超轉角度
};

// 用於 轉盤/指針 動畫2共用變數
export const WheelConfig = {
  lotterSecsL: 7, // 抽獎動畫持續時間
  delayPointerSwing: 0.8, // 高點停留秒數
  reboundTime: 1.0, // 回正時間（建議統一）
  overshootTime: 3.5, // 超轉段時間
  overshootAngle: 5, // 超轉角度
};

// 用於 轉盤/指針 動畫3共用變數
export const WheelThreeConfig = {
  lotterSecsL: 7, // 總秒數
  delayPointerSwing: 1.5, // 停留時間
  reboundTime: 0.8, // 回正時間
  // overshootAngle: 5, // 超轉角度（動畫用）
  preStopAngle: 3.6, // 提前停在終點前的角度
};
