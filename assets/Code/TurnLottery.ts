import { _decorator, Button, CCInteger, Component, director, Label, Node, tween, UIOpacity, Vec3 } from 'cc';
import { ChipManager } from './ChipManager';
import { Toast } from './Toast';
import { SignalRClient } from './Signal/SignalRClient';
import { ExtraPayController } from './ExtraPayController';
import { RLRotation } from './Main_RL/RLRotation';
import { LotteryResponse } from './Type/Types';
const { ccclass, property } = _decorator;

// ✅ 定義倍率與 index 對應表（Super 轉盤用）
type RewardSuperInfo = {
  indices: number[];
  multiplier: number;
};

// ✅ Super 輪盤格子資料表（每格代表的倍率）
const rewardSuperMapTable: Record<string, RewardSuperInfo> = {
  '100X': { indices: [2, 4, 5, 8, 9, 12, 15, 16, 19, 22, 23], multiplier: 100 },
  '800X': { indices: [1, 6, 11, 13, 18, 21], multiplier: 800 },
  '1700X': { indices: [3, 7, 14, 17, 20], multiplier: 1700 },
  '3000X': { indices: [0], multiplier: 3000 },
};

export const GetLotteryRewardRstEvent = 'GetLotteryRewardRstEvent';
export const LotteryResultEvent = 'LotteryResultEvent';

export class LotteryCache {
  public static lastResult: any = null;
} // 存資料給 PICK / MANIA / Super接收

@ccclass('TurnLottery')
export class TurnLottery extends Component {
  @property(ChipManager) chipManager: ChipManager = null; // 連結 ChipManager
  @property(Toast) toast: Toast = null; // 連結 Toast 腳本
  @property(RLRotation) RLRota: RLRotation = null; // 連結 RLRotation
  // @property(SignalRClient) SingalR: SignalRClient = null; // 連結 SignalRclient 腳本

  @property(Node) turnBgNode: Node = null;
  @property(CCInteger) rewardTypeCount: number = 50; // 轉盤中獎品分區數量
  @property(CCInteger) rotatelottertSecs: number = 12; // 轉盤動畫旋轉次數
  @property(CCInteger) lotterSecsL: number = 7; // 抽獎動畫持續時間

  // @property(Node) rlNode: Node = null;    // 水波動畫節點

  @property(Node) targetEffect: Node = null; // 中獎特效節點(輪盤上光圈)
  // @property(Node) bonusGameNode: Node = null;  // 大獎特效節點

  _isLottery: boolean = false; // 是否在抽獎中
  _isAutoRunning: boolean = false; // 是否在自動抽獎中
  Delay_Show = 2;
  private readonly Delay_Hide = 3;
  // private readonly Delay_WinHide = 2;

  // 總共50格(以矯正)
  rewardMap: { [index: number]: string } = {
    0: '2X',
    1: '4X',
    2: '2X',
    3: '6X',
    4: '2X',
    5: '4X',
    6: 'PRIZE_PICK',
    7: '6X',
    8: '2X',
    9: '4X',
    10: '10X',
    11: '2X',
    12: '4X',
    13: '2X',
    14: 'GOLD_MANIA',
    15: '2X',
    16: '6X',
    17: '2X',
    18: '10X',
    19: '2X',
    20: '4X',
    21: '2X',
    22: '6X',
    23: 'PRIZE_PICK',
    24: '2X',
    25: '4X',
    26: '2X',
    27: '6X',
    28: '2X',
    29: '4X',
    30: '2X',
    31: 'GOLD_MANIA',
    32: '2X',
    33: '6X',
    34: '4X',
    35: '2X',
    36: '10X',
    37: '2X',
    38: '4X',
    39: '2X',
    40: 'PRIZE_PICK',
    41: '4X',
    42: '6X',
    43: '2X',
    44: '10X',
    45: '2X',
    46: '4X',
    47: '2X',
    48: 'GOLDEN_TREASURE',
    49: '6X',
  };

  onLoad() {
    this.targetEffect.active = false; // 初始隱藏中獎特效
    console.log('🎯 targetEffect=', this.targetEffect);
    this.RLRota.node.active = false; // 初始隱藏水波特效
    this._isSceneTransitioning = false;
  }

  start() {
    director.on('DO_AUTO_BET', this.onGoLotterEventCallback, this);
  }

