import { _decorator, Button, Component, Node } from 'cc';
import { BetHighlighter } from '../BetHightlight';
import { ExtraPayController } from '../ExtraPayController';
const { ccclass, property } = _decorator;

@ccclass('BetManager')
export class BetManager extends Component {
  // ChipManager 在 onLoad 時會把這些資料傳進來
  // @property([Node]) betAreaNodes: Node[] = [];
  @property(Node) betAreaRoot: Node = null; // 拖 BetArea 進來就好
  @property(Node) toolButtonsRoot: Node = null; // 拖 ToolButtons 進來

  @property({ type: Button }) AutoButton: Button = null;

  public Delay_Show: number = 2;
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
    // ===== 綁定 BetArea =====
    if (this.betAreaRoot) {
      this.betAreaNodes = this.betAreaRoot.children;
      this.betAreaNodes.forEach((node, index) => {
        this.betAreaMap[node.name] = index;
      });
    }

    // ===== 綁定 ToolButtons =====
    if (this.toolButtonsRoot) {
      this.toolButtonsRoot.children.forEach((child) => {
        const btn = child.getComponent(Button);
        if (btn) {
          this.toolButtons[child.name] = btn;
        }
      });
    }
  }

  // ==== 按下 START 後按鈕關燈 (鎖定所有下注與操作按鈕) ======
  offLightButton(fromLongPress: boolean = false) {
    Object.keys(this.toolButtons).forEach((key) => {
      const btn = this.toolButtons[key];
      btn.interactable = false;
    });

    console.log('🔧 offLightButton called, fromLongPress =', fromLongPress);
    if (!fromLongPress && this.AutoButton) {
      const mask = this.AutoButton.node.getChildByName('Mask');
      if (mask) mask.active = true;
    }
  }

  onLightBetArea() {
    Object.keys(this.toolButtons).forEach((key) => {
      const btn = this.toolButtons[key];
      btn.interactable = true;
    });
  }

  // 關閉遮罩(Mask)
  onColseMask() {
    const mask = this.AutoButton.node.getChildByName('Mask');
    if (mask) mask.active = false;
  }

  // 高亮下注區域（用於中獎提示或視覺效果）
  public highlightBetArea(betKey: string) {
    // console.log("🎯 highlightBetArea:", betKey);
    // console.log("👉 對應 index:", index);
    const index = this.betAreaMap[betKey];
    const node = this.betAreaNodes[index];
    if (!node) return;

    const highlighter = node.getComponent(BetHighlighter); // 撈子節點getComponentInChildren  撈父節點getComponent
    if (highlighter) {
      this.scheduleOnce(() => {
        highlighter.showWinEffect();
      }, this.Delay_Show);
    }

    const hoverLight = node.getChildByName('framelight');
    console.log('👉 hoverLight 節點:', hoverLight);
    if (hoverLight) {
      hoverLight.active = true; // 顯示高亮效果

      this.scheduleOnce(() => {
        hoverLight.active = false; // 延遲後隱藏高亮效果
      }, this.Delay_Show + 1);
    }

    // ✅ 不用 switch，直接用字典找
    const targetBtn = this.toolButtons[betKey];
    if (targetBtn) targetBtn.interactable = true;
  }

  // 清除下注區上的 ExtraPay 標記
  public clearAllExtraPayMarks() {
    for (const node of this.betAreaNodes) {
      const controller = node.getComponentInChildren(ExtraPayController);
      if (controller) controller.hide(); // hide() 就是讓 .active = false
    }
  }
}
