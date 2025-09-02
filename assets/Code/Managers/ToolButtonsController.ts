import { _decorator, Button, Component, find, Node } from 'cc';
import { ChipManager } from './Bet/ChipManager';
const { ccclass, property } = _decorator;

@ccclass('ToolButtonsController')
export class ToolButtonsController extends Component {
  @property({ type: Button }) AllButton: Button = null; // 全部下注按鈕
  @property({ type: Button }) X2Button: Button = null; // 雙倍按鈕
  @property({ type: Button }) AutoButton: Button = null; // 自動按鈕(待刪除)
  @property({ type: Button }) UndoButton: Button = null;
  @property({ type: Button }) ClearButton: Button = null;

  private chipManager: ChipManager = null;
  public isLotteryRunning = () => false; // 預設為 false（避免報錯）

  onLoad() {
    // 找到同一場景裡的 ChipManager 節點
    const chipManagerNode = find('Canvas/ChipManager');
    this.chipManager = chipManagerNode.getComponent(ChipManager);
    this.chipManager.node.on('bet-updated', this.updateStartButton, this);
    // if (this.chipManager) {
    //   this.chipManager.node.on('bet-updated', this.updateStartButton, this);
    // } else {
    //   console.warn('❌ 找不到 ChipManager Node');
    // }
  }

  // ======== 判斷按鈕 是否啟用 (下注區有籌碼(且沒在轉動) 就啟動按鈕) =========
  updateStartButton() {
    const isLotteryRunning = this.isLotteryRunning(); // 輪盤是否轉動
    const isAutoMode = this.chipManager._isAutoMode;
    // ===== 控制 Again / Auto 狀態按鈕 =====
    const hasLastBet = Object.keys(this.chipManager.lastBetAmounts).length > 0;
    const hasAnyBet = Object.keys(this.chipManager.betAmounts).some((key) => this.chipManager.betAmounts[key] > 0); // 有任何下注區有籌碼

    // ===== 控制(Start / X2 / Undo / Clear) 是否啟動 ====
    const shouldEnableButtons = hasAnyBet && !isLotteryRunning && !isAutoMode;
    this.AutoButton.interactable = shouldEnableButtons;
    // this.StartButton.interactable = shouldEnableButtons;
    this.X2Button.interactable = shouldEnableButtons;
    this.UndoButton.interactable = shouldEnableButtons;
    this.ClearButton.interactable = shouldEnableButtons;

    // this.AllButton.interactable = !isAutoMode && !isLotteryRunning;
    // ===== 控制下注區區塊是否可互動 =====
    const shouldEnableBet = !this.isLotteryRunning() && !this.chipManager._isAutoMode;

    // 遍歷所有下注區節點，把 Button 狀態打開/關閉
    for (const node of this.chipManager.getBetAreas()) {
      const btn = node.getComponent(Button);
      if (btn) btn.interactable = shouldEnableBet;
    }

    this.AllButton.interactable = shouldEnableBet;

    if (this.chipManager._isAutoMode) {
      // Auto 模式開啟
      this.AutoButton.node.active = true;
      this.AutoButton.interactable = true;
      // this.AgainButton.node.active = false;
    } else if (hasAnyBet) {
      // 有下注 → 顯示 Auto，Again 隱藏
      this.AutoButton.node.active = true;
      this.AutoButton.interactable = true;
      // this.AgainButton.node.active = false;
    } else if (hasLastBet) {
      // 有上局下注紀錄
      // this.AgainButton.node.active = true;
      // this.AgainButton.interactable = true;
      this.AutoButton.node.active = true;
    } else {
      // 無可操作項目
      // this.AgainButton.node.active = true;
      // this.AgainButton.interactable = false;
      this.AutoButton.node.active = true;
    }
  }
}