  // betAreaName → rewardName（下注區 → 獎勵名稱）
  private static readonly betAreaToRewardNameMap: { [key: string]: string } = {
    Bet_GOLD_MANIA: 'GOLD_MANIA',
    Bet_PRIZE_PICK: 'PRIZE_PICK',
    Bet_GOLDEN_TREASURE: 'GOLDEN_TREASURE',
    Bet_X2: '2X',
    Bet_X4: '4X',
    Bet_X6: '6X',
    Bet_X10: '10X',
  };

  // 🔍 根據下注區取得獎項名稱（後端使用） 獎勵 → 下注區
  public static getRewardNameByBetArea(betArea: string): string | null {
    return this.betAreaToRewardNameMap[betArea] || '2X'; // fallback 預設
  }

  // ========================= 取得下注資料的 JSON 格式(傳給後端) ==========================
  public getBetDataJson() {
    const converted: { [rewardName: string]: number } = {};

    for (const betArea in this.chipManager.betAmounts) {
      const rewardName = TurnLottery.getRewardNameByBetArea(betArea);
      // console.log(`轉換: ${betArea} => ${rewardName}`);
      if (rewardName) {
        converted[rewardName] = this.chipManager.betAmounts[betArea];
      }
    }

    return {
      totalBet: this.chipManager.Bet_Num, // 總下注金額
      betAmounts: converted, // 下注金額對應的獎項名稱
      isAutoMode: this.chipManager._isAutoMode, // 是否為自動下注
    };
  }

  // 下注區 → 獎勵
  private static readonly rewardNameToBetAreaMap: { [key: string]: string } = {
    '2X': 'Bet_X2',
    '4X': 'Bet_X4',
    '6X': 'Bet_X6',
    '10X': 'Bet_X10',
    PRIZE_PICK: 'Bet_PRIZE_PICK',
    GOLD_MANIA: 'Bet_GOLD_MANIA',
    GOLDEN_TREASURE: 'Bet_GOLDEN_TREASURE',
  };

  // 根據下注區域名稱取得對應的獎勵名稱
  public static getRewardByBetArea(rewardName: string): string | null {
    return this.rewardNameToBetAreaMap[rewardName];
  }

  public static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getSuperRewardIndexByMultiplier(multiplier: number): number {
    for (const key in rewardSuperMapTable) {
      const info = rewardSuperMapTable[key];
      if (info.multiplier === multiplier) {
        const randomIndex = info.indices[Math.floor(Math.random() * info.indices.length)];
        return randomIndex;
      }
    }
    console.warn(`❗ GOLDEN_TREASURE 未找到倍率(${multiplier})對應格子，回傳預設 index=23`);
    return 23;
  }

  // ============== 開始抽獎 ========================
  onGoLotterEventCallback() {
    console.log('🎯 進入抽獎邏輯');
    if (this._isLottery) {
      console.log('正在抽獎 請等待此倫抽獎結束');
      return;
    }

    this._isLottery = true;
    console.log('🎰 抽獎開始，_isLottery 設為 true');

    this.chipManager.updateGlobalLabels();

    // === 送出下注資料給後端 ===
    if (this.chipManager) {
      const betData = this.getBetDataJson();
      SignalRClient.sendBetData(betData); // 傳送下注資料給後端
    }
    // 🔍 在送出之前 log 清楚數字
    // console.log('📤 [下注送出前] balanceBefore(前端):', balanceBefore);

    // this.chipManager.offLightButton()
    this.toast.showBetLocked(); // 顯示(BetLocked)
    this.scheduleOnce(() => {
      this.toast.hideBetLocked(); // 隱藏(BetLocked)
    }, this.Delay_Hide); // 2.5秒後隱藏提示
  }

