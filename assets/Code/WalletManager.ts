import { _decorator, Component, director } from 'cc';
import { LotteryResponse, SIGNALR_EVENTS } from './Type/Types'; // 型別呼叫
import { ChipManager } from './ChipManager';
import { TurnLottery } from './TurnLottery';

const { ccclass, property } = _decorator;

@ccclass('WalletManager')
export class WalletManager extends Component {
  chipManager: ChipManager;
  toast: any;
  _isLottery: boolean = false;
  Delay_Hide: number = 3;

  start() {
    console.log('📡 WalletManager 啟動，準備監聽金流事件...');
    // 🎯 監聽完整封包：LotteryResponse
    director.on(SIGNALR_EVENTS.LOTTERY_BALANCE, (resp: LotteryResponse) => {
      console.log('💰 [WalletManager] 收到金流事件:', resp);

      // 1. 更新餘額 / 本局得分（只吃後端數字）
      this.chipManager.Balance_Num = resp.balanceAfter;
      this.chipManager.Win_Num = resp.netChange > 0 ? resp.netChange : 0;
      this.chipManager.updateGlobalLabels();

      // 2. 重置下注 UI
      this.chipManager.clearAllBets();
      this.chipManager.updateStartButton();
      this.chipManager.AllButton.interactable = true;

      // 3. 顯示提示
      this.toast.showPleaseBetNow();
      this.chipManager.clearAllExtraPayMarks();
      // this.chipManager.onLightBetArea();
      // this.chipManager.setAllMasksActive(true); // 開啟所有mask-2
      this._isLottery = false;
      director.emit('LotteryEnded');
      console.log('🔔 [WalletManager] 已發送 LotteryEnded 事件');

      // 4. Auto 模式判斷
      if (this.chipManager._isAutoMode) {
        this.scheduleOnce(() => {
          // ⛔ 檢查轉場，避免卡住
          if ((this.node as any)._isSceneTransitioning) {
            console.log('⛔ 正在轉場動畫中，阻止自動下注');
            return;
          }
          this.toast.hidePleaseBetNow();
          director.emit('DO_AUTO_BET'); // 🔔 觸發自動下注
        }, this.Delay_Hide);
      }
    });
  }
}
