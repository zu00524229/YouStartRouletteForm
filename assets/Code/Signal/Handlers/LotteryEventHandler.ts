import { _decorator, Component, director, Node } from 'cc';
import { LotteryResponse, LotteryResultEvent, SIGNALR_EVENTS, UnifiedLotteryEvent } from '../../Type/Types';
import { ToastMessage } from '../../Managers/Toasts/ToastMessage';
import { ConfirmDialog } from '../../Managers/Toasts/ConfirmDialog';
import { TurnLottery } from '../../TurnLottery';
import { BetManager } from '../../Managers/Bet/BetManager';
import { ToolButtonsController } from '../../Managers/ToolButtonsController';
const { ccclass, property } = _decorator;

@ccclass('LotteryEventHandler')
export class LotteryEventHandler extends Component {
  // ========== 抽獎事件註冊（只註冊一次） ==========
  /** 註冊抽獎相關事件 */
  public static registerLotteryHandlers(hubProxy: any) {
    console.log('✅ 已註冊事件 broadcastLotteryResult / lotteryResult');

    if (!hubProxy) return;
    hubProxy.off('lotteryResult');
    hubProxy.off('broadcastLotteryResult');

    let lastResult: LotteryResultEvent | null = null;
    let lastBalance: LotteryResponse | null = null;

    // 🚀 整合器：檢查是否兩邊都回來了
    const tryEmitUnified = () => {
      if (lastResult && lastBalance) {
        const unified: UnifiedLotteryEvent = {
          ...lastResult,
          roundId: String(lastBalance.roundId), // 局號
          balanceBefore: lastBalance.balanceBefore,
          balanceAfter: lastBalance.balanceAfter,
          totalBet: lastBalance.totalBet,
          netChange: lastBalance.netChange,
          insufficientBalance: lastBalance.insufficientBalance,
          message: lastBalance.message,
        };

        console.log('🚀 發射 UnifiedLotteryEvent：', unified);
        director.emit(SIGNALR_EVENTS.UNIFIED_LOTTERY_EVENT, unified);

        // 用完清掉，避免舊資料卡住
        lastResult = null;
        lastBalance = null;
      }
    };

    // 🎯 轉盤動畫用：只有抽獎結果
    hubProxy.on('broadcastLotteryResult', (result: LotteryResultEvent) => {
      console.log('🎯 收到 broadcastLotteryResult：', result);
      lastResult = result;
      tryEmitUnified();
    });
    // 📦 完整封包：錢包 / UI 用
    hubProxy.on('lotteryResult', (resp: LotteryResponse) => {
      console.log('📦 收到 lotteryResult (完整封包)：', resp);

      if (resp.message && resp.message !== 'OK') {
        if (resp.message.includes('斷線')) {
          // 🔌 斷線 / 會話失效
          ConfirmDialog.show(resp.message, () => {
            console.warn('⚠️ 玩家斷線 → 回登入畫面');
            director.loadScene('Login'); // ✅ 這裡場景名稱就是 "Login"，跟你的資源資料夾一致
          });
          return;
        }

        if (resp.insufficientBalance) {
          // 💰 餘額不足
          ToastMessage.showToast(resp.message || '餘額不足！');
        } else {
          // ❌ 其他錯誤（超過下注上限等）
          ToastMessage.showToast(resp.message || '超過下注上限!');
        }

        // ⚡ 修正：重置遊戲狀態，避免卡住
        const turnLottery = director.getScene().getComponentInChildren(TurnLottery) as any;
        if (turnLottery) turnLottery._isLottery = false;

        const betManager = director.getScene().getComponentInChildren(BetManager) as any;
        if (betManager) {
          betManager.onLightBetArea(); // ✅ 用既有的方法開下注區
          betManager.onCloseMask(); // ✅ 關掉 AutoButton 遮罩
        }
        const toolButtons = director.getScene().getComponentInChildren(ToolButtonsController) as any;
        if (toolButtons) toolButtons.updateStartButton(); // 讓按鈕恢復

        // 額外清掉 lastResult，避免殘留舊資料觸發動畫
        lastResult = null;
        lastBalance = null;
        return;
      }

      // ✅ 正常情況 → 記錄下來
      lastBalance = resp;
      tryEmitUnified();
    });
  }
}
