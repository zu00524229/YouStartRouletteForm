// 專門處理下注 UI：下注區亮起 / 關燈、工具按鈕狀態、Auto 遮罩、ExtraPay 清除
import { _decorator, Button, Component, EventTouch, Node } from 'cc';
import { BetHighlighter } from '../Animation/BetHightlight';
import { ExtraPayController } from './ExtraPayController';
import { ChipManager } from './ChipManager';
import { Toast } from './Toasts/Toast';
const { ccclass, property } = _decorator;

@ccclass('BetManager')
export class BetManager extends Component {
  @property(Node) betAreaRoot: Node = null; // 拖 BetArea 進來就好
  @property(Node) toolButtonsRoot: Node = null; // 拖 ToolButtons 進來
  @property(ChipManager) chipManager: ChipManager = null; // 拖 有掛載 ChipManager 腳本的節點
  @property(Toast) toast: Toast = null; // 拖 有掛載 Toast 腳本的節點

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

  // ========== 下注區域點擊事件 ==========
  public BetClick(event: EventTouch) {
    if (this.canPlaceBet()) {
      this.chipManager.onBetClick(event);
    }
  }

  // 禁止下注
  public canPlaceBet() {
    return !this.toast.BetLocked.active && !this.chipManager.isLotteryRunning() && !this.chipManager._isAutoMode;
  }

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
}