  //============== 抽獎結果回調 ====================
  onGetLotteryRewardRstEventCallback(data: any) {
    console.log('📦 LotteryResultEvent 收到資料：', JSON.stringify(data, null, 2));
    console.log('📦 參數 data 是：', data);

    // 從後端取得獎項資料
    let rewardIndex: number = data.rewardIndex;
    if (rewardIndex === undefined || isNaN(rewardIndex)) {
      console.error('❌ rewardIndex 是 undefined 或 NaN', data);
      return;
    }

    const isSpecialReward = data.rewardName == 'PRIZE_PICK' || data.rewardName == 'GOLD_MANIA' || data.rewardName == 'GOLDEN_TREASURE';

    // ✅ 獨立判斷是否為 GOLDEN_TREASURE，要額外轉換 rewardIndex
    const isGoldenTreasure = data.rewardName === 'GOLDEN_TREASURE';
    let finalRewardIndex = data.rewardIndex;
    if (isGoldenTreasure) {
      finalRewardIndex = this.getSuperRewardIndexByMultiplier(data.multiplier);
    }

    if (isSpecialReward) {
      // ✅ 快取下注金額與獎金（只針對 PRIZE_PICK、GOLD_MANIA、GOLDEN_TREASURE）
      const pickBetAmount = this.chipManager.betAmounts['Bet_PRIZE_PICK'] || this.chipManager.betAmounts['Bet_GOLD_MANIA'] || this.chipManager.betAmounts['Bet_GOLDEN_TREASURE'] || 0;
      const winAmount = (data.multiplier || 0) * pickBetAmount;

      // ✅ 儲存資料準備轉場用
      LotteryCache.lastResult = {
        ...data,
        rewardIndex: finalRewardIndex, // 只有在大獎才覆蓋掉原本的rewardIndex
        pickBetAmount: pickBetAmount,
        winAmount: winAmount,
        balanceAfterWin: this.chipManager.Balance_Num,
        payout: data.payout || 0,
        isJackpot: !!data.isJackpot,
      };
      // LotteryCache.lastResult = data;     // 儲存資料準備轉場用
      console.log('🗂 已快取 Lottery 資料給下一個場景：', data);
      console.log('🗂 已快取 Lottery 資料轉換給GOLDEN_TREASURE 場景：', LotteryCache.lastResult);
    } else {
      //  非三大獎，清除快取避免殘留
      LotteryCache.lastResult = null;
    }

    const rewardName = data.rewardName || this.rewardMap[rewardIndex]; // 後端有給就用，沒有就 fallback
    let multiplier = data.multiplier || 0;

    // 播放轉盤動畫
    // let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    // console.log("✅ turnBgNode 是否為 null：", this.turnBgNode);  // 這裡先驗證
    // console.log("🎯 準備轉盤角度", targetAngle);
    // this.turnBgNode.angle %= 360;   // 隨機角度初始化

    // 顯示 BetLocked 提示
    this.toast.showBetLocked();

    // 等待 2.5 秒後開始轉盤動畫
    this.scheduleOnce(() => {
      this.toast.hideBetLocked();
      this.handleExtraPay(data.extraPay, () => {
        // 執行轉盤動畫

        // 先初始化轉盤角度，避免轉盤累積太多旋轉角度
        this.turnBgNode.angle %= 360;

        // 計算最終目標角度
        let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
        console.log('🎯 準備轉盤角度', targetAngle);

        // 設定超轉角度（轉過頭一點）
        let overshoot = 10; // 10 度超過目標（可調整）
        let overshootAngle = targetAngle - overshoot;

        // 分段時間控制（例如總時間 7 秒：前段 4.5 秒，後段回彈 2.5 秒）
        let overshootTime = this.lotterSecsL - 3.5;
        let reboundTime = 1.0;

        // 播放動畫：先轉超過，再回正
        tween(this.turnBgNode)
          .to(overshootTime, { angle: overshootAngle }, { easing: 'cubicOut' }) // 主旋轉 + 過頭
          .to(reboundTime, { angle: targetAngle }, { easing: 'quadInOut' }) // 小幅回正
          .call(() => {
            //  ExtraPay 命中加倍處理（在這裡進行）
            const hitArea = TurnLottery.getRewardByBetArea(rewardName);
            const extraArea = data.extraPay?.rewardName ? TurnLottery.getRewardByBetArea(data.extraPay.rewardName) : null;
            // const extraMultiplier = data.extraPay?.extraMultiplier || 1;

            if (hitArea && extraArea && hitArea === extraArea) {
              // multiplier *= extraMultiplier;
              console.log(`🎉 命中 EXTRA PAY 區域，倍數提升為 ${multiplier}`);
            }

            this.onWheelAnimationFinished(rewardName, multiplier, data.payout || 0); // 輪盤結束
          })
          .start();
      });
    }, this.Delay_Hide);
  }

  private _isSceneTransitioning: boolean = false; // 是否抽中三大獎(準備轉場所以停止繼續自動下注)

