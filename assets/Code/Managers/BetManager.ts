// 專門處理下注 UI：下注區亮起 / 關燈、工具按鈕狀態、Auto 遮罩、ExtraPay 清除
import { _decorator, Button, Component, Node } from 'cc';
import { BetHighlighter } from '../Animation/BetHightlight';
import { ExtraPayController } from '../Managers/ExtraPayController';
const { ccclass, property } = _decorator;

@ccclass('BetManager')
export class BetManager extends Component {
  @property(Node) betAreaRoot: Node = null; // 拖 BetArea 進來就好
  @property(Node) toolButtonsRoot: Node = null; // 拖 ToolButtons 進來

  @property({ type: Button }) AutoButton: Button = null;

  // toolButtons 按鈕節點
  public AllButton: Button = null;
  public X2Button: Button = null;
  public AgainButton: Button = null;
  public UndoButton: Button = null;
  public ClearButton: Button = null;

  // 下注區節點
  public GOLDENTREASUREBet: Button = null;
  public GOLDMANIABet: Button = null;
  public PRIZEPICKBet: Button = null;
  public X2Bet: Button = null;
  public X4Bet: Button = null;
  public X6Bet: Button = null;
  public X10Bet: Button = null;

  public Delay_Show: number = 2;
  // === 資料結構 ===
  public betAreaNodes: Node[] = [];
  private toolButtons: { [name: string]: Button } = {};
  public betAreaMap: { [areaName: string]: number } = {
    Bet_PRIZE_PICK: 0,
    Bet_GOLD_MANIA: 1,
    Bet_GOLDEN_TREASURE: 2,
    Bet_X2: 3,
    Bet_X4: 4,
    Bet_X6: 5,
    Bet_X10: 6,
  };

  onLoad() {
    // ==== ToolButtons ====
    this.AllButton = this.toolButtonsRoot.getChildByName('Allbet_Button')?.getComponent(Button);
    this.X2Button = this.toolButtonsRoot.getChildByName('x2_Button')?.getComponent(Button);
    this.AgainButton = this.toolButtonsRoot.getChildByName('Again_Button')?.getComponent(Button);
    this.UndoButton = this.toolButtonsRoot.getChildByName('Undo_Button')?.getComponent(Button);
    this.ClearButton = this.toolButtonsRoot.getChildByName('Clear_Button')?.getComponent(Button);
    this.AutoButton = this.toolButtonsRoot.getChildByName('Auto_Button')?.getComponent(Button);

    // ==== BetArea ====
    this.GOLDENTREASUREBet = this.betAreaRoot.getChildByName('Bet_GOLDEN_TREASURE')?.getComponent(Button);
    this.GOLDMANIABet = this.betAreaRoot.getChildByName('Bet_GOLD_MANIA')?.getComponent(Button);
    this.PRIZEPICKBet = this.betAreaRoot.getChildByName('Bet_PRIZE_PICK')?.getComponent(Button);
    this.X2Bet = this.betAreaRoot.getChildByName('Bet_X2')?.getComponent(Button);
    this.X4Bet = this.betAreaRoot.getChildByName('Bet_X4')?.getComponent(Button);
    this.X6Bet = this.betAreaRoot.getChildByName('Bet_X6')?.getComponent(Button);
    this.X10Bet = this.betAreaRoot.getChildByName('Bet_X10')?.getComponent(Button);
  }

  // ======== 判斷按鈕 是否啟用 (下注區有籌碼(且沒在轉動) 就啟動按鈕) =========
  // public setButtonsState(params: { hasAnyBet: boolean; hasLastBet: boolean; isLotteryRunning: boolean; isAutoMode: boolean }) {
  //   const { hasAnyBet, hasLastBet, isLotteryRunning, isAutoMode } = params;
  //   // ===== 控制(Start / X2 / Undo / Clear) 是否啟動 ====
  //   const shouldEnableButtons = hasAnyBet && !isLotteryRunning && !isAutoMode;

  //   // console.log('toolButtons keys:', Object.keys(this.toolButtons)); // 檢查撈到的節點名稱
  //   if (this.toolButtons['x2_Button']) this.toolButtons['x2_Button'].interactable = shouldEnableButtons;
  //   if (this.toolButtons['Undo_Button']) this.toolButtons['Undo_Button'].interactable = shouldEnableButtons;
  //   if (this.toolButtons['Clear_Button']) this.toolButtons['Clear_Button'].interactable = shouldEnableButtons;
  //   if (this.toolButtons['Allbet_Button']) this.toolButtons['Allbet_Button'].interactable = !isAutoMode && !isLotteryRunning;
  //   // ===== 控制下注區是否可互動 =====
  //   const shouldEnableBet = !isLotteryRunning && !isAutoMode;
  //   this.betAreaNodes.forEach((node) => {
  //     const btn = node.getComponent(Button);
  //     if (btn) btn.interactable = shouldEnableBet;
  //   });

