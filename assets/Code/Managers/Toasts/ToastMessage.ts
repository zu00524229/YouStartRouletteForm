import { _decorator, Component, find, instantiate, Label, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ToastMessage')
export class ToastMessage extends Component {
  // @property(Node) toastNode: Node = null; // 提示訊息(餘額不足)
  @property(Label) toastText: Label = null; // 提示訊息文字

  private static _prefab: Prefab = null;
  private static _instance: Node = null;

  /** ✅ 在入口註冊 Prefab */
  public static registerPrefab(prefab: Prefab) {
    this._prefab = prefab;
  }

  // 🔑 單例
  static instance: ToastMessage;

  //============================== 一般提示訊息 ============================

  public static showToast(message: string) {
    if (!this._prefab) {
      console.error('❌ ToastMessage prefab 尚未註冊');
      return;
    }

    // 如果已經有一個 Toast，就先刪掉
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
    }

    // 動態生成
    const canvas = find('Canvas');
    if (!canvas) {
      console.error('❌ 場景中沒有 Canvas');
      return;
    }

    this._instance = instantiate(this._prefab);
    canvas.addChild(this._instance);

    // 設定文字
    const comp = this._instance.getComponent(ToastMessage);
    if (comp && comp.toastText) {
      comp.toastText.string = message;
    }

    this._instance.active = true;

    // ✅ 幾秒後自動消失
    setTimeout(() => {
      if (this._instance) {
        this._instance.destroy();
        this._instance = null;
      }
    }, 2000);
  }
}