  // ======== 轉盤動畫結束後的處理 ========
  onWheelAnimationFinished(rewardName: string, multiplier: number, payout: number) {
    console.log('🎯 動畫結束 rewardName:', rewardName, 'multiplier:', multiplier, 'payout:', payout);

    let winAmount = payout || 0; // 後端傳來的 payout

    // 找到對應下注區並高亮
    const betKey = TurnLottery.getRewardByBetArea(rewardName);
    if (betKey) {
      this.chipManager.highlightBetArea(betKey);
    }

    // ===== 特殊獎項處理 =====
    switch (rewardName) {
      case 'GOLDEN_TREASURE':
        this._isSceneTransitioning = true;
        this.toast.showBonusUI('SUPER');

        this.scheduleOnce(() => {
          this.toast.hideBonusUI();

          // 顯示並啟動 main RL rotation effect 節點動畫
          if (this.RLRota) {
            this.RLRota.node.active = true;

            this.RLRota.playRotationEffect(); // 持續 3 秒左右

            this.scheduleOnce(() => {
              director.loadScene('SUPER'); // 動畫結束轉場
            }, 3); // 水波動畫3秒後轉場
          } else {
            console.warn('❌ 找不到 main RL rotation effect 節點！');
            director.loadScene('SUPER'); // 安全 fallback
          }
        }, this.Delay_Hide); // hide 完再做動畫
        break;

      case 'GOLD_MANIA':
        this._isSceneTransitioning = true;
        this.toast.showBonusUI('MANIABOX');
        this.scheduleOnce(() => {
          this.toast.hideBonusUI();
          director.loadScene('MANIA');
          // 未來會有轉場 到特殊畫面再次抽獎
        }, this.Delay_Hide);
        //  抽完後再回到原畫面繼續轉盤
        break;
      case 'PRIZE_PICK':
        this._isSceneTransitioning = true;
        this.toast.showBonusUI('PICKPK');
        this.scheduleOnce(() => {
          this.toast.hideBonusUI();
          director.loadScene('PICK');
          // 未來會有轉場 到特殊畫面再次抽獎
        }, this.Delay_Hide);
        //  抽完後再回到原畫面繼續轉盤
        break;
      case '10X':
      case '6X':
      case '4X':
      case '2X':
        this.scheduleOnce(() => {
          this.toast.showWinningTips(multiplier, winAmount);
        }, this.Delay_Show); // 延遲 x 秒後顯示中獎提示
        break;
      // default:
      //     this.scheduleOnce(() => {
      //         this.toast.showWinningTips(multiplier, winAmount);
      //     }, this.Delay_Show); // 延遲 x 秒後顯示中獎提示
    }

    // if (winAmount > 0) {
    //   // if (['GOLDEN_TREASURE', 'GOLD_MANIA', 'PRIZE_PICK'].indexOf(rewardName) === -1) {
    //   //   this.chipManager.Win_Num += winAmount; // 獲得獎金
    //   //   this.chipManager.updateGlobalLabels(); // 更新畫面
    //   //   // this.showTargetEffect(); // ✅ 只做特效，不更新得分
    //   // }

    //   this.scheduleOnce(() => {
    //     //  若正在轉場（如水波動畫還在跑），就不進行 reset 與自動下注
    //     if (this._isSceneTransitioning) {
    //       console.log('⛔ 正在轉場動畫中，阻止畫面 reset 與自動下注');
    //       return;
    //     }

    //     // 1.隱藏中獎提示
    //     this.toast.hideWinningTips();

    //     // 2.更新餘額（後端 balanceAfter 為準）
    //     // ✅ 再次確保餘額同步
    //     // console.log('第二次設定 Balance_Num:', balanceAfter, resp?.balanceAfter, this.chipManager.Balance_Num);
    //     // this.chipManager.Balance_Num = balanceAfter;
    //     this.chipManager.updateGlobalLabels(); // 更新畫面

    //     // 3.清除籌碼與重設UI
    //     this.chipManager.clearAllBets(); // 清除籌碼與結算
    //     this.chipManager.updateStartButton(); // 若有下注且輪盤停止，開啟操作按鈕
    //     this.chipManager.AllButton.interactable = true;

    //     // 顯示提示(玩家下注)新的回合
    //     this.toast.showPleaseBetNow();
    //     this._isLottery = false;
    //     director.emit('LotteryEnded'); // 更新 StartButton (重啟)
    //     this.chipManager.clearAllExtraPayMarks();
    //     this.chipManager.onLightBetArea();
    //     // this.chipManager.Win_Num = 0;

    //     if (this.chipManager._isAutoMode) {
    //       this.chipManager.offLightButton(); // 關閉自動下注按鈕
    //       // this.chipManager.offLightBetArea()
    //     }

    //     this.scheduleOnce(() => {
    //       this.toast.hidePleaseBetNow();

    //       if (this.chipManager._isAutoMode) {
    //         this.scheduleOnce(() => {
    //           this.onGoLotterEventCallback(); // 下一輪自動抽獎（不再呼叫 onStartButton）
    //           director.emit('DO_AUTO_BET');
    //         }, 1);
    //       }
    //     }, this.Delay_Hide); // X 秒後隱藏提示(Auto 模式下)
    //   }, this.Delay_Hide + this.Delay_Show);
    // } else {
    //   // 🔴 沒中獎也要處理：清除籌碼與 UI 重置
    //   this.scheduleOnce(() => {
    //     this.chipManager.clearAllBets(); // 清除下注與籌碼
    //     this.chipManager.updateGlobalLabels(); // 更新畫面數值
    //     this.chipManager.updateStartButton(); // 啟用按鈕（若上局有下注）
    //     this.chipManager.AllButton.interactable = true;

    //     this.toast.showPleaseBetNow();
    //     this._isLottery = false; // 重置抽獎狀態
    //     director.emit('LotteryEnded'); // 更新 StartButton (重啟)
    //     this.chipManager.clearAllExtraPayMarks();
    //     this.chipManager.onLightBetArea();

    //     if (this.chipManager._isAutoMode) {
    //       this.chipManager.offLightButton(); // 關閉自動下注按鈕
    //     }

    //     this.scheduleOnce(() => {
    //       // ✅ 若正在轉場（如水波動畫還在跑），就不進行 reset 與自動下注
    //       if (this._isSceneTransitioning) {
    //         console.log('⛔ 正在轉場動畫中，阻止畫面 reset 與自動下注');
    //         return;
    //       }
    //       this.toast.hidePleaseBetNow();

    //       if (this.chipManager._isAutoMode) {
    //         this.scheduleOnce(() => {
    //           this.onGoLotterEventCallback(); // 下一輪自動抽獎（不再呼叫 onStartButton）
    //         }, 1);
    //       }
    //     }, this.Delay_Hide); // 3秒後隱藏提示(Auto 模式下)
    //   }, this.Delay_Hide + this.Delay_Show);
    // }
  }