  //   // ===== Auto / Again 狀態切換 =====
  //   if (this.AutoButton) {
  //     if (isAutoMode) {
  //       this.AutoButton.node.active = true;
  //       this.AutoButton.interactable = true;
  //     } else if (hasAnyBet) {
  //       this.AutoButton.node.active = true;
  //       this.AutoButton.interactable = true;
  //     } else if (hasLastBet) {
  //       this.AutoButton.node.active = true;
  //       this.AutoButton.interactable = true; // 這裡可依需求改成 false
  //     } else {
  //       this.AutoButton.node.active = true;
  //       this.AutoButton.interactable = false;
  //     }
  //   }
  // }

  // ==== 按下 START 後按鈕關燈 (鎖定所有下注與操作按鈕) ======
  offLightButton(fromLongPress: boolean = false) {
    this.AllButton.interactable = false;
    this.X2Button.interactable = false;
    // this.AgainButton.interactable = false;
    this.UndoButton.interactable = false;
    this.ClearButton.interactable = false;
    this.GOLDENTREASUREBet.interactable = false;
    this.GOLDMANIABet.interactable = false;
    this.PRIZEPICKBet.interactable = false;
    this.X2Bet.interactable = false;
    this.X4Bet.interactable = false;
    this.X6Bet.interactable = false;
    this.X10Bet.interactable = false;
    console.log('🔧 offLightButton called, fromLongPress =', fromLongPress);
    if (!fromLongPress) {
      const mask = this.AutoButton.node.getChildByName('Mask');
      if (mask) mask.active = true;
    }
  }

  // ==== 抽獎結束後按鈕開燈 (解鎖所有下注與操作按鈕) ======
  onLightBetArea() {
    this.GOLDENTREASUREBet.interactable = true;
    this.GOLDMANIABet.interactable = true;
    this.PRIZEPICKBet.interactable = true;
    this.X2Bet.interactable = true;
    this.X4Bet.interactable = true;
    this.X6Bet.interactable = true;
    this.X10Bet.interactable = true;
  }

  // 關閉遮罩(Mask)
  onCloseMask() {
    const mask = this.AutoButton.node.getChildByName('Mask');
    if (mask) mask.active = false;
  }

  // // ================= 高亮下注區域（用於中獎提示或視覺效果）=======================
  // public highlightBetArea(betKey: string) {
  //   // console.log("🎯 highlightBetArea:", betKey);
  //   // console.log("👉 對應 index:", index);
  //   const index = this.betAreaMap[betKey];
  //   const node = this.betAreaNodes[index];
  //   if (!node) return;

  //   const highlighter = node.getComponent(BetHighlighter); // 撈子節點getComponentInChildren  撈父節點getComponent
  //   if (highlighter) {
  //     this.scheduleOnce(() => {
  //       highlighter.showWinEffect();
  //     }, this.Delay_Show);
  //   }

  //   const hoverLight = node.getChildByName('framelight');
  //   console.log('👉 hoverLight 節點:', hoverLight);
  //   if (hoverLight) {
  //     hoverLight.active = true; // 顯示高亮效果

  //     this.scheduleOnce(() => {
  //       hoverLight.active = false; // 延遲後隱藏高亮效果
  //     }, this.Delay_Show + 1);
  //   }

  //   // 2 對應下注按鈕高亮（啟用可互動）
  //   switch (betKey) {
  //     case 'Bet_X2':
  //       this.X2Bet.interactable = true;
  //       break;
  //     case 'Bet_X4':
  //       this.X4Bet.interactable = true;
  //       break;
  //     case 'Bet_X6':
  //       this.X6Bet.interactable = true;
  //       break;
  //     case 'Bet_X10':
  //       this.X10Bet.interactable = true;
  //       break;
  //     case 'Bet_PRIZE_PICK':
  //       this.PRIZEPICKBet.interactable = true;
  //       break;
  //     case 'Bet_GOLD_MANIA':
  //       this.GOLDMANIABet.interactable = true;
  //       break;
  //     case 'Bet_GOLDEN_TREASURE':
  //       this.GOLDENTREASUREBet.interactable = true;
  //       break;
  //   }
  // }

  // ============== 清除下注區上的 ExtraPay 標記 ==============
  public clearAllExtraPayMarks() {
    for (const node of this.betAreaNodes) {
      const controller = node.getComponentInChildren(ExtraPayController);
      if (controller) controller.hide(); // hide() 就是讓 .active = false
    }
  }
}
