import { _decorator, Component, Label, Node, Button, director, Prefab, instantiate, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ConfirmDialog')
export class ConfirmDialog extends Component {
  @property(Node) dialogNode: Node = null; // 整個對話框節點
  @property(Label) messageLabel: Label = null; // 顯示訊息文字
  @property(Button) confirmButton: Button = null; // 確認按鈕

  private static _prefab: Prefab = null; // 預載的 Prefab
  private static _instance: Node = null; // 目前顯示的實例
  static instance: ConfirmDialog;

  /** 🔹 呼叫前要先在入口 (例如 Game.ts) preload 一次 Prefab */
  public static registerPrefab(prefab: Prefab) {
    this._prefab = prefab;
  }

  public static show(message: string, onConfirm?: () => void) {
    if (!this._prefab) {
      console.error('❌ ConfirmDialog prefab 尚未註冊');
      return;
    }

    // 如果場景中已經有一個，就先刪掉
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
    }

    // 建立新 Dialog
    const canvas = find('Canvas');
    if (!canvas) {
      console.error('❌ 場景中沒有 Canvas');
      return;
    }

    this._instance = instantiate(this._prefab);
    canvas.addChild(this._instance);

    // 拿到腳本本體
    const dialogComp = this._instance.getComponent(ConfirmDialog);
    if (dialogComp) {
      dialogComp.messageLabel.string = message;
      dialogComp.confirmButton.node.once(Button.EventType.CLICK, () => {
        // 點擊 OK → 關閉並回呼
        this._instance.destroy();
        this._instance = null;
        if (onConfirm) onConfirm();
      });
    }

    this._instance.active = true;
  }
}