  //  中獎特效：顯示 target 光圈並閃爍
  public showTargetEffect() {
    try {
      if (!this.targetEffect) {
        console.warn('❗ targetEffect 為 null');
        return;
      }

      const uiOpacity = this.targetEffect.getComponent(UIOpacity);
      if (!uiOpacity) {
        console.warn('❗ UIOpacity 組件未綁定在 targetEffect 上');
        return;
      }

      this.targetEffect.active = true;
      uiOpacity.opacity = 255; // 確保初始透明

      tween(uiOpacity) // ✅ 對的對象
        .repeat(
          5.5,
          tween()
            .to(0.5, { opacity: 0 }, { easing: 'fade' }) // 消失
            .to(0.5, { opacity: 255 }, { easing: 'fade' }) // 出現
        )
        .call(() => {
          this.targetEffect.active = false;
          uiOpacity.opacity = 255; // 重置
        })
        .start();

      // console.log("✅ tween 成功啟動");
    } catch (error) {
      console.error('❌ showTargetEffect 發生錯誤：', error);
      console.log('🔎 this.targetEffect =', this.targetEffect);
      if (this.targetEffect) {
        console.log('🔎 getComponent(UIOpacity) =', this.targetEffect.getComponent(UIOpacity));
      }
    }
  }

  // ExtraPay
  private handleExtraPay(extraPay: any, callback: () => void) {
    if (!extraPay?.rewardName || !extraPay?.extraMultiplier) {
      callback();
      return;
    }

    const betArea = TurnLottery.getRewardByBetArea(extraPay.rewardName);
    if (!betArea) {
      console.warn('⚠ 無法從 rewardName 取得下注區');
      callback();
      return;
    }

    this.toast.showExtraPay(); // 顯示提示動畫

    // 顯示下注區的 x2
    // const areaNode = this.chipManager.getBetAreaNode(betArea);
    const index = this.chipManager.betAreaMap[betArea];
    const areaNode = this.chipManager.betAreaNodes[index];
    const extraCtrl = areaNode?.getComponent(ExtraPayController);
    extraCtrl?.show();

    // 等動畫播完後 callback（開始轉盤）
    this.scheduleOnce(() => {
      this.toast.hideExtraPay(); // 隱藏提示
      callback();
    }, 2);
  }
}
